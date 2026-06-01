<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import SurveillantProfil from '$lib/components/user/profil/SurveillantProfil.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import FindPersonne from '$lib/components/user/profil/FindPersonne.svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import type { Personne } from '$lib/types/Personne.type';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	const { personnes } = data;

	// svelte-ignore state_referenced_locally
	const listProfesseur = $state(data.professeur);

	let searchText = $state('');

	const listFiltered = $derived(
		listProfesseur.filter((p) =>
			`${p.name}${p.lastname}${p.email}${p.domicile}${p.fokontany}${p.commune}${p.phone}`
				.toLowerCase()
				.includes(searchText.toLowerCase())
		)
	);

	let searchPersonnes = $state('');

	const findPersonnes = $derived(personnes.filter((p) => p.email == searchPersonnes));

	let setPerson: Personne | null = $state(null);
	let matiere = $state<string[]>([]);
	function setPersonne(personne: Personne) {
		setPerson = personne;
	}

	function removeFindPersonne() {
		setPerson = null;
	}

	function onSubmit() {
		const personne: Personne = { ...(setPerson as Personne) };
		listProfesseur.push({ ...personne, matiere: matiere, connected: false });
		close();
	}
</script>

<main class="min-h-full rounded-md bg-sidebar p-4 text-sidebar-foreground">
	<div class="flex justify-between">
		<InputGroup.Root class="max-w-md">
			<InputGroup.Input
				type="search"
				placeholder="Rechercher un professeur"
				bind:value={searchText}
			/>
			<InputGroup.Addon>
				<SearchIcon />
			</InputGroup.Addon>
		</InputGroup.Root>
		<Dialog.Root>
			<form onsubmit={onSubmit}>
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
							<Label for="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="entrer votre email"
								required
								bind:value={searchPersonnes}
							/>
						</div>

						<div class="space-y-2">
							{#if setPerson == null}
								{#each findPersonnes as fp (fp.phone)}
									<button class="w-full" onclick={() => setPersonne(fp)}>
										<FindPersonne name={fp.name} lastname={fp.lastname} />
									</button>
								{/each}
							{/if}
						</div>

						{#if setPerson != null}
							<div class="space-y-4 rounded-md border p-4">
								<div class="grid gap-3">
									<Label for="email">Nom</Label>
									<Input id="nom" name="nom" required defaultValue={setPerson.name} disabled />
								</div>
								<div class="grid gap-3">
									<Label for="email">Prenom</Label>
									<Input
										id="prenom"
										name="prenom"
										required
										defaultValue={setPerson.lastname}
										disabled
									/>
								</div>
								<Button onclick={removeFindPersonne}>Supprimer personne</Button>
							</div>

							<div class="flex space-x-4">
								<div class="grid gap-3">
									<Label for="matricule">Matricule</Label>
									<Input id="matricule" name="matricule" />
								</div>

								<div class="grid gap-3">
									<Label for="matiere">Matières</Label>
								</div>
							</div>
						{/if}
					</div>
					<Dialog.Footer>
						<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
							Annuler
						</Dialog.Close>
						<Dialog.Close class={buttonVariants({ variant: 'default' })} onclick={onSubmit}
							>Confirmer</Dialog.Close
						>
					</Dialog.Footer>
				</Dialog.Content>
			</form>
		</Dialog.Root>
	</div>

	<div class="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-3">
		{#each listFiltered as p (p.phone)}
			<SurveillantProfil
				name={p.name}
				lastname={p.lastname}
				domicile={p.domicile}
				fokontany={p.fokontany}
				commune={p.commune}
				phone={p.phone}
				email={p.email}
				connected={p.connected}
			>
				{#if p.matiere.length > 0}
					{#each p.matiere as m (m)}
						<Badge>{m}</Badge>
					{/each}
				{/if}
			</SurveillantProfil>
		{/each}
	</div>
</main>
