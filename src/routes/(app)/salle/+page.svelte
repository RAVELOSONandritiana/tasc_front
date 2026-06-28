<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageProps } from './$types';
	import Salle from '$lib/components/user/classe/Salle.svelte';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import { Building2, Plus } from '@lucide/svelte/icons';

	let salleDialogOpen = $state(false);
	let numSalle = $state('');
	let nbPlaces = $state('');

	const { data }: PageProps = $props();

	function soumettre() {
		console.log('Salle créée:', { numSalle, nbPlaces });
		salleDialogOpen = false;
		numSalle = '';
		nbPlaces = '';
	}
</script>

<main class="bg-background text-foreground h-screen flex flex-col">
	<div class="flex-1 overflow-y-auto">
		<div class="sticky top-0 z-10 bg-background p-4 md:p-6 border-b border-sidebar-border">
			<div class="mx-auto max-w-7xl space-y-4">
				<div class="animate-slide-down flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex items-center gap-3">
						<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
							<Building2 class="size-5 text-primary" />
						</div>
						<div>
							<h1 class="text-xl font-bold tracking-tight">Salles</h1>
							<p class="text-xs text-muted-foreground">{data.list_salle.length} salle{data.list_salle.length > 1 ? 's' : ''} disponible{data.list_salle.length > 1 ? 's' : ''}</p>
						</div>
					</div>
					<Dialog.Root bind:open={salleDialogOpen}>
						<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default' })}>
							<Plus class="size-4" />
							Nouvelle salle
						</Dialog.Trigger>
						<Dialog.Content class="sm:max-w-[425px]">
							<Dialog.Header>
								<Dialog.Title>Ajouter une salle</Dialog.Title>
								<Dialog.Description>Cette salle pourra ensuite être affectée à des cours.</Dialog.Description>
							</Dialog.Header>

							<div class="grid gap-4 py-4">
								<div class="grid gap-3">
									<Label for="num_salle">Numéro de salle</Label>
									<Input id="num_salle" type="number" placeholder="ex: 7" bind:value={numSalle} />
								</div>

								<div class="grid gap-3">
									<Label for="nplace">Nombre de places</Label>
									<Input id="nplace" type="number" placeholder="ex: 59" bind:value={nbPlaces} />
								</div>
							</div>

							<Dialog.Footer>
								<Button variant="outline" size="sm" onclick={() => salleDialogOpen = false}>Annuler</Button>
								<Button variant="default" size="sm" onclick={soumettre}>Confirmer</Button>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Root>
				</div>

				<Card class="animate-slide-up stagger-1 opacity-0 p-4">
					<SearchInput placeholder="Rechercher une salle..." class="flex-1 min-w-48" />
				</Card>
			</div>
		</div>

		<div class="mx-auto max-w-7xl p-4 md:p-6">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#if data.list_salle.length > 0}
					{#each data.list_salle as salle, i (salle.id)}
						<div class="animate-slide-up opacity-0" style="animation-delay: {Math.min(i * 50, 400)}ms">
							<Salle {salle} />
						</div>
					{/each}
				{:else}
					<div class="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
						<Building2 class="size-12 text-muted-foreground/30" />
						<p class="mt-4 text-sm font-medium">Aucune salle enregistrée</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</main>