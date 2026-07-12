<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Spinner } from '$lib/components/ui/spinner';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import type { Cours } from '$lib/types/Materiel.type';

	let {
		open = $bindable(false),
		cours,
		onDeleted
	}: {
		open?: boolean;
		cours: Cours | null;
		onDeleted?: (coursId: string) => void;
	} = $props();

	let submitting = $state(false);
	let errors = $state<Record<string, string>>({});

	$effect(() => {
		if (open) {
			submitting = false;
			errors = {};
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Supprimer le cours</Dialog.Title>
			<Dialog.Description>
				Êtes-vous sûr de vouloir supprimer le cours
				<span class="font-semibold">{cours?.matiere?.nom || cours?.nom || ''}</span> ? Cette action est
				irréversible et supprimera également les notes, séances et présences associées.
			</Dialog.Description>
		</Dialog.Header>

		{#if errors._form}
			<div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3">
				<p class="text-sm text-destructive">{errors._form}</p>
			</div>
		{/if}

		<form
			method="POST"
			action="?/deleteCours"
			use:enhance={() => {
				submitting = true;
				errors = {};
				return async ({ result }: { result: ActionResult }) => {
					submitting = false;
					if (result.type === 'success') {
						if (cours) onDeleted?.(cours.id);
						open = false;
					} else if (result.type === 'failure') {
						const data = result.data as { error?: string } | undefined;
						errors = { _form: data?.error || 'Erreur lors de la suppression' };
					}
				};
			}}
			class="w-full space-y-4"
		>
			<input type="hidden" name="coursId" value={cours?.id || ''} />
			<Dialog.Footer class="gap-2 sm:justify-end">
				<Button type="button" variant="outline" size="sm" onclick={() => (open = false)}>
					Annuler
				</Button>
				<Button type="submit" size="sm" variant="destructive" disabled={submitting}>
					{#if submitting}
						<Spinner class="mr-2 size-4" />
						Suppression...
					{:else}
						Supprimer
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
