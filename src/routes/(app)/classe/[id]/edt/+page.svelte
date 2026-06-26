<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as NativeSelect from '$lib/components/ui/native-select';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Card } from '$lib/components/ui/card';
	import type { SeanceEDT, Salle } from '$lib/types/Materiel.type';
	import { matiere } from '$lib/variables/territoire';

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

	let nouvelleSeance = $state({
		jour: '',
		heureDebut: '',
		heureFin: '',
		coursId: '',
		salleId: null as number | null
	});

	function heureEnMinute(heure: string): number {
		const [h, m] = heure.split(':').map(Number);
		return h * 60 + m;
	}

	function chevauchement(s1: SeanceEDT, s2: SeanceEDT): boolean {
		if (s1.jour !== s2.jour) return false;
		return heureEnMinute(s1.heureDebut) < heureEnMinute(s2.heureFin) &&
			   heureEnMinute(s1.heureFin) > heureEnMinute(s2.heureDebut);
	}

	function ajouterSeance() {
		if (!nouvelleSeance.jour || !nouvelleSeance.heureDebut || !nouvelleSeance.heureFin || !nouvelleSeance.coursId) return;
		const nouvelle: SeanceEDT = {
			id: Date.now().toString(),
			jour: nouvelleSeance.jour,
			heureDebut: nouvelleSeance.heureDebut,
			heureFin: nouvelleSeance.heureFin,
			coursId: nouvelleSeance.coursId,
			salleId: nouvelleSeance.salleId ?? undefined
		};
		seances = seances.filter(s => !chevauchement(s, nouvelle));
		seances = [...seances, nouvelle];
		nouvelleSeance = { jour: '', heureDebut: '', heureFin: '', coursId: '', salleId: null };
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
	<div class="sticky top-16 z-50 flex justify-between bg-sidebar">
		<h2 class="text-lg font-semibold">Emploi du temps</h2>
		<Dialog.Root>
			<form>
				<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default' })}>
					Nouvelle séance
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Ajouter une séance</Dialog.Title>
						<Dialog.Description>Planifiez un cours dans l'emploi du temps</Dialog.Description>
					</Dialog.Header>
					<div class="grid gap-4 py-4">
						<div class="grid gap-2">
							<Label for="jour">Jour *</Label>
							<NativeSelect.Root bind:value={nouvelleSeance.jour} class="w-full">
								{#each jours as jour (jour)}
									<NativeSelect.Option value={jour}>{jour}</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="grid gap-2">
								<Label for="heure_debut">Début *</Label>
								<NativeSelect.Root bind:value={nouvelleSeance.heureDebut} class="w-full">
									{#each heures as h (h)}
										<NativeSelect.Option value={h}>{h}</NativeSelect.Option>
									{/each}
								</NativeSelect.Root>
							</div>
							<div class="grid gap-2">
								<Label for="heure_fin">Fin *</Label>
								<NativeSelect.Root bind:value={nouvelleSeance.heureFin} class="w-full">
									{#each heures as h (h)}
										<NativeSelect.Option value={h}>{h}</NativeSelect.Option>
									{/each}
								</NativeSelect.Root>
							</div>
						</div>
						<div class="grid gap-2">
							<Label for="cours">Matière *</Label>
							<NativeSelect.Root bind:value={nouvelleSeance.coursId} class="w-full">
								{#each matiere as m (m)}
									<NativeSelect.Option value={m.toLowerCase()}>{m}</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>
						<div class="grid gap-2">
							<Label for="salle">Salle</Label>
							<NativeSelect.Root bind:value={nouvelleSeance.salleId} class="w-full">
								<NativeSelect.Option value={null}>Sélectionner</NativeSelect.Option>
								{#each salles as s (s.id)}
									<NativeSelect.Option value={s.id}>{s.name} ({s.place} places)</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>
					</div>
					<Dialog.Footer>
						<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
							Annuler
						</Dialog.Close>
						<Dialog.Close class={buttonVariants({ variant: 'default' })} onclick={ajouterSeance}>
							Ajouter
						</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</form>
		</Dialog.Root>
	</div>

	<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
		{#each jours as jour (jour)}
			<Card class="border-sidebar-border bg-card/80 shadow-sm hover:shadow-lg transition-all duration-300">
				<div class="flex h-full min-h-48 flex-col p-3">
					<h3 class="mb-2 font-semibold text-foreground">{jour}</h3>
					<div class="flex-1 space-y-2">
						{#each seancesParJour[jour] as seance (seance.id)}
							<div class="rounded-md border border-sidebar-border bg-sidebar-accent/30 p-2 text-xs">
								<p class="font-medium">{seance.heureDebut} - {seance.heureFin}</p>
								<p class="text-muted-foreground">{seance.coursId}</p>
								{#if seance.salleId}
									<p class="text-muted-foreground/70">Salle: {salles.find(s => s.id === seance.salleId)?.name || 'Inconnu'}</p>
								{/if}
							</div>
						{/each}
						{#if seancesParJour[jour].length === 0}
							<p class="text-xs italic text-muted-foreground">Aucune séance</p>
						{/if}
					</div>
				</div>
			</Card>
		{/each}
	</div>
</div>