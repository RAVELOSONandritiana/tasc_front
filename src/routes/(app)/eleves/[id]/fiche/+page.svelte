<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Printer, User } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import type { PageProps } from '../$types';
	import { formatClasseNom } from '$lib/utils';

	const { data }: PageProps = $props();
	const eleve = data.eleve;
	const absences = (data.absences || []) as {
		id: string;
		date: string;
		duree?: string | null;
		motif?: string | null;
	}[];

	function fmtDate(iso: string): string {
		if (!iso) return '';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '';
		const j = String(d.getDate()).padStart(2, '0');
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const y = d.getFullYear();
		const h = String(d.getHours()).padStart(2, '0');
		const min = String(d.getMinutes()).padStart(2, '0');
		return `${j}/${m}/${y}${h !== '00' || min !== '00' ? ' ' + h + ':' + min : ''}`;
	}

	function situation(eleve: typeof data.eleve): string {
		if (eleve.redoublant) return 'R';
		const s = (eleve.situation || '').toUpperCase();
		if (s.startsWith('R')) return 'R';
		return 'P';
	}

	// Regroupe les absences par paquets de 3, séparés par le libellé
	// "Aterin'ny Ray aman-dReny" (comme sur le carnet papier).
	const groupes = $derived.by(() => {
		const g: typeof absences[] = [];
		for (let i = 0; i < absences.length; i += 3) g.push(absences.slice(i, i + 3));
		// Toujours au moins un groupe (même vide) pour l'impression.
		return g.length ? g : [[] as typeof absences];
	});

	let saving = $state(false);
	let savedMsg = $state(false);
</script>

<svelte:head>
	<title>Fiche élève — {eleve.nom} {eleve.prenom}</title>
</svelte:head>

<div class="no-print mb-4 flex items-center justify-between gap-2">
	<Button variant="outline" onclick={() => history.back()}>Retour</Button>
	<Button onclick={() => window.print()}>
		<Printer class="mr-2 size-4" /> Télécharger / Imprimer (PDF)
	</Button>
</div>

<div class="fiche-papier mx-auto max-w-3xl bg-white p-6 text-black shadow print:shadow-none">
	<!-- En-tête : photo + identité -->
	<div class="flex gap-4 border-b-2 border-black pb-4">
		<div class="photo-placeholder flex size-32 shrink-0 items-center justify-center border border-black">
			<User class="size-10 text-gray-400" />
		</div>
		<div class="flex-1 text-sm leading-relaxed">
			<p><span class="label-souligne">Nom :</span> <strong>{(eleve.nom || '').toUpperCase()}</strong></p>
			<p><span class="label-souligne">Prénoms :</span> {eleve.prenom || ''}</p>
			<p>
				<span class="label-souligne">Date de naissance :</span> {eleve.dateNaissance
					? fmtDate(eleve.dateNaissance)
					: '—'}
				<span class="label-souligne ml-4">Lieu de naissance :</span> {eleve.lieuNaissance || '—'}
			</p>
			<p><span class="label-souligne">N° Matricule :</span> {eleve.im || '—'}</p>
			<p>
				<span class="label-souligne">Situation :</span> {situation(eleve)}
				<span class="label-souligne ml-4">Classe :</span> {eleve.classe}
				<span class="label-souligne ml-4">Numéro :</span> —F
			</p>
			<p>
				<span class="label-souligne">Tel parents ou tuteur :</span>
				{eleve.telephone || eleve.telephonePere || eleve.telephoneMere || eleve.telephoneTuteur || '—'}
			</p>
		</div>
	</div>

	<!-- Tableau de suivi des absences -->
	<h2 class="mt-6 text-center font-bold underline">SUIVI DES ABSENCES</h2>

	<form
		method="POST"
		action="?/addAbsence"
		use:enhance={() => {
			saving = true;
			return async ({ result, update }) => {
				saving = false;
				if (result.type === 'success') {
					await update({ invalidateAll: true });
					savedMsg = true;
					setTimeout(() => (savedMsg = false), 2000);
				} else if (result.type === 'failure') {
					alert((result.data as { error?: string })?.error ?? 'Enregistrement impossible');
				}
			};
		}}
		class="no-print mb-4 grid grid-cols-2 gap-2 rounded-md border p-3 text-sm md:grid-cols-4"
	>
		<div class="grid gap-1">
			<Label class="text-xs" for="dateHeure">Date / Heure</Label>
			<Input id="dateHeure" name="dateHeure" type="datetime-local" class="h-8" required />
		</div>
		<div class="grid gap-1">
			<Label class="text-xs" for="duree">Durée abs.</Label>
			<Input id="duree" name="duree" placeholder="ex: 2h" class="h-8" />
		</div>
		<div class="grid gap-1">
			<Label class="text-xs" for="motif">Motif</Label>
			<Input id="motif" name="motif" class="h-8" />
		</div>
		<div class="grid gap-1">
			<Label class="text-xs" for="dateRetour">Date de retour</Label>
			<Input id="dateRetour" name="dateRetour" type="date" class="h-8" />
		</div>
		<div class="col-span-2 flex items-end gap-2 md:col-span-4">
			<Button type="submit" size="sm" disabled={saving}>{saving ? 'Enregistrement…' : 'Ajouter une absence'}</Button>
			{#if savedMsg}<span class="text-xs text-emerald-600">Absence enregistrée.</span>{/if}
		</div>
	</form>

	{#each groupes as groupe, gi (gi)}
		<table class="abs-table mb-2 w-full border-collapse text-sm">
			<thead>
				<tr>
					<th class="w-1/5">DATE/HEURE</th>
					<th class="w-[12%]">DUREE ABS</th>
					<th>MOTIFS</th>
					<th class="w-1/5">DATE DE RETOUR</th>
					<th class="w-[14%]">Emargement</th>
				</tr>
			</thead>
			<tbody>
				{#each Array(3) as _, ri (ri)}
					{@const a = groupe[ri]}
					<tr>
						<td>{a ? fmtDate(a.date) : ''}</td>
						<td>{a?.duree ?? ''}</td>
						<td class="text-left">{a?.motif ?? ''}</td>
						<td></td>
						<td></td>
					</tr>
				{/each}
			</tbody>
		</table>
		<p class="separateur my-1 text-center text-sm font-bold italic underline">
			Aterin'ny Ray aman-dReny
		</p>
	{/each}

	<p class="mt-6 text-xs text-muted-foreground">
		Les informations d'identité sont récupérées automatiquement depuis la base de données (champs
		non éditables ici). La photo est un emplacement à remplir séparément.
	</p>
</div>

<style>
	.photo-placeholder {
		background: #f1f1f1;
	}
	.label-souligne {
		display: inline-block;
		border-bottom: 1px solid #333;
		margin-right: 4px;
		font-weight: 600;
	}
	.abs-table th,
	.abs-table td {
		border: 1px solid #333;
		padding: 4px 6px;
		height: 28px;
		text-align: left;
	}
	.abs-table th {
		font-family: Georgia, 'Times New Roman', serif;
		background: #f7f7f7;
	}
	.separateur {
		font-family: Georgia, 'Times New Roman', serif;
	}

	@media print {
		.no-print {
			display: none !important;
		}
		.fiche-papier {
			box-shadow: none;
		}
	}
</style>
