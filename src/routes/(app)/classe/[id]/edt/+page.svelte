<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Printer } from '@lucide/svelte';
	import { page } from '$app/stores';
	import type { PageProps } from './$types';
	import SeanceCard from '$lib/components/user/edt/SeanceCard.svelte';

	const { data }: PageProps = $props();

	const seancesParJour = $derived(
		data.jours.reduce(
			(acc, jour) => {
				acc[jour] = data.seances.filter((s) => s.jour === jour);
				return acc;
			},
			{} as Record<string, (typeof data.seances)[0][]>
		)
	);

	function imprimer() {
		window.print();
	}
</script>

<div class="flex flex-1 flex-col bg-sidebar p-4 text-sidebar-foreground">
	<div class="no-print mb-4 flex items-center justify-between gap-2">
		<h2 class="text-lg font-semibold">Emploi du temps</h2>
		<Button variant="outline" onclick={imprimer}>
			<Printer class="mr-2 size-4" /> Imprimer l'emploi du temps
		</Button>
	</div>

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
					<div class="flex h-full flex-col p-3">
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
</div>

<style>
	.edt-grid {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 1rem;
	}

	@media (max-width: 768px) {
		.edt-grid {
			grid-template-columns: repeat(1, minmax(0, 1fr));
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
		.edt-print-area {
			background: #fff;
		}
		/* Une colonne par jour sur toute la largeur de la page */
		.edt-grid {
			grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
		}
		/* Masque les boutons d'action (ajouter, modifier, supprimer) à l'impression */
		.edt-print-area :global(button) {
			display: none !important;
		}
	}
</style>
