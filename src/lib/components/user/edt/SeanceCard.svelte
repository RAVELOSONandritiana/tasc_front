<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Plus, Play } from '@lucide/svelte/icons';
	import type { SeanceEDT } from '$lib/types/Materiel.type';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { loadingForm } from '$lib/actions/loadingForm';
	import * as NativeSelect from '$lib/components/ui/native-select';
	import { goto } from '$app/navigation';

	const { jour, seances, salles, heures, classeId, cours = [] }: {
		jour: string;
		seances: SeanceEDT[];
		salles: { id: string; num: number; name: string; place: number }[];
		heures: string[];
		classeId: string;
		cours?: { id: string; matiereNom: string; coefficient: number; professeur: string }[];
	} = $props();

	let dialogOpen = $state(false);
	let nouvelleSeance = $state({
		heureDebut: '',
		heureFin: '',
		coursId: '',
		salleId: null as string | null
	});

	function handleClose() {
		dialogOpen = false;
		nouvelleSeance = { heureDebut: '', heureFin: '', coursId: '', salleId: null };
	}
</script>

<div class="rounded-xl bg-card/50 p-4">
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Trigger class={buttonVariants({ variant: 'outline', size: 'sm', class: 'mb-3 w-full gap-2' })}>
			<Plus class="size-3.5" />
			Ajouter une séance
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-100">
			<form method="POST" action="?/createSeance" use:loadingForm>
				<Dialog.Header>
					<Dialog.Title>Ajouter une séance pour {jour}</Dialog.Title>
					<Dialog.Description>Planifiez un cours dans l'emploi du temps</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4 py-4">
					<input type="hidden" name="jour" value={jour} />
					<div class="grid grid-cols-2 gap-3">
						<div class="grid gap-2">
							<Label for="heure_debut">Début *</Label>
							<NativeSelect.Root
								bind:value={nouvelleSeance.heureDebut}
								class="w-full"
								name="heureDebut"
							>
								{#each heures as h (h)}
									<NativeSelect.Option value={h}>{h}</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>
						<div class="grid gap-2">
							<Label for="heure_fin">Fin *</Label>
							<NativeSelect.Root
								bind:value={nouvelleSeance.heureFin}
								class="w-full"
								name="heureFin"
							>
								{#each heures as h (h)}
									<NativeSelect.Option value={h}>{h}</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>
					</div>
					<div class="grid gap-2">
						<Label for="cours">Matière *</Label>
						<NativeSelect.Root bind:value={nouvelleSeance.coursId} class="w-full" name="coursId">
							<NativeSelect.Option value="" disabled>Sélectionner une matière</NativeSelect.Option>
							{#each cours as c (c.id)}
								<NativeSelect.Option value={c.id}>{c.matiereNom} {c.professeur ? `(${c.professeur})` : ''}</NativeSelect.Option>
							{/each}
						</NativeSelect.Root>
					</div>
					<div class="grid gap-2">
						<Label for="salle">Salle</Label>
						<NativeSelect.Root bind:value={nouvelleSeance.salleId} class="w-full" name="salleId">
							<NativeSelect.Option value={null}>Sélectionner</NativeSelect.Option>
							{#each salles as s (s.id)}
								<NativeSelect.Option value={s.id}>{s.name} ({s.place} places)</NativeSelect.Option>
							{/each}
						</NativeSelect.Root>
					</div>
				</div>
				<Dialog.Footer>
					<Button variant="outline" size="sm" type="button" onclick={handleClose}>Annuler</Button>
					<Button variant="default" size="sm" type="submit">Ajouter</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<div class="space-y-2">
		{#if seances.length === 0}
			<p class="text-xs text-muted-foreground italic">Aucune séance</p>
		{:else}
			{#each seances as seance (seance.id)}
				<div class="rounded-md border border-sidebar-border bg-sidebar-accent/30 p-2 text-xs">
					<div class="flex items-start justify-between">
						<div>
							<p class="font-medium">{seance.heureDebut} - {seance.heureFin}</p>
							<p class="text-muted-foreground">{seance.coursNom || seance.coursId}</p>
							{#if seance.salleId}
								<p class="text-muted-foreground/70">
									Salle: {salles.find((s: { id: string; name: string }) => s.id === seance.salleId)
										?.name || 'Inconnu'}
								</p>
							{/if}
						</div>
						<Button
							variant="default"
							size="sm"
							class="h-6 px-2"
							onclick={() => goto(`/classe/${classeId}/cours/${seance.coursId}/presence`)}
						>
							<Play class="size-3" />
						</Button>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
