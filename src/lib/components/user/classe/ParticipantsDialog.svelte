<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Spinner } from '$lib/components/ui/spinner';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import type { EleveCours } from '$lib/types/Materiel.type';

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

	function toggleParticipantSelection(eleveId: string) {
		if (participantsSelectionnes.includes(eleveId)) {
			participantsSelectionnes = participantsSelectionnes.filter((id) => id !== eleveId);
		} else {
			participantsSelectionnes = [...participantsSelectionnes, eleveId];
		}
	}

	let submitting = $state(false);
	let success = $state(false);
	let errors = $state<Record<string, string>>({});

	$effect(() => {
		if (open && cours) {
			participantsSelectionnes = cours.participants?.length
				? [...cours.participants]
				: [...elevesClasse.map((e) => e.id)];
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
				<p class="text-sm font-medium text-emerald-500">Participants mis a jour !</p>
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
						const error = (result.data as any)?.error || 'Erreur lors de la mise a jour';
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

			<div class="space-y-2 py-4">
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
							{#each elevesClasse as eleve (eleve.id)}
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
						</Table.Body>
					</Table.Root>
				</div>
				<p class="text-xs text-muted-foreground">
					Cochez uniquement les élèves qui participent à ce cours.
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
					{:else if success}
						Sauvegarder
					{:else}
						Sauvegarder
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
