<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Trash2, Plus } from '@lucide/svelte/icons';
	import ConfirmDeleteDialog from '$lib/components/user/ConfirmDeleteDialog.svelte';
	import type { Examen, SousExamen } from '$lib/types/Materiel.type';
	import { formatExamenNom } from '$lib/utils';

	let {
		open = $bindable(false),
		examen,
		onCreated,
		onDeleted
	}: {
		open?: boolean;
		examen: Examen | null;
		onCreated?: (examenId: string, se: SousExamen) => void;
		onDeleted?: (id: string) => void;
	} = $props();

	let nouveauNom = $state('');
	let errorMsg = $state('');
	let creating = $state(false);
	let deletingId = $state<string | null>(null);
	let confirmOpen = $state(false);

	const sousExamens = $derived(examen?.sousExamens || []);

	async function creer() {
		if (!examen || !nouveauNom.trim()) return;
		creating = true;
		errorMsg = '';
		try {
			const fd = new FormData();
			fd.append('examenId', examen.id);
			fd.append('nom', nouveauNom.trim());
			const res = await fetch('?/createSousExamen', {
				method: 'POST',
				body: fd,
				credentials: 'same-origin'
			});
			const result = await res.json();
			const data = result?.data ?? result;
			if (data?.success && data?.sousExamen) {
				onCreated?.(examen.id, data.sousExamen);
				nouveauNom = '';
			} else {
				errorMsg = data?.error || 'Erreur lors de la création';
			}
		} catch {
			errorMsg = 'Erreur réseau';
		} finally {
			creating = false;
		}
	}

	async function confirmerSuppression() {
		if (!deletingId) return;
		try {
			const fd = new FormData();
			fd.append('id', deletingId);
			await fetch('?/deleteSousExamen', { method: 'POST', body: fd, credentials: 'same-origin' });
			onDeleted?.(deletingId);
		} finally {
			deletingId = null;
			confirmOpen = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Sous-examens</Dialog.Title>
			<Dialog.Description>
				{examen ? formatExamenNom(examen) : ''} - Gérez les épreuves constituant cet examen.
			</Dialog.Description>
		</Dialog.Header>

		{#if errorMsg}
			<div class="mb-3 rounded-md border border-destructive bg-destructive/10 p-3">
				<p class="text-sm text-destructive">{errorMsg}</p>
			</div>
		{/if}

		<div class="space-y-3">
			<div class="flex gap-2">
				<Input placeholder="Nom du sous-examen (ex: Devoir 1)" bind:value={nouveauNom} />
				<Button type="button" size="sm" onclick={creer} disabled={!nouveauNom.trim() || creating}>
					<Plus class="size-4" /> Ajouter
				</Button>
			</div>

			{#if sousExamens.length === 0}
				<p class="text-sm text-muted-foreground italic">Aucun sous-examen pour le moment.</p>
			{:else}
				<ul class="max-h-[40vh] space-y-1 overflow-y-auto rounded-md border p-2">
					{#each sousExamens as se (se.id)}
						<li class="flex items-center justify-between rounded-md p-2 hover:bg-muted/40">
							<span class="text-sm">{se.nom}</span>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								class="size-7 text-destructive hover:bg-destructive/10"
								title="Supprimer"
								onclick={() => {
									deletingId = se.id;
									confirmOpen = true;
								}}
							>
								<Trash2 class="size-3.5" />
							</Button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<Dialog.Footer class="gap-2 sm:justify-end">
			<Button type="button" variant="outline" size="sm" onclick={() => (open = false)}>
				Fermer
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<ConfirmDeleteDialog
	bind:open={confirmOpen}
	title="Supprimer le sous-examen"
	description="Toutes les notes de ce sous-examen seront supprimées. Cette action est irréversible."
	loading={false}
	onConfirm={confirmerSuppression}
/>
