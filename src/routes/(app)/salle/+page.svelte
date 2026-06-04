<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import type { PageProps } from './$types';
	import Classe from '$lib/components/user/classe/Classe.svelte';

	const { data }: PageProps = $props();
</script>

<main class="min-h-full rounded-md bg-sidebar p-4 text-sidebar-foreground">
	<div class="flex justify-between">
		<InputGroup.Root class="max-w-md">
			<InputGroup.Input type="search" placeholder="Rechercher une salle" />
			<InputGroup.Addon>
				<SearchIcon />
			</InputGroup.Addon>
		</InputGroup.Root>
		<div class="flex items-center justify-center space-x-6">
			<div class="flex gap-3">
				<span class="h-4 w-4 bg-purple-500 rounded-full"></span>
				<Label>Occupe</Label>
			</div>
			<div class="flex gap-3">
				<span class="h-4 w-4 bg-green-600 rounded-full"></span>
				<Label>Libre</Label>
			</div>
		</div>
		<Dialog.Root>
			<form>
				<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default' })}>
					Nouveau
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Ajouter des salles pour enseigner</Dialog.Title>
						<Dialog.Description
							>Ces salles pourront apres etre utiliser pour affecter des cours</Dialog.Description
						>
					</Dialog.Header>

					<div class="grid gap-4">
						<div class="grid gap-3">
							<Label for="num_salle">Numero de Salle</Label>
							<Input id="num_salle" name="num_salle" type="number" placeholder="ex: 7" />
						</div>

						<div class="grid gap-3">
							<Label for="nplace">Nombre de place</Label>
							<Input id="nplace" name="nplace" type="number" placeholder="ex: 59" />
						</div>
					</div>

					<Dialog.Footer>
						<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
							Annuler
						</Dialog.Close>
						<Dialog.Close class={buttonVariants({ variant: 'default' })}>Confirmer</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</form>
		</Dialog.Root>
	</div>

	<div class="grid grid-cols-4 gap-4 pt-4">
		{#if data.list_classe.length > 0}
			{#each data.list_classe as classe (classe.id)}
				<Classe {classe} />
			{/each}
		{/if}
	</div>
</main>
