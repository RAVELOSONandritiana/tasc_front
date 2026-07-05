<script lang="ts">
	import type { Salle } from '$lib/types/Materiel.type';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Button } from '$lib/components/ui/button';
	import { DoorOpen, Users } from '@lucide/svelte/icons';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';

	const { salle }: { salle: Salle } = $props();
	let editOpen = $state(false);
	let editName = $state('');
	let editPlace = $state('');

	const statutLabel = $derived(salle.occupe !== false ? 'Occupée' : 'Libre');
	const statutClass = $derived(
		salle.occupe ? 'bg-purple-500 text-purple-50' : 'bg-emerald-600 text-emerald-50'
	);

	async function handleEdit() {
		editName = salle.name ?? '';
		editPlace = String(salle.place ?? '');
		editOpen = true;
	}

	async function saveEdit() {
		editOpen = false;
		const formData = new FormData();
		formData.append('id', salle.id);
		formData.append('nom', editName);
		formData.append('capacite', editPlace);

		try {
			const response = await fetch('?/', {
				method: 'POST',
				body: formData
			});
		} catch (e) {
			console.error('Update failed:', e);
		}
	}
</script>

<CardUI>
	{#if salle.imageUrl}
		<!-- svelte-ignore a11y_img_redundant_alt -->
		<img
			src={salle.imageUrl}
			alt="image salle"
			class="h-40 w-full object-cover transition-all duration-300 hover:scale-105 hover:grayscale-75"
		/>
	{:else}
		<div
			class="relative h-40 w-full bg-linear-to-br from-sidebar-accent/50 via-sidebar to-sidebar-accent/30"
		>
			<div class="absolute inset-0 flex items-center justify-center">
				<DoorOpen class="size-10 text-sidebar-foreground/40" />
			</div>
		</div>
	{/if}
	<div class="bg-white/5 p-4">
		<div class="mb-3 flex items-center justify-between">
			<div>
				<div class="text-base font-semibold text-foreground">Salle {salle.num}</div>
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<Users class="size-3.5" />
					<span>{salle.place} places</span>
				</div>
			</div>
			<span
				class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium {statutClass}"
			>
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
				Modifier salle
			</Button>
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
			<div class="grid gap-4">
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
