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
	<div class="flex justify-between p-4 top-16 sticky z-50 bg-sidebar">
		<SearchInput placeholder="Rechercher une salle" />
		<div class="flex items-center justify-center space-x-6">
			<div class="flex gap-3">
				<span class="h-4 w-4 rounded-full bg-purple-500"></span>
				<Label>Occupe</Label>
			</div>
			<div class="flex gap-3">
				<span class="h-4 w-4 rounded-full bg-green-600"></span>
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

	<div class="grid grid-cols-3 gap-8 p-4">
		{#if data.list_salle.length > 0}
			{#each data.list_salle as salle (salle.id)}
				<Salle {salle} />
			{/each}
		{/if}
	</div>
</main>
