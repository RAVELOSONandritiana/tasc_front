<script lang="ts">
	import type { Salle } from '$lib/types/Materiel.type';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Button } from '$lib/components/ui/button';
	import { DoorOpen, Users } from '@lucide/svelte/icons';
	import UploadFile from '$lib/components/user/form/UploadFile.svelte';
	import pb, { auth } from '$lib/pocketbase/pocketbase';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';

	const { salle }: { salle: Salle } = $props();
	// svelte-ignore state_referenced_locally
	let sl = $state(salle);
	let open = $state(false);
	let files = $state<FileList | null>(null);
	let editOpen = $state(false);
	let editName = $state('');
	let editPlace = $state('');

	async function ensureAuth() {
		try {
			await auth();
		} catch (e) {
			console.error('PocketBase unavailable');
		}
	}

	async function handleSubmit() {
		if (!files || files.length === 0) return;
		await ensureAuth();
		const formdata = new FormData();
		formdata.append('file', files[0]);
		try {
			const record = await pb.collection('tasc_statics').create(formdata);
			if (record && record.file) {
				sl.url = pb.files.getURL(record, record.file);
			}
		} catch (e) {
			console.error('Upload failed:', e);
		}
		open = false;
	}

	const statutLabel = $derived(sl.used ? 'Occupée' : 'Libre');
	const statutClass = $derived(sl.used ? 'bg-purple-500 text-purple-50' : 'bg-emerald-600 text-emerald-50');

	async function handleEdit() {
		editName = sl.name ?? '';
		editPlace = String(sl.place ?? '');
		editOpen = true;
	}

	async function saveEdit() {
		sl.name = editName;
		sl.place = parseInt(editPlace) || sl.place;
		editOpen = false;
		try {
			await ensureAuth();
			const updated = await pb.collection('salles').update(sl.id, {
				name: sl.name ?? '',
				place: sl.place
			});
			if (updated) Object.assign(sl, updated);
		} catch (e) {
			console.error('Update failed:', e);
		}
	}
</script>

<CardUI>
	{#if sl.url}
		<!-- svelte-ignore a11y_img_redundant_alt -->
		<img
			src={sl.url}
			alt="image salle"
			class="h-40 w-full object-cover transition-all duration-300 hover:scale-105 hover:grayscale-75"
		/>
	{:else}
		<div class="relative h-40 w-full bg-linear-to-br from-sidebar-accent/50 via-sidebar to-sidebar-accent/30">
			<div class="absolute inset-0 flex items-center justify-center">
				<DoorOpen class="size-10 text-sidebar-foreground/40" />
			</div>
		</div>
	{/if}
	<div class="bg-white/5 p-4">
		<div class="mb-3 flex items-center justify-between">
			<div>
				<div class="text-base font-semibold text-foreground">Salle {sl.num}</div>
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<Users class="size-3.5" />
					<span>{sl.place} places</span>
				</div>
			</div>
			<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium {statutClass}">
				{statutLabel}
			</span>
		</div>
		<div class="flex w-full items-center justify-between gap-2">
			<Button variant="outline" size="sm" class="h-8 flex-1 rounded-lg px-3 text-xs" onclick={handleEdit}>
				Modifier salle
			</Button>
			<div class="flex flex-1 gap-2">
				<Button size="sm" variant="default" class="h-8 flex-1 rounded-lg px-3 text-xs" onclick={() => (open = true)}>
					Modifier image
				</Button>
				<UploadFile bind:open bind:files onSubmit={handleSubmit}>
				</UploadFile>
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

		<div class="grid gap-4">
			<div class="grid gap-3">
				<Label for="edit-nom-salle">Nom de la salle</Label>
				<Input id="edit-nom-salle" bind:value={editName} placeholder="ex: Salle A" />
			</div>

			<div class="grid gap-3">
				<Label for="edit-nombre-place">Nombre de places</Label>
				<Input id="edit-nombre-place" type="number" bind:value={editPlace} placeholder="ex: 50" />
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" size="sm" onclick={() => editOpen = false}> Annuler </Button>
			<Button type="button" variant="default" size="sm" onclick={saveEdit}>
				Confirmer
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
