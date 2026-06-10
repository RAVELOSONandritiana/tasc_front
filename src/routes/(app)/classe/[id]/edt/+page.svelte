<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as NativeSelect from '$lib/components/ui/native-select';
	import * as Dialog from '$lib/components/ui/dialog';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import type { SeanceEDT, Cours } from '$lib/types/Materiel.type';
	import { matiere } from '$lib/variables/territoire';

	const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
	const heures = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

	let seances = $state<SeanceEDT[]>([
		{ id: '1', jour: 'Lundi', heureDebut: '08:00', heureFin: '10:00', coursId: '1' },
		{ id: '2', jour: 'Lundi', heureDebut: '10:00', heureFin: '12:00', coursId: '2' },
		{ id: '3', jour: 'Mardi', heureDebut: '08:00', heureFin: '10:00', coursId: '1' }
	]);

	let nouvelleSeance = $state({
		jour: '',
		heureDebut: '',
		heureFin: '',
		coursId: ''
	});

	function ajouterSeance() {
		if (!nouvelleSeance.jour || !nouvelleSeance.heureDebut || !nouvelleSeance.heureFin || !nouvelleSeance.coursId) return;
		const nouvelle: SeanceEDT = {
			id: Date.now().toString(),
			jour: nouvelleSeance.jour,
			heureDebut: nouvelleSeance.heureDebut,
			heureFin: nouvelleSeance.heureFin,
			coursId: nouvelleSeance.coursId
		};
		seances = [...seances, nouvelle];
		nouvelleSeance = { jour: '', heureDebut: '', heureFin: '', coursId: '' };
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
							<NativeSelect.Root bind:value={nouvelleSeance.jour}>
								{#each jours as jour (jour)}
									<NativeSelect.Option value={jour}>{jour}</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="grid gap-2">
								<Label for="heure_debut">Début *</Label>
								<NativeSelect.Root bind:value={nouvelleSeance.heureDebut}>
									{#each heures as h (h)}
										<NativeSelect.Option value={h}>{h}</NativeSelect.Option>
									{/each}
								</NativeSelect.Root>
							</div>
							<div class="grid gap-2">
								<Label for="heure_fin">Fin *</Label>
								<NativeSelect.Root bind:value={nouvelleSeance.heureFin}>
									{#each heures as h (h)}
										<NativeSelect.Option value={h}>{h}</NativeSelect.Option>
									{/each}
								</NativeSelect.Root>
							</div>
						</div>
						<div class="grid gap-2">
							<Label for="cours">Matière *</Label>
							<NativeSelect.Root bind:value={nouvelleSeance.coursId}>
								{#each matiere as m (m)}
									<NativeSelect.Option value={m.toLowerCase()}>{m}</NativeSelect.Option>
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

	<div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-7">
		{#each jours as jour (jour)}
			<CardUI>
				<div class="p-3">
					<h3 class="mb-2 font-semibold text-foreground">{jour}</h3>
					<div class="space-y-2">
						{#each seancesParJour[jour] as seance (seance.id)}
							<div class="rounded-md border border-sidebar-border bg-sidebar-accent/30 p-2 text-xs">
								<p class="font-medium">{seance.heureDebut} - {seance.heureFin}</p>
								<p class="text-muted-foreground">{seance.coursId}</p>
							</div>
						{/each}
						{#if seancesParJour[jour].length === 0}
							<p class="text-xs italic text-muted-foreground">Aucune séance</p>
						{/if}
					</div>
				</div>
			</CardUI>
		{/each}
	</div>
</div>