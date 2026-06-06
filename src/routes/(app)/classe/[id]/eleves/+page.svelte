<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Label } from '$lib/components/ui/label';
	import FindPersonne from '$lib/components/user/profil/FindPersonne.svelte';
	import SearchIcon from '@lucide/svelte/icons/search';
	import * as Table from '$lib/components/ui/table/index.js';

	const student = [
		{
			id: 1,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: 0,
			age: 17,
			absence: 19
		},
		{
			id: 2,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: 0,
			age: 17,
			absence: 19
		},
		{
			id: 3,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: 0,
			age: 17,
			absence: 19
		},
		{
			id: 4,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: 0,
			age: 17,
			absence: 19
		},
		{
			id: 5,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: 0,
			age: 17,
			absence: 19
		},
		{
			id: 6,
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			status: 0,
			age: 17,
			absence: 19
		}
	];

	type EleveInformation = { id: number; name: string; lastname: string };
	let searchText = $state('');

	let searchPersonnes: number = $state(0);

	let personnesFind = $state<EleveInformation[] | null>(null);

	let setPerson = $state<EleveInformation | null>(null);

	function findPersonne() {
		personnesFind = [
			{
				id: 10,
				name: 'RABE',
				lastname: 'kely'
			},
			{
				id: 15,
				name: 'Rakoto',
				lastname: 'Balita be'
			}
		];
	}

	function removePersonne() {
		setPerson = null;
	}

	function setPersonne(p: EleveInformation) {
		setPerson = p;
	}
</script>

<main class="min-h-full rounded-md bg-sidebar text-sidebar-foreground">
	<div class="sticky top-29 z-50 flex justify-between bg-sidebar p-4">
		<InputGroup.Root class="max-w-md">
			<InputGroup.Input type="search" placeholder="Rechercher un eleve" bind:value={searchText} />
			<InputGroup.Addon>
				<SearchIcon />
			</InputGroup.Addon>
		</InputGroup.Root>

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
							<Label for="numero">Numero parents</Label>
							<Input
								id="numero"
								name="numero"
								type="number"
								placeholder="entrer l'une des numeros des parents"
								bind:value={searchPersonnes}
								required
							/>
							{#if personnesFind == null}
								<Button onclick={findPersonne}>Chercher</Button>
							{:else if personnesFind.length > 0}
								<div class="space-y-2">
									{#if setPerson == null}
										{#each personnesFind as fp (fp.id)}
											<button class="w-full" onclick={() => setPersonne(fp)}>
												<FindPersonne name={fp.name} lastname={fp.lastname} />
											</button>
										{/each}
									{/if}

									{#if setPerson != null}
										<div class="space-y-4 rounded-md border p-4">
											<div class="grid gap-3">
												<Label for="name">Nom</Label>
												<Input
													id="name"
													name="name"
													required
													defaultValue={setPerson.name}
													disabled
												/>
											</div>
											<div class="grid gap-3">
												<Label for="lastname">Prenom</Label>
												<Input
													id="lastname"
													name="lastname"
													required
													defaultValue={setPerson.lastname}
													disabled
												/>
											</div>
											<Button onclick={removePersonne}>Supprimer personne</Button>
										</div>
									{/if}
								</div>
							{/if}
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

	<div class="p-4">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Nom</Table.Head>
					<Table.Head>Prenom</Table.Head>
					<Table.Head>Age</Table.Head>
					<Table.Head>Absence</Table.Head>
					<Table.Head>Status</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each student as s (s.id)}
					<Table.Row>
						<Table.Cell>{s.name}</Table.Cell>
						<Table.Cell>{s.lastname}</Table.Cell>
						<Table.Cell>{s.age}</Table.Cell>
						<Table.Cell>{s.absence}</Table.Cell>
						<Table.Cell>{s.status}</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</main>
