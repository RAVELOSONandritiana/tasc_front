<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import AnneScolaire from '$lib/components/user/AnneScolaire.svelte';
	import type { AnneScolaireType } from '$lib/types/AnneScolaire.types';
	const annes: AnneScolaireType[] = [
		{ id: 1, label: 'Label scolaire', creator: 'Proviseurs', image:'https://github.com/vanessa.png' },
		{ id: 2, label: 'Label scolaire', creator: 'Proviseur' },
		{ id: 3, label: 'Label scolaire', creator: 'Proviseurs' },
		{ id: 4, label: 'Label scolaire', creator: 'Proviseur' },
		{ id: 5, label: 'Label scolaire', creator: 'Proviseur' },
		{ id: 6, label: 'Label scolaire', creator: 'Proviseur' },
		{ id: 7, label: 'Label scolaire', creator: 'Proviseurs' },
		{ id: 8, label: 'Label scolaire', creator: 'Proviseur' },
		{ id: 9, label: 'Label scolaire', creator: 'Proviseur' },
		{ id: 10, label: 'Label scolaire', creator: 'Proviseur' }
	];
	let filter = $state('');
	let filteredScolaire = $derived(
		annes.filter((item) =>
			`${item.creator}${item.label}`.toLowerCase().includes(filter.toLowerCase())
		)
	);
</script>

<main class="flex flex-col h-full m-4 bg-sidebar text-sidebar-foreground">
	<div class="sticky top-0 z-20 bg-sidebar py-2">
		<div class="flex justify-between items-center">
		<Input
			type="search"
			placeholder="Rechercher anne scolaire"
			class="max-w-md"
			bind:value={filter}
		/>
		<Dialog.Root>
			<form>
				<Dialog.Trigger type="button" class={buttonVariants({ variant: 'outline' })}>
					Creer
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Creer anne scolaire</Dialog.Title>
						<Dialog.Description>
							Ceci va vous permettre apres de creer des classes
						</Dialog.Description>
					</Dialog.Header>
					<div class="grid gap-4">
						<div class="grid gap-3">
							<Label for="name-1">Nom</Label>
							<Input id="name-1" name="name" defaultValue="2026-2027" />
						</div>
					</div>
					<Dialog.Footer>
						<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
							Cancel
						</Dialog.Close>
						<AlertDialog.Root>
							<AlertDialog.Trigger class={buttonVariants({ variant: 'default' })}>
								Ajouter
							</AlertDialog.Trigger>
							<AlertDialog.Content>
								<AlertDialog.Header>
									<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
									<AlertDialog.Description>
										This action cannot be undone. This will permanently delete your account and
										remove your data from our servers.
									</AlertDialog.Description>
								</AlertDialog.Header>
								<AlertDialog.Footer>
									<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
									<AlertDialog.Action>Continue</AlertDialog.Action>
								</AlertDialog.Footer>
							</AlertDialog.Content>
						</AlertDialog.Root>
					</Dialog.Footer>
				</Dialog.Content>
			</form>
		</Dialog.Root>
	</div>

	<div class="mt-4 flex-1 overflow-auto">
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
			{#each filteredScolaire as ans (ans.id)}
				<AnneScolaire creator={ans.creator} label={ans.label} id={ans.id} image={ans.image} />
			{/each}
		</div>
	</div>
</main>
