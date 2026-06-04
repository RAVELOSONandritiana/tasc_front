<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Label } from '$lib/components/ui/label';
	import SearchIcon from '@lucide/svelte/icons/search';

	let searchText = $state('');

	let searchPersonnes = $state('');
</script>

<main class="min-h-full rounded-md bg-sidebar p-4 text-sidebar-foreground">
	<div class="flex justify-between">
		<InputGroup.Root class="max-w-md">
			<InputGroup.Input type="search" placeholder="Rechercher un eleve" bind:value={searchText} />
			<InputGroup.Addon>
				<SearchIcon />
			</InputGroup.Addon>
		</InputGroup.Root>
	</div>

	<Dialog.Root>
		<form>
			<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default' })}>
				Nouveau
			</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-[425px]">
				<Dialog.Header>
					<Dialog.Title>Ajouter un nouveau professeur</Dialog.Title>
					<Dialog.Description>Affecter des roles a vos professeurs apres</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4">
					<div class="grid gap-3">
						<Label for="email">Numero parents</Label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="entrer votre email"
							required
							bind:value={searchPersonnes}
						/>
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
</main>
