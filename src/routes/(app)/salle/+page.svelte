<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Card } from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import type { PageProps } from './$types';
	import Salle from '$lib/components/user/classe/Salle.svelte';
	import { loadingForm } from '$lib/actions/loadingForm';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import { Building2, Plus } from '@lucide/svelte/icons';

	const { data }: PageProps = $props();
	let salleDialogOpen = $state(false);
	let nomSalle = $state('');
	let numSalle = $state('');
	let nbPlaces = $state('');
	let statusFilter = $state(data.statusFilter || 'all');

	const statusOptions = [
		{ value: 'all', label: 'Toutes' },
		{ value: 'libre', label: 'Libres' },
		{ value: 'occupe', label: 'Occupées' }
	];

	const filteredSalles = $derived(
		statusFilter === 'all'
			? data.list_salle
			: data.list_salle.filter((s: { occupe: boolean }) => s.occupe === (statusFilter === 'occupe'))
	);
</script>

<main class="flex min-h-0 flex-1 flex-col bg-background text-foreground">
	<div class="flex-1 overflow-y-auto">
		<div class="sticky top-0 z-10 border-b border-sidebar-border bg-background p-4 md:p-6">
			<div class="space-y-4">
				<div
					class="animate-slide-down flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="flex items-center gap-3">
						<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
							<Building2 class="size-5 text-primary" />
						</div>
						<div>
							<h1 class="text-xl font-bold tracking-tight">Salles</h1>
							<p class="text-xs text-muted-foreground">
								{filteredSalles.length} salle{filteredSalles.length > 1 ? 's' : ''} disponible{filteredSalles.length > 1 ? 's' : ''}
							</p>
						</div>
						<div class="hidden sm:block">
							<Select.Root type="single" bind:value={statusFilter}>
								<Select.Trigger class="h-8 w-40">
									{statusOptions.find((s) => s.value === statusFilter)?.label || 'Toutes'}
								</Select.Trigger>
								<Select.Content>
									{#each statusOptions as status (status.value)}
										<Select.Item value={status.value}>{status.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					</div>
					<Dialog.Root bind:open={salleDialogOpen}>
						<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default', class: 'gap-2' })}>
							<Plus class="size-4" />
							Nouvelle salle
						</Dialog.Trigger>
						<Dialog.Content class="sm:max-w-106.25">
							<form method="POST" action="?/create" class="contents" use:loadingForm>
								<Dialog.Header>
									<Dialog.Title>Ajouter une salle</Dialog.Title>
									<Dialog.Description
										>Cette salle pourra ensuite être affectée à des cours.</Dialog.Description
									>
								</Dialog.Header>

							<div class="grid gap-4 py-4">
								<div class="grid gap-3">
									<Label for="nom_salle">Nom de la salle</Label>
									<Input
										id="nom_salle"
										type="text"
										placeholder="ex: Salle 207"
										bind:value={nomSalle}
										name="nom"
										required
									/>
								</div>

								<div class="grid gap-3">
									<Label for="num_salle">Numéro de salle</Label>
									<Input
										id="num_salle"
										type="number"
										placeholder="ex: 7"
										bind:value={numSalle}
										name="num"
										required
									/>
								</div>

								<div class="grid gap-3">
									<Label for="nplace">Nombre de places</Label>
									<Input
										id="nplace"
										type="number"
										placeholder="ex: 59"
										bind:value={nbPlaces}
										name="capacite"
										required
									/>
								</div>
							</div>

							<Dialog.Footer>
								<Button
									variant="outline"
									size="sm"
									type="button"
									onclick={() => (salleDialogOpen = false)}>Annuler</Button
								>
								<Button variant="default" size="sm" type="submit">Confirmer</Button>
							</Dialog.Footer>
						</form>
					</Dialog.Content>
				</Dialog.Root>
				</div>

				<Card class="animate-slide-up stagger-1 p-4 opacity-0">
					<SearchInput placeholder="Rechercher une salle..." class="flex-1" />
				</Card>
			</div>
		</div>

		<div class="p-4 md:p-6">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#if filteredSalles.length > 0}
					{#each filteredSalles as salle, i (salle.id)}
						<div
							class="animate-slide-up opacity-0"
							style="animation-delay: {Math.min(i * 50, 400)}ms"
						>
							<Salle {salle} deleteAction="?/delete" />
						</div>
					{/each}
				{:else}
					<div
						class="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground"
					>
						<Building2 class="size-12 text-muted-foreground/30" />
						<p class="mt-4 text-sm font-medium">Aucune salle enregistrée</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</main>
