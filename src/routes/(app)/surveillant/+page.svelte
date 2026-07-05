<script lang="ts">
	import { enhance } from '$app/forms';
	import { Input } from '$lib/components/ui/input';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import SurveillantCard from '$lib/components/user/profil/SurveillantCard.svelte';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';
	import type { PageProps } from './$types';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import { Card } from '$lib/components/ui/card';
	import { UserSquare2, Plus } from '@lucide/svelte/icons';

	const { data }: PageProps = $props();

	const listSurveillant = $state(data.listSurveillant);

	let searchText = $state('');
	let dialogOpen = $state(false);
	let submitting = $state(false);

	const listFiltered = $derived(
		listSurveillant.filter((p) =>
			`${p.name}${p.lastname}${p.email}${p.phone}${p.poste}`
				.toLowerCase()
				.includes(searchText.toLowerCase())
		)
	);

	function toTitle(value: string) {
		return value
			.split(' ')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
			.join(' ');
	}
</script>

<main class="flex h-screen flex-col bg-background text-foreground">
	<div class="flex-1 overflow-y-auto">
		<div class="sticky top-0 z-10 border-b border-sidebar-border bg-background p-4 md:p-6">
			<div class="mx-auto max-w-7xl space-y-4">
				<div
					class="animate-slide-down flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="flex items-center gap-3">
						<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
							<UserSquare2 class="size-5 text-primary" />
						</div>
						<div>
							<h1 class="text-xl font-bold tracking-tight">Surveillants</h1>
							<p class="text-xs text-muted-foreground">
								{listFiltered.length} surveillant{listFiltered.length > 1 ? 's' : ''}
							</p>
						</div>
					</div>
					<Button
						class="h-9 gap-2 rounded-lg px-5 text-sm font-medium"
						onclick={() => (dialogOpen = true)}
					>
						<Plus class="size-3.5" />
						Nouveau
					</Button>
				</div>

				<Card class="animate-slide-up stagger-1 p-4 opacity-0">
					<SearchInput bind:value={searchText} placeholder="Rechercher un surveillant" />
				</Card>
			</div>
		</div>

		<div class="mx-auto max-w-7xl p-4 md:p-6">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
				{#each listFiltered as p, i (p.phone || `${p.name}${p.lastname}`)}
					<div
						class="animate-slide-up opacity-0"
						style="animation-delay: {Math.min(i * 50, 400)}ms"
					>
						<SurveillantCard personne={p} tags={[p.poste]} hrefProfil={`/profil/${p.id}`} />
					</div>
				{/each}
			</div>
		</div>
	</div>
</main>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<form method="POST" action="?/create" use:enhance={() => {
			submitting = true;
			return async () => {
				submitting = false;
			};
		}}>
			<Dialog.Header class="mb-1 space-y-1">
				<Dialog.Title class="text-xl font-semibold">Ajouter un surveillant</Dialog.Title>
				<Dialog.Description
					>Créer un nouveau profil de surveillance.</Dialog.Description
				>
			</Dialog.Header>

			<div class="space-y-4 py-2">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="name">Nom *</Label>
						<Input id="name" name="name" placeholder="Nom" required oninput={(e) => (e.currentTarget.value = toTitle(e.currentTarget.value))} />
					</div>
					<div class="grid gap-2">
						<Label for="lastname">Prénom *</Label>
						<Input id="lastname" name="lastname" placeholder="Prénom" required oninput={(e) => (e.currentTarget.value = toTitle(e.currentTarget.value))} />
					</div>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="email">Email *</Label>
						<Input id="email" name="email" type="email" placeholder="exemple@email.com" required />
					</div>
					<div class="grid gap-2">
						<Label for="phone">Téléphone *</Label>
						<Input id="phone" name="phone" type="tel" placeholder="+261xxxxxxxx" required />
					</div>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="poste">Poste *</Label>
						<NativeSelect.Root name="poste" required>
							<NativeSelect.Option value="Surveillant">Surveillant</NativeSelect.Option>
							<NativeSelect.Option value="Surveillant General">Surveillant Général</NativeSelect.Option>
							<NativeSelect.Option value="Surveillant Principal">Surveillant Principal</NativeSelect.Option>
						</NativeSelect.Root>
					</div>
					<div class="grid gap-2">
						<Label for="domicile">Domicile *</Label>
						<Input id="domicile" name="domicile" placeholder="Ex: Lot C234 Ambatonakanga" required oninput={(e) => (e.currentTarget.value = toTitle(e.currentTarget.value))} />
					</div>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="fokontany">Fokontany *</Label>
						<Input id="fokontany" name="fokontany" placeholder="Ex: Ambatonakanga" required oninput={(e) => (e.currentTarget.value = toTitle(e.currentTarget.value))} />
					</div>
					<div class="grid gap-2">
						<Label for="commune">Commune *</Label>
						<Input id="commune" name="commune" placeholder="Ex: Toamasina" required oninput={(e) => (e.currentTarget.value = toTitle(e.currentTarget.value))} />
					</div>
				</div>
			</div>

			<Dialog.Footer class="mt-2 gap-2 sm:justify-end">
				<Button type="button" variant="outline" size="sm" onclick={() => (dialogOpen = false)}>Annuler</Button>
				<Button type="submit" variant="default" size="sm" disabled={submitting}>Confirmer</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
