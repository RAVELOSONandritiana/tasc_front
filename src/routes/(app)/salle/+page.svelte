<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageProps } from './$types';
	import Salle from '$lib/components/user/classe/Salle.svelte';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import { Building2, Plus } from '@lucide/svelte/icons';

	const { data }: PageProps = $props();
</script>

<main class="bg-background text-foreground">
	<div class="mx-auto max-w-7xl p-4 md:p-6 space-y-6">
		<!-- Header -->
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
			<Dialog.Root>
				<form>
					<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default' })}>
						<Plus class="size-4" />
						Nouvelle salle
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-[425px]">
						<Dialog.Header>
							<Dialog.Title>Ajouter une salle</Dialog.Title>
							<Dialog.Description>Cette salle pourra ensuite être affectée à des cours.</Dialog.Description>
						</Dialog.Header>

						<div class="grid gap-4">
							<div class="grid gap-3">
								<Label for="num_salle">Numéro de salle</Label>
								<Input id="num_salle" name="num_salle" type="number" placeholder="ex: 7" class="rounded-lg border-input bg-background px-3 py-2 text-sm shadow-xs transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" />
							</div>

							<div class="grid gap-3">
								<Label for="nplace">Nombre de places</Label>
								<Input id="nplace" name="nplace" type="number" placeholder="ex: 59" class="rounded-lg border-input bg-background px-3 py-2 text-sm shadow-xs transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" />
							</div>
						</div>

						<Dialog.Footer>
							<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}> Annuler </Dialog.Close>
							<Dialog.Close class={buttonVariants({ variant: 'default' })}> Confirmer </Dialog.Close>
						</Dialog.Footer>
					</Dialog.Content>
				</form>
			</Dialog.Root>
		</div>

		<!-- Search & Legend -->
		<Card class="animate-slide-up stagger-1 opacity-0 p-4">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<SearchInput placeholder="Rechercher une salle..." class="flex-1 min-w-48" />
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-2">
						<span class="size-2.5 rounded-full bg-purple-500"></span>
						<Label class="text-xs">Occupée</Label>
					</div>
					<div class="flex items-center gap-2">
						<span class="size-2.5 rounded-full bg-emerald-500"></span>
						<Label class="text-xs">Libre</Label>
					</div>
				</div>
			</div>
		</Card>

		<!-- Salles Grid -->
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
</main>
