<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import type { SeanceEDT, Salle } from '$lib/types/Materiel.type';
	import SeanceCard from '$lib/components/user/edt/SeanceCard.svelte';

	const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
	const heures = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

	let seances = $state<SeanceEDT[]>([
		{ id: '1', jour: 'Lundi', heureDebut: '08:00', heureFin: '10:00', coursId: '1', salleId: 1 },
		{ id: '2', jour: 'Lundi', heureDebut: '10:00', heureFin: '12:00', coursId: '2', salleId: 2 },
		{ id: '3', jour: 'Mardi', heureDebut: '08:00', heureFin: '10:00', coursId: '1', salleId: 1 }
	]);

	let salles = $state<Salle[]>([
		{ id: 1, num: 1, name: 'Salle 1', place: 50 },
		{ id: 2, num: 2, name: 'Salle 2', place: 50 },
		{ id: 3, num: 3, name: 'Salle 3', place: 50 }
	]);

	function heureEnMinute(heure: string): number {
		const [h, m] = heure.split(':').map(Number);
		return h * 60 + m;
	}

	function chevauchement(s1: SeanceEDT, s2: SeanceEDT): boolean {
		if (s1.jour !== s2.jour) return false;
		return heureEnMinute(s1.heureDebut) < heureEnMinute(s2.heureFin) &&
			   heureEnMinute(s1.heureFin) > heureEnMinute(s2.heureDebut);
	}

	function ajouterSeance(seance: SeanceEDT) {
		seances = seances.filter(s => !chevauchement(s, seance));
		seances = [...seances, seance];
	}

	const seancesParJour = $derived(
		jours.reduce(
			(acc, jour) => {
				acc[jour] = seances.filter((s) => s.jour === jour);
				return acc;
			},
			{} as Record<string, SeanceEDT[]>
		)
	);
</script>

<div class="min-h-full bg-sidebar p-4 text-sidebar-foreground">
	<div class="mb-4">
		<h2 class="text-lg font-semibold">Emploi du temps</h2>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
		{#each jours as jour (jour)}
			<Card class="border-sidebar-border bg-card/80 shadow-sm hover:shadow-lg transition-all duration-300">
				<div class="flex h-full flex-col p-3">
					<h3 class="mb-2 font-semibold text-foreground">{jour}</h3>
					<div class="flex-1">
						<SeanceCard {jour} seances={seancesParJour[jour]} {salles} {heures} onAdd={ajouterSeance} />
					</div>
				</div>
			</Card>
		{/each}
	</div>
</div>