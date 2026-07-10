<script lang="ts">
	import pb, { auth } from '$lib/pocketbase/pocketbase';
	import type { Salle } from '$lib/types/Materiel.type';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { DoorOpen, Pencil, Image as ImageIcon } from '@lucide/svelte/icons';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import UploadFile from '$lib/components/user/form/UploadFile.svelte';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import { Spinner } from '$lib/components/ui/spinner';

	const { salle, deleteAction = '' }: { salle: Salle; deleteAction?: string } = $props();

	let editOpen = $state(false);
	let editNom = $state('');
	let editNum = $state('');
	let editCapacite = $state('');
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

	function openEdit() {
		editNom = salle.name ?? '';
		editNum = String(salle.num ?? '');
		editCapacite = String(salle.place ?? '');
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
	<div class="relative h-40 w-full overflow-hidden">
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
		<div class="absolute top-2 right-2 flex gap-1">
			<button
				type="button"
				class={buttonVariants({
					variant: 'secondary',
					size: 'icon-sm',
					class: 'size-8 rounded-full bg-black/40 text-white hover:bg-black/60'
				})}
				onclick={() => (imageOpen = true)}
			>
				<ImageIcon class="size-4" />
			</button>
			<button
				type="button"
				class={buttonVariants({
					variant: 'ghost',
					size: 'icon-sm',
					class: 'size-8 rounded-full bg-black/40 text-white hover:bg-black/60'
				})}
				onclick={openEdit}
			>
				<Pencil class="size-4" />
			</button>
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
						class="size-8 rounded-full bg-black/40 text-white hover:bg-black/60"
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
		</div>
	</div>
	<div class="flex h-2 w-full bg-emerald-600"></div>
	<div class="flex flex-col gap-2 bg-white/5 p-3">
		<div class="text-base font-bold uppercase tracking-wider text-foreground">Salle {salle.num}</div>
		<div class="text-sm text-foreground">{salle.name}</div>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3 text-xs text-muted-foreground">
				<span>{salle.place} places</span>
				<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium {statutClass}">
					{statutLabel}
				</span>
			</div>
		</div>
	</div>
	<UploadFile bind:open={imageOpen} bind:files onSubmit={handleImageSubmit} />
</CardUI>

<Dialog.Root bind:open={editOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Modifier la salle</Dialog.Title>
			<Dialog.Description>Mettre à jour les informations de la salle.</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/update">
			<input type="hidden" name="id" value={salle.id} />
			<div class="grid gap-4 pb-4">
				<div class="grid gap-3">
					<Label for="edit-num-salle">Numéro de salle</Label>
					<Input id="edit-num-salle" type="number" bind:value={editNum} placeholder="ex: 7" name="num" />
				</div>

				<div class="grid gap-3">
					<Label for="edit-nom-salle">Nom de la salle</Label>
					<Input id="edit-nom-salle" type="text" bind:value={editNom} placeholder="ex: Salle A" name="nom" />
				</div>

				<div class="grid gap-3">
					<Label for="edit-nombre-place">Nombre de places</Label>
					<Input
						id="edit-nombre-place"
						type="number"
						bind:value={editCapacite}
						placeholder="ex: 50"
						name="capacite"
					/>
				</div>
			</div>

			<Dialog.Footer>
				<Button variant="outline" size="sm" type="button" onclick={() => (editOpen = false)}>Annuler</Button>
				<Button type="submit" variant="default" size="sm">Confirmer</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
