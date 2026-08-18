<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Printer, AlertTriangle } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import SeanceCard from '$lib/components/user/edt/SeanceCard.svelte';
	import EDTImpression from '$lib/components/user/edt/EDTImpression.svelte';

	const { data, form }: PageProps = $props();

	const seancesParJour = $derived(
		data.jours.reduce(
			(acc, jour) => {
				acc[jour] = data.seances.filter((s) => s.jour === jour);
				return acc;
			},
			{} as Record<string, (typeof data.seances)[0][]>
		)
	);

	// Erreur renvoyée par une action (création / modification d'une séance).
	const erreur = $derived(
		form && typeof form === 'object' && 'error' in form ? (form.error as string) : null
	);

	function imprimer() {
		window.print();
	}
</script>

<div class="flex flex-1 flex-col bg-sidebar p-3 text-sidebar-foreground sm:p-4">
	<div class="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
		<h2 class="text-base font-semibold sm:text-lg">Emploi du temps</h2>
		<Button variant="outline" size="sm" class="gap-2" onclick={imprimer}>
			<Printer class="size-4" />
			<span class="hidden sm:inline">Imprimer l'emploi du temps</span>
			<span class="sm:hidden">Imprimer</span>
		</Button>
	</div>

	{#if erreur}
		<div
			class="no-print mb-4 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
		>
			<AlertTriangle class="mt-0.5 size-4 shrink-0" />
			<span>{erreur}</span>
		</div>
	{/if}

	{#if !data.anneeActive}
		<div
			class="no-print mb-4 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-600"
		>
			<AlertTriangle class="mt-0.5 size-4 shrink-0" />
			<span>
				Aucune année scolaire active : le pointage des cours et la déclaration des absences sont
				désactivés.
			</span>
		</div>
	{/if}

	<div class="edt-print-area relative">
		<!-- Filigrane : logo droit de l'application -->
		<img
			src="/logos/logo-right.png"
			alt=""
			class="edt-watermark pointer-events-none absolute inset-0 m-auto select-none opacity-10"
		/>

		<div class="edt-grid relative z-10">
			{#each data.jours as jour (jour)}
				<Card
					class="border-sidebar-border bg-card/80 shadow-sm transition-all duration-300 hover:shadow-lg"
				>
					<div class="flex h-full flex-col p-2 sm:p-3">
						<h3 class="mb-2 font-semibold text-foreground">{jour}</h3>
						<div class="flex-1">
							<SeanceCard
								{jour}
								seances={seancesParJour[jour]}
								salles={data.salles}
								heures={data.heures}
								jours={data.jours}
								classeId={data.classe.id}
								cours={data.cours}
								currentProfesseurId={data.currentProfesseurId}
								userRole={data.userRole}
								professeurs={data.professeurs}
								eleves={data.eleves}
								seuilAbsence={data.seuilAbsence}
								anneeActive={data.anneeActive}
							/>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	</div>

	<EDTImpression
		jours={data.jours}
		seances={data.seances}
		cours={data.cours}
		classeNom={data.classe.nom || ''}
		annee={data.annee}
	/>
</div>

<style>
	/* Une colonne par jour : la grille s'adapte à la largeur disponible pour
	   rester lisible du téléphone au grand écran. */
	.edt-grid {
		display: grid;
		grid-template-columns: repeat(1, minmax(0, 1fr));
		gap: 0.75rem;
	}

	@media (min-width: 640px) {
		.edt-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 1rem;
		}
	}

	@media (min-width: 1024px) {
		.edt-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (min-width: 1440px) {
		.edt-grid {
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}
	}

	.edt-watermark {
		width: 320px;
		height: 320px;
		object-fit: contain;
	}

	@page {
		size: A4 landscape;
		margin: 10mm;
	}

	@media print {
		.no-print {
			display: none !important;
		}
		/* Fond clair pour une impression lisible */
		:global(body) {
			background: #fff !important;
		}
		/* À l'impression, on masque la grille interactive du site et on
		   n'affiche que le tableau "papier" lisible (EDTImpression). */
		.edt-print-area {
			display: none !important;
		}
	}
</style>
