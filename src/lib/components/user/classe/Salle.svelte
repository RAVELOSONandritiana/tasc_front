<script lang="ts">
	import pb, { auth } from '$lib/pocketbase/pocketbase';
	import type { Salle } from '$lib/types/Materiel.type';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Button } from '$lib/components/ui/button';
	import { DoorOpen, Users } from '@lucide/svelte/icons';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import UploadFile from '$lib/components/user/form/UploadFile.svelte';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import { Spinner } from '$lib/components/ui/spinner';

	const { salle, deleteAction = '' }: { salle: Salle; deleteAction?: string } = $props();

	let editOpen = $state(false);
	let editName = $state('');
	let editPlace = $state('');
	let imageOpen = $state(false);
	let files = $state<FileList | null>(null);
	let submittingDelete = $state(false);
	let imageError = $state(false);

	const statutLabel = $derived(salle.occupe !== false ? 'Occupée' : 'Libre');
	const statutClass = $derived(
		salle.occupe ? 'bg-purple-500 text-purple-50' : 'bg-emerald-600 text-emerald-50'
	);

	async function ensureAuth() {
		try {
			await auth();
		} catch (e) {
			console.error('PocketBase unavailable', e);
		}
	}

	async function handleEdit() {
		editName = salle.name ?? '';
		editPlace = String(salle.place ?? '');
		editOpen = true;
	}

	async function handleImageSubmit() {
		if (!files || files.length === 0) return;
		await ensureAuth();
		const formdata = new FormData();
		formdata.append('file', files[0]);
		try {
			const record = await pb.collection('tasc_statics').create(formdata);
			if (record && record.file) {
				const url = pb.files.getURL(record, record.file);
				const fd = new FormData();
				fd.append('id', salle.id);
				fd.append('imageUrl', url);
				const res = await fetch('/salle?/updateImage', { method: 'POST', body: fd });
				const result = (await res.json().catch(() => null)) as { oldImageUrl?: string } | null;
				const oldImageUrl = result?.oldImageUrl;
				if (oldImageUrl && oldImageUrl !== url) {
					const segments = oldImageUrl.split('/');
					const recordId = segments[segments.length - 2];
					if (recordId) {
						await pb.collection('tasc_statics').delete(recordId).catch(() => {});
					}
				}
			}
		} catch (e) {
			console.error('Upload failed:', e);
		}
		imageOpen = false;
		files = null;
	}
</script>

<CardUI class="relative flex h-full flex-col overflow-hidden transition-all duration-200 hover:shadow-md">
	{#if deleteAction}
		<form method="POST" action={deleteAction} use:enhance={() => {
			submittingDelete = true;
			return async ({ result }: { result: ActionResult }) => {
				submittingDelete = false;
				if (result.type === 'success') {
					window.location.reload();
				} else if (result.type === 'failure') {
					console.error('[Delete] Failure:', result.data);
					alert(result.data?.error || 'Suppression impossible');
				} else {
					console.error('[Delete] Error:', result);
					alert('Erreur lors de la suppression');
				}
			};
		}}>
			<input type="hidden" name="id" value={salle.id} />
			<Button
				size="icon"
				variant="destructive"
				class="absolute right-4 top-4 z-10 size-8 rounded-full shadow-sm"
				title="Supprimer"
				type="submit"
				disabled={submittingDelete}
			>
				{#if submittingDelete}
					<Spinner class="size-4" />
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
				{/if}
			</Button>
		</form>
	{/if}
	<div class="h-40 w-full overflow-hidden">
		{#if salle.imageUrl && !imageError}
			<!-- svelte-ignore a11y_img_redundant_alt -->
			<img
				src={salle.imageUrl}
				alt="image salle"
				class="h-full w-full object-cover transition-all duration-300 hover:scale-105 hover:grayscale-75"
				onerror={() => (imageError = true)}
			/>
		{:else}
			<div class="flex h-full w-full items-center justify-center bg-muted/30">
				<DoorOpen class="size-10 text-muted-foreground/50" />
			</div>
		{/if}
	</div>
	<div class="flex h-2 w-full bg-emerald-600"></div>
	<div class="flex flex-col gap-4 bg-white/5 p-4">
		<div class="flex items-center justify-between">
			<div>
				<div class="text-base font-bold uppercase tracking-wider text-foreground">Salle {salle.num}</div>
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<Users class="size-3.5" />
					<span>{salle.place} places</span>
				</div>
			</div>
			<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium {statutClass}">
				{statutLabel}
			</span>
		</div>
		<div class="flex w-full items-center justify-between gap-2">
			<Button
				variant="outline"
				size="sm"
				class="h-8 flex-1 rounded-lg px-3 text-xs"
				onclick={handleEdit}
			>
				Modifier
			</Button>
			<div class="flex flex-1 gap-2">
				<Button
					size="sm"
					variant="default"
					class="h-8 flex-1 rounded-lg px-3 text-xs"
					onclick={() => (imageOpen = true)}
				>
					Image
				</Button>
				<UploadFile bind:open={imageOpen} bind:files onSubmit={handleImageSubmit} />
			</div>
		</div>
	</div>
</CardUI>

<Dialog.Root bind:open={editOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Modifier la salle</Dialog.Title>
			<Dialog.Description>Mettre à jour le nom et le nombre de places.</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/update">
			<input type="hidden" name="id" value={salle.id} />
			<div class="grid gap-4 pb-4">
				<div class="grid gap-3">
					<Label for="edit-nom-salle">Nom de la salle</Label>
					<Input id="edit-nom-salle" bind:value={editName} placeholder="ex: Salle A" name="nom" />
				</div>

				<div class="grid gap-3">
					<Label for="edit-nombre-place">Nombre de places</Label>
					<Input
						id="edit-nombre-place"
						type="number"
						bind:value={editPlace}
						placeholder="ex: 50"
						name="capacite"
					/>
				</div>
			</div>

			<Dialog.Footer>
				<Button variant="outline" size="sm" onclick={() => (editOpen = false)}>Annuler</Button>
				<Button type="submit" variant="default" size="sm">Confirmer</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

