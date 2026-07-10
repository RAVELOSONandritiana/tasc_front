<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Spinner } from '$lib/components/ui/spinner';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import type { EleveCours } from '$lib/types/Materiel.type';
	import { CheckCheck, XCircle, Search } from '@lucide/svelte/icons';

	let {
		open = $bindable(false),
		cours,
		elevesClasse = [],
		onSave
	}: {
		open?: boolean;
		cours: { id: string; nom?: string; participants?: string[] } | null;
		elevesClasse: EleveCours[];
		onSave?: (coursId: string, participants: string[]) => void;
	} = $props();

	let participantsSelectionnes = $state<string[]>([]);
	let searchQuery = $state('');

	let submitting = $state(false);
	let success = $state(false);
	let errors = $state<Record<string, string>>({});

	const tousLesIds = $derived(elevesClasse.map((e) => e.id));

	const elevesFiltres = $derived(
		searchQuery.trim().length === 0
			? elevesClasse
			: elevesClasse.filter((e) =>
					`${e.nom} ${e.prenom}`.toLowerCase().includes(searchQuery.toLowerCase())
				)
	);

	const nbSelectionnes = $derived(participantsSelectionnes.length);
	const tousSelectionnes = $derived(nbSelectionnes === elevesClasse.length);

	function toggleParticipantSelection(eleveId: string) {
		if (participantsSelectionnes.includes(eleveId)) {
			participantsSelectionnes = participantsSelectionnes.filter((id) => id !== eleveId);
		} else {
			participantsSelectionnes = [...participantsSelectionnes, eleveId];
		}
	}

	function toutSelectionner() {
		participantsSelectionnes = [...tousLesIds];
	}

	function toutDeselectionner() {
		participantsSelectionnes = [];
	}

	function basculerTous() {
		if (tousSelectionnes) toutDeselectionner();
		else toutSelectionner();
	}

	$effect(() => {
		if (open && cours) {
			participantsSelectionnes = cours.participants?.length
				? [...cours.participants]
				: [...tousLesIds];
			searchQuery = '';
			submitting = false;
			success = false;
			errors = {};
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-3xl">
		<Dialog.Header>
			<Dialog.Title>Modifier les participants</Dialog.Title>
			<Dialog.Description>
				Sélectionnez les élèves participants au cours {cours?.nom}
			</Dialog.Description>
		</Dialog.Header>

		{#if success}
			<div class="mb-4 rounded-md border border-emerald-500 bg-emerald-500/10 p-3 text-center">
				<p class="text-sm font-medium text-emerald-500">Participants mis à jour !</p>
			</div>
		{/if}
		{#if errors._form}
			<div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3">
				<p class="text-sm text-destructive">{errors._form}</p>
			</div>
		{/if}

		<form
			method="POST"
			action="?/updateParticipants"
			use:enhance={() => {
				submitting = true;
				success = false;
				errors = {};
				return async ({ result }: { result: ActionResult }) => {
					submitting = false;
					if (result.type === 'success') {
						const coursData = (result.data as any)?.cours;
						if (coursData && cours) {
							onSave?.(cours.id, coursData.participants || []);
						}
						success = true;
						setTimeout(() => {
							open = false;
						}, 600);
					} else if (result.type === 'failure') {
						const error = (result.data as any)?.error || 'Erreur lors de la mise à jour';
						errors = { _form: error };
					}
				};
			}}
			class="space-y-4"
		>
			<input type="hidden" name="coursId" value={cours?.id || ''} />
			{#each participantsSelectionnes as participantId}
				<input type="hidden" name="participants" value={participantId} />
			{/each}

			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div class="relative w-full sm:max-w-xs">
					<Search class="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
					<input
						placeholder="Rechercher un élève..."
						bind:value={searchQuery}
						class="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm"
					/>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-xs text-muted-foreground">
						{nbSelectionnes} / {elevesClasse.length} sélectionné{nbSelectionnes > 1 ? 's' : ''}
					</span>
					<Button type="button" variant="outline" size="sm" onclick={basculerTous}>
						{#if tousSelectionnes}
							<XCircle class="mr-1.5 size-3.5" />
							Tout désélectionner
						{:else}
							<CheckCheck class="mr-1.5 size-3.5" />
							Tout sélectionner
						{/if}
					</Button>
				</div>
			</div>

			<div class="space-y-2 py-2">
				<div class="max-h-96 overflow-y-auto rounded-md border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-12"></Table.Head>
								<Table.Head>Nom</Table.Head>
								<Table.Head>Prénom</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each elevesFiltres as eleve (eleve.id)}
								<Table.Row>
									<Table.Cell>
										<Checkbox
											checked={participantsSelectionnes.includes(eleve.id)}
											onclick={() => toggleParticipantSelection(eleve.id)}
										/>
									</Table.Cell>
									<Table.Cell class="font-medium">{eleve.nom}</Table.Cell>
									<Table.Cell>{eleve.prenom}</Table.Cell>
								</Table.Row>
							{/each}
							{#if elevesFiltres.length === 0}
								<Table.Row>
									<Table.Cell colspan={3} class="py-6 text-center text-sm text-muted-foreground">
										Aucun élève trouvé.
									</Table.Cell>
								</Table.Row>
							{/if}
						</Table.Body>
					</Table.Root>
				</div>
				<p class="text-xs text-muted-foreground">
					Cochez uniquement les élèves qui participent à ce cours. Une liste vide équivaut à
					« tous les élèves ».
				</p>
			</div>

			<Dialog.Footer class="gap-2 sm:justify-end">
				<Button type="button" variant="outline" size="sm" onclick={() => (open = false)}>
					Annuler
				</Button>
				<Button type="submit" size="sm" disabled={submitting || success}>
					{#if submitting}
						<Spinner class="mr-2 size-4" />
						Sauvegarde...
					{:else}
						Sauvegarder
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
