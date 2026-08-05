<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Printer } from '@lucide/svelte';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	type Ligne = {
		id: string;
		numero: number;
		sexeBloc: 'F' | 'G';
		im?: string | null;
		nom: string;
		prenom: string;
		dateNaissance: string;
		redoublant?: boolean;
		situation?: string;
		classe: string;
	};

	const filles = data.filles as Ligne[];
	const garcons = data.garcons as Ligne[];

	// Numéros entourés (décoratifs, comme sur la fiche papier) pour quelques
	// lignes — valeurs statiques de présentation, sans signification métier.
	const cerclesF = new Set([3, 8, 18]);
	const cerclesG = new Set([3, 8, 18]);

	function sit(e: Ligne): 'P' | 'R' {
		if (e.redoublant) return 'R';
		const s = (e.situation || '').toUpperCase();
		if (s === 'R' || s.startsWith('R')) return 'R';
		return 'P';
	}

	function fmtDate(iso: string): string {
		if (!iso) return '';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '';
		const j = String(d.getDate()).padStart(2, '0');
		const m = String(d.getMonth() + 1).padStart(2, '0');
		return `${j}/${m}/${d.getFullYear()}`;
	}

	// Prénoms soulignés (décoratif) : ici on souligne simplement le prénom
	// principal pour reproduire le style "manuscrit" de la fiche papier.
</script>

<svelte:head>
	<title>Liste de classe — {data.classe}</title>
</svelte:head>

<div class="no-print mb-4 flex items-center justify-between gap-2">
	<Button variant="outline" onclick={() => history.back()}>Retour</Button>
	<Button onclick={() => window.print()}>
		<Printer class="mr-2 size-4" /> Télécharger / Imprimer (PDF)
	</Button>
</div>

<div class="fiche-papier mx-auto max-w-4xl bg-white p-8 text-black shadow print:shadow-none">
	<div class="bandeau-titre mb-6 text-center">
		<h1 class="titre-oldstyle text-xl font-bold uppercase tracking-wide">
			{data.classe} — ANNEE SCOLAIRE {data.annee}
		</h1>
		<p class="mt-1 text-left text-sm">Date : …/…/…</p>
	</div>

	{#each [{ titre: 'Filles', lignes: filles, cercles: cerclesF, sexe: 'F' }, { titre: 'Garçons', lignes: garcons, cercles: cerclesG, sexe: 'G' }] as bloc, i (bloc.sexe)}
		<table class="fiche-table w-full border-collapse text-sm {i === 0 ? 'mb-6' : 'mt-2'}">
			{#if i === 0}
				<thead>
					<tr>
						<th class="w-8">N°</th>
						<th class="w-8">SEXE</th>
						<th class="w-16">IM</th>
						<th class="w-40">NOM</th>
						<th>PRÉNOMS</th>
						<th class="w-28">DATE DE NAISS.</th>
						<th class="w-10">SIT</th>
						<th class="w-16">CLA.</th>
					</tr>
				</thead>
			{/if}
			<tbody>
				{#each bloc.lignes as e (e.id)}
					<tr>
						<td class="text-center {bloc.cercles.has(e.numero) ? 'cercle' : ''}">{e.numero}</td>
						<td class="text-center">{bloc.sexe}</td>
						<td class="text-center">{e.im ?? ''}</td>
						<td class="font-semibold">{e.nom}</td>
						<td class="prenom-souligne">{e.prenom}</td>
						<td class="text-center">{fmtDate(e.dateNaissance)}</td>
						<td class="text-center">
							<span class="badge-sit {sit(e) === 'R' ? 'sit-r' : 'sit-p'}">{sit(e)}</span>
						</td>
						<td class="text-center">{data.classe}</td>
					</tr>
				{/each}
				{#if bloc.lignes.length === 0}
					<tr><td colspan="8" class="text-center text-muted-foreground">Aucun élève</td></tr>
				{/if}
			</tbody>
		</table>
	{/each}

</div>

<style>
	.bandeau-titre {
		border: 1px solid #ccc;
		background: #f3f3f0;
		padding: 10px;
	}
	.titre-oldstyle {
		font-family: 'Courier New', 'Lucida Console', monospace;
		letter-spacing: 0.5px;
	}
	.fiche-table th,
	.fiche-table td {
		border: 1px solid #333;
		padding: 3px 6px;
		vertical-align: middle;
	}
	.fiche-table th {
		font-family: Georgia, 'Times New Roman', serif;
		font-weight: 700;
		background: #f7f7f7;
	}
	.prenom-souligne {
		text-decoration-color: #1d4ed8;
		text-underline-offset: 2px;
	}
	.cercle {
		display: inline-block;
		border: 1.5px solid #1d4ed8;
		border-radius: 9999px;
		width: 22px;
		height: 22px;
		line-height: 20px;
	}
	.badge-sit {
		display: inline-block;
		min-width: 18px;
		padding: 0 4px;
		border-radius: 4px;
		font-weight: 700;
	}
	.sit-p {
		background: #dcfce7;
		color: #166534;
	}
	.sit-r {
		background: #fee2e2;
		color: #991b1b;
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
