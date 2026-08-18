<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Printer, User } from '@lucide/svelte';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	const eleve = data.eleve;
	const absences = (data.absences || []) as {
		id: string;
		date: string;
		duree?: string | null;
		motif?: string | null;
	}[];

	// Tous les numeros de contact disponibles (eleve, pere, mere, tuteur).
	const numeros = $derived(
		[eleve.telephone, eleve.telephonePere, eleve.telephoneMere, eleve.telephoneTuteur].filter(
			(n): n is string => Boolean(n)
		)
	);

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

	// Tableaux laissés volontairement vides : ce sont les parents/tuteurs qui
	// les remplissent manuellement sur le carnet papier. Le système n'y inscrit
	// aucune donnée (seules les infos élève en en-tête sont remplies par le système).
	// Toujours 3 tableaux (même vides) pour l'impression du carnet.
	const groupes = $derived.by(() => {
		const g: typeof absences[] = [];
		while (g.length < 3) g.push([] as typeof absences);
		return g;
	});
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
	<div class="relative flex gap-4 pb-4">
		<img
			src="/logos/logo-right.png"
			alt=""
			class="pointer-events-none absolute inset-0 m-auto h-20 w-20 select-none opacity-10"
		/>
		<div class="photo-placeholder flex size-32 shrink-0 items-center justify-center border border-black">
			<User class="size-10 text-gray-400" />
		</div>
		<div class="flex-1 text-sm leading-relaxed">
			<p><span class="label-souligne">Nom :</span> <strong>{(eleve.nom || '').toUpperCase()}</strong></p>
			<p><span class="label-souligne">Prénoms :</span> {eleve.prenom || ''}</p>
			<p class="break-words">
				<span class="label-souligne">Date de naissance :</span> {eleve.dateNaissance
					? fmtDate(eleve.dateNaissance)
					: '—'}
				<span class="label-souligne ml-4">Lieu de naissance :</span> {eleve.lieuNaissance || '—'}
			</p>
			<p><span class="label-souligne">N° Matricule :</span> {eleve.im || '—'}</p>
			<p><span class="label-souligne">Situation :</span> {situation(eleve)}</p>
			<p>
				<span class="label-souligne">Classe :</span> {eleve.classe}
				<span class="label-souligne ml-4">Numéro :</span> {eleve.numeroClasse || '—'}
			</p>
			<p>
				<span class="label-souligne">Tel parents ou tuteur :</span>
				{#if numeros.length}
					{numeros.join(' · ')}
				{:else}
					—
				{/if}
			</p>
		</div>
	</div>

	{#each groupes as groupe, gi (gi)}
		<table class="abs-table mb-2 w-full border-collapse text-sm {gi === 0 ? 'mt-4' : ''}">
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
		<p class="separateur my-1 text-center text-sm font-bold italic">
			Aterin'ny Ray aman-dReny
		</p>
	{/each}
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
		height: 56px;
		text-align: left;
	}
	.abs-table th {
		font-family: Georgia, 'Times New Roman', serif;
		background: #f7f7f7;
		text-align: center;
	}
	.separateur {
		font-family: Georgia, 'Times New Roman', serif;
	}

	@page {
		size: A4;
		margin: 8mm;
	}

	@media print {
		.no-print {
			display: none !important;
		}
		.fiche-papier {
			box-shadow: none;
			max-width: none;
			width: 100%;
			margin: 0;
			padding: 0;
			background: #fff;
			font-size: 12px;
		}
	}
</style>
