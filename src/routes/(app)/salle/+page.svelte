<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import type { PageProps } from './$types';
	import Salle from '$lib/components/user/classe/Salle.svelte';
	import SearchInput from '$lib/components/user/SearchInput.svelte';

	const { data }: PageProps = $props();
</script>

<main class="min-h-full rounded-md bg-sidebar text-sidebar-foreground">
	<div class="flex flex-wrap items-center justify-between gap-4 p-4 top-16 sticky z-50 bg-sidebar">
		<SearchInput placeholder="Rechercher une salle" />
		<div class="flex items-center gap-6">
			<div class="flex items-center gap-2">
				<span class="h-3 w-3 rounded-full bg-purple-500"></span>
				<Label class="text-sm">Occupée</Label>
			</div>
			<div class="flex items-center gap-2">
				<span class="h-3 w-3 rounded-full bg-green-600"></span>
				<Label class="text-sm">Libre</Label>
			</div>
		</div>
		<Dialog.Root>
			<form>
				<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default', size: 'sm' })}> Nouveau </Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Ajouter une salle</Dialog.Title>
						<Dialog.Description>Cette salle pourra ensuite être affectée à des cours.</Dialog.Description>
					</Dialog.Header>

					<div class="grid gap-4">
						<div class="grid gap-3">
							<Label for="num_salle">Numéro de salle</Label>
							<Input id="num_salle" name="num_salle" type="number" placeholder="ex: 7" />
						</div>

						<div class="grid gap-3">
							<Label for="nplace">Nombre de places</Label>
							<Input id="nplace" name="nplace" type="number" placeholder="ex: 59" />
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

	<div class="grid grid-cols-1 gap-6 p-4 md:grid-cols-2 lg:grid-cols-3">
		{#if data.list_salle.length > 0}
			{#each data.list_salle as salle (salle.id)}
				<Salle {salle} />
			{/each}
		{/if}
	</div>
</main>
