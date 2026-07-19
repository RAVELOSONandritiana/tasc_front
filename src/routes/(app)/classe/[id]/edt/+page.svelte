<script lang="ts">
	import { Card } from '$lib/components/ui/card';
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
</script>

<div class="min-h-full bg-sidebar p-4 text-sidebar-foreground">
	<div class="mb-4">
		<h2 class="text-lg font-semibold">Emploi du temps</h2>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
						classeId={data.classe.id}
						cours={data.cours}
						currentProfesseurId={data.currentProfesseurId}
						professeurs={data.professeurs}
					/>
					</div>
				</div>
			</Card>
		{/each}
	</div>
</div>
