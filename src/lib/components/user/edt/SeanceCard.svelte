<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Plus } from '@lucide/svelte/icons';
	import type { SeanceEDT, Salle } from '$lib/types/Materiel.type';
	import { matiere } from '$lib/variables/territoire';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import * as NativeSelect from '$lib/components/ui/native-select';
	import { buttonVariants } from '$lib/components/ui/button';

	const { jour, seances, salles, heures, onAdd } = $props<{
		jour: string;
		seances: SeanceEDT[];
		salles: Salle[];
		heures: string[];
		onAdd: (seance: SeanceEDT) => void;
	}>();

	let dialogOpen = $state(false);
	let nouvelleSeance = $state({
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
		if (!nouvelleSeance.heureDebut || !nouvelleSeance.heureFin || !nouvelleSeance.coursId) return;
		const nouvelle: SeanceEDT = {
			id: Date.now().toString(),
			jour,
			heureDebut: nouvelleSeance.heureDebut,
			heureFin: nouvelleSeance.heureFin,
			coursId: nouvelleSeance.coursId,
			salleId: nouvelleSeance.salleId ?? undefined
		};
		onAdd(nouvelle);
		dialogOpen = false;
		nouvelleSeance = { heureDebut: '', heureFin: '', coursId: '', salleId: null };
	}

	function handleClose() {
		dialogOpen = false;
		nouvelleSeance = { heureDebut: '', heureFin: '', coursId: '', salleId: null };
	}
</script>

<div class="rounded-xl bg-card/50 p-4">
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Trigger>
			<Button variant="outline" size="sm" class="w-full gap-2 mb-3">
				<Plus class="size-3.5" />
				Ajouter une séance
			</Button>
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-[400px]">
			<Dialog.Header>
				<Dialog.Title>Ajouter une séance pour {jour}</Dialog.Title>
				<Dialog.Description>Planifiez un cours dans l'emploi du temps</Dialog.Description>
			</Dialog.Header>
			<div class="grid gap-4 py-4">
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
				<Button variant="outline" size="sm" onclick={handleClose}>Annuler</Button>
				<Button variant="default" size="sm" onclick={ajouterSeance}>Ajouter</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<div class="space-y-2">
		{#if seances.length === 0}
			<p class="text-xs italic text-muted-foreground">Aucune séance</p>
		{:else}
			{#each seances as seance (seance.id)}
				<div class="rounded-md border border-sidebar-border bg-sidebar-accent/30 p-2 text-xs">
					<p class="font-medium">{seance.heureDebut} - {seance.heureFin}</p>
					<p class="text-muted-foreground">{seance.coursId}</p>
					{#if seance.salleId}
						<p class="text-muted-foreground/70">
							Salle: {salles.find((s: Salle) => s.id === seance.salleId)?.name || 'Inconnu'}
						</p>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>