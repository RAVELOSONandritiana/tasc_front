<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import PesonnelProfil from '$lib/components/user/profil/PesonnelProfil.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import FindPersonne from '$lib/components/user/profil/FindPersonne.svelte';
	import type { Personne } from '$lib/types/Personne.type';
	import type { PageProps } from './$types';
	import SearchInput from '$lib/components/user/SearchInput.svelte';

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

	const findPersonnes = $derived(
		personnes.filter((p) =>
			`${p.name}${p.lastname}`
				.split(' ')
				.join('')
				.toLowerCase()
				.startsWith(searchPersonnes.split(' ').join('').toLowerCase())
		)
	);

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
		listProfesseur.push({ ...personne, matiere: matiere });
		close();
	}
</script>

<main class="min-h-full rounded-md bg-sidebar text-sidebar-foreground">
	<div class="sticky top-16 z-50 flex justify-between bg-sidebar p-4">
		<SearchInput placeholder="Rechercher un professeur" bind:value={searchText} />
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
							<Label for="n">Nom complet</Label>
							<Input
								id="n"
								name="n"
								placeholder="entrer votre nom complet"
								required
								bind:value={searchPersonnes}
							/>
						</div>

						<div class="space-y-2">
							{#if setPerson == null && searchPersonnes.length > 2}
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
									<Label for="name">Nom</Label>
									<Input id="name" name="name" required defaultValue={setPerson.name} disabled />
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
						<Dialog.Close
							class={buttonVariants({ variant: 'default' })}
							onclick={onSubmit}
							disabled={setPerson == null}>Confirmer</Dialog.Close
						>
					</Dialog.Footer>
				</Dialog.Content>
			</form>
		</Dialog.Root>
	</div>

	<div class="grid grid-cols-1 gap-8 p-4 md:grid-cols-2 lg:grid-cols-3">
		{#each listFiltered as p (p.phone)}
			<PesonnelProfil>
				<div class="space-y-2">
					<Label>Nom : {p.name}</Label>
					<Label>Prenom : {p.lastname}</Label>
					<Label>Phone : {p.phone}</Label>
					<Label>Email : {p.email}</Label>
				</div>
				{#if p.matiere.length > 0}
					{#each p.matiere as m (m)}
						<Badge>{m}</Badge>
					{/each}
				{/if}
			</PesonnelProfil>
		{/each}
	</div>
</main>
