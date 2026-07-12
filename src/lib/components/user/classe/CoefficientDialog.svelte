<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Spinner } from '$lib/components/ui/spinner';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import type { Cours } from '$lib/types/Materiel.type';

	let {
		open = $bindable(false),
		cours,
		onSave
	}: {
		open?: boolean;
		cours: Cours | null;
		onSave?: (coursId: string, coefficient: number, matiereId: string, matiereNom: string, matiereCouleur: string) => void;
	} = $props();

	let nouveauCoeff = $state(1);
	let matiereNom = $state('');
	let matiereCouleur = $state('#3b82f6');
	let submitting = $state(false);
	let success = $state(false);
	let errors = $state<Record<string, string>>({});

	$effect(() => {
		if (open && cours) {
			nouveauCoeff = cours.coefficient;
			matiereNom = cours.matiere?.nom || '';
			matiereCouleur = cours.matiere?.couleur || '#3b82f6';
			submitting = false;
			success = false;
			errors = {};
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Modifier le coefficient et la matière</Dialog.Title>
			<Dialog.Description>
				Coefficient actuel : {cours?.coefficient}
			</Dialog.Description>
		</Dialog.Header>

		{#if success}
			<div class="mb-4 rounded-md border border-emerald-500 bg-emerald-500/10 p-3 text-center">
				<p class="text-sm font-medium text-emerald-500">Modifications sauvegardees !</p>
			</div>
		{/if}
		{#if errors._form}
			<div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3">
				<p class="text-sm text-destructive">{errors._form}</p>
			</div>
		{/if}

		<form
			method="POST"
			action="?/updateCoefficient"
			use:enhance={() => {
				submitting = true;
				success = false;
				errors = {};
				return async ({ result }: { result: ActionResult }) => {
					submitting = false;
					const data = result.data as { cours?: Cours; error?: string } | undefined;
					if (result.type === 'success') {
						const coursData = data?.cours;
						if (coursData && cours) {
							onSave?.(cours.id, coursData.coefficient, coursData.matiereId || cours.matiereId, matiereNom, matiereCouleur);
						}
						success = true;
						setTimeout(() => {
							open = false;
						}, 600);
					} else if (result.type === 'failure') {
						const error = data?.error || 'Erreur lors de la mise a jour';
						errors = { _form: error };
					}
				};
			}}
			class="w-full space-y-4"
		>
			<input type="hidden" name="coursId" value={cours?.id || ''} />
			<input type="hidden" name="matiereId" value={cours?.matiereId || ''} />
			<div class="grid gap-2">
				<Label>Nom de la matière</Label>
				<Input name="matiereNom" bind:value={matiereNom} placeholder="Nom de la matière" required class="w-full" />
			</div>
			<div class="grid gap-2">
				<Label>Couleur</Label>
				<div class="flex w-full items-center gap-2">
					<input
						type="color"
						name="matiereCouleur"
						bind:value={matiereCouleur}
						class="size-9 cursor-pointer rounded-md border border-input bg-transparent p-1"
					/>
					<Input bind:value={matiereCouleur} placeholder="#3b82f6" class="w-full flex-1" />
				</div>
			</div>
			<div class="space-y-2 w-full">
				<Label for="new_coeff" class="text-sm font-medium">Nouveau coefficient</Label>
				<Input id="new_coeff" name="coefficient" type="number" min="1" max="20" bind:value={nouveauCoeff} class="w-full" />
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
