<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Spinner } from '$lib/components/ui/spinner';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';

	let {
		open = $bindable(false),
		matiere,
		onSave
	}: {
		open?: boolean;
		matiere: { id: string; nom: string; couleur?: string } | null;
		onSave?: (matiereId: string, nom: string, couleur: string) => void;
	} = $props();

	let editingMatiereNom = $state('');
	let editingMatiereCouleur = $state('');
	let editingMatiereSubmitting = $state(false);
	let editingMatiereSuccess = $state(false);
	let errors = $state<Record<string, string>>({});

	const DEFAULT_MATIERE_COLOR = '#3b82f6';

	$effect(() => {
		if (open && matiere) {
			editingMatiereNom = matiere.nom;
			editingMatiereCouleur = matiere.couleur || DEFAULT_MATIERE_COLOR;
			editingMatiereSuccess = false;
			editingMatiereSubmitting = false;
			errors = {};
		}
	});

	const currentMatiereId = $derived(matiere?.id || '');
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title>Modifier la matière</Dialog.Title>
			<Dialog.Description>Modifier le nom et la couleur</Dialog.Description>
		</Dialog.Header>

		{#if editingMatiereSuccess}
			<div class="mb-4 rounded-md border border-emerald-500 bg-emerald-500/10 p-3 text-center">
				<p class="text-sm font-medium text-emerald-500">Matiere modifiee !</p>
			</div>
		{/if}
		{#if errors._form}
			<div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3">
				<p class="text-sm text-destructive">{errors._form}</p>
			</div>
		{/if}

		<form
			method="POST"
			action="?/updateMatiere"
			use:enhance={() => {
				editingMatiereSubmitting = true;
				editingMatiereSuccess = false;
				errors = {};
				return async ({ result }: { result: ActionResult }) => {
					editingMatiereSubmitting = false;
					const data = result.data as { matiere?: { nom: string; couleur?: string }; error?: string } | undefined;
					if (result.type === 'success') {
						const matiereData = data?.matiere;
						if (matiereData && currentMatiereId) {
							onSave?.(currentMatiereId, matiereData.nom, matiereData.couleur || DEFAULT_MATIERE_COLOR);
						}
						editingMatiereSuccess = true;
						setTimeout(() => {
							open = false;
						}, 600);
					} else if (result.type === 'failure') {
						const error = data?.error || 'Erreur lors de la mise a jour';
						errors = { _form: error };
					}
				};
			}}
			class="space-y-4"
		>
			<input type="hidden" name="matiereId" value={currentMatiereId} />
			<div class="grid gap-2">
				<Label>Nom</Label>
				<Input name="nom" bind:value={editingMatiereNom} placeholder="Nom de la matière" required />
			</div>
			<div class="grid gap-2">
				<Label>Couleur</Label>
				<div class="flex items-center gap-2">
					<input
						type="color"
						name="couleur"
						bind:value={editingMatiereCouleur}
						class="size-9 cursor-pointer rounded-md border border-input bg-transparent p-1"
					/>
					<Input bind:value={editingMatiereCouleur} placeholder="#3b82f6" class="flex-1" />
				</div>
			</div>

			<Dialog.Footer class="gap-2 sm:justify-end">
				<Button type="button" variant="outline" size="sm" onclick={() => (open = false)}>
					Annuler
				</Button>
				<Button type="submit" size="sm" disabled={editingMatiereSubmitting || editingMatiereSuccess}>
					{#if editingMatiereSubmitting}
						<Spinner class="mr-2 size-4" />
						Sauvegarde...
					{:else if editingMatiereSuccess}
						Sauvegarder
					{:else}
						Sauvegarder
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
