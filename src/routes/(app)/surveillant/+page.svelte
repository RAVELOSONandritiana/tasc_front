<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import SurveillantProfil from '$lib/components/user/profil/SurveillantProfil.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import FindPersonne from '$lib/components/user/profil/FindPersonne.svelte';

	type Personne = {
		name: string;
		lastname: string;
		domicile: string;
		fokontany: string;
		commune: string;
		phone: string;
		email: string;
		connected: boolean;
	};

	const personnes: Personne[] = [
		{
			name: 'RAKOTO',
			lastname: 'Soa Beva',
			domicile: 'Lot C125',
			fokontany: 'Ambtatomalaza',
			commune: 'Alasora',
			phone: '0337329204',
			email: 'hgbmichel@gmail.com',
			connected: true
		},
		{
			name: 'RAKOTO',
			lastname: 'Soa Beva',
			domicile: 'Lot C125',
			fokontany: 'Ambtatomalaza',
			commune: 'Alasora',
			phone: '0337329205',
			email: 'hgbmichel@gmail.com',
			connected: true
		},
		{
			name: 'RAKOTO',
			lastname: 'Soa Beva',
			domicile: 'Lot C125',
			fokontany: 'Ambtatomalaza',
			commune: 'Alasora',
			phone: '0337329206',
			email: 'hgbmichel@gmail.com',
			connected: true
		},
		{
			name: 'RAVELOSON',
			lastname: 'Andritiana Michel',
			domicile: 'Lot C125',
			fokontany: 'Ambtatomalaza',
			commune: 'Alasora',
			phone: '0337329207',
			email: 'hgbmichel@gmail.com',
			connected: true
		}
	];

	const listSurveillant = $state([
		{
			name: 'RAKOTO',
			lastname: 'Soa Beva',
			domicile: 'Lot C125',
			fokontany: 'Ambtatomalaza',
			commune: 'Alasora',
			phone: '0337329206',
			email: 'hgbmichel@gmail.com',
			connected: true,
			poste: 'Surveillant General'
		},
		{
			name: 'RAKOTO',
			lastname: 'Soa Beva',
			domicile: 'Lot C125',
			fokontany: 'Ambtatomalaza',
			commune: 'Alasora',
			phone: '0337329207',
			email: 'hgbmichel@gmail.com',
			connected: true,
			poste: 'Surveillant Principale Seconde'
		}
	]);

	let searchText = $state('');

	const listFiltered = $derived(
		listSurveillant.filter((p) =>
			`${p.name}${p.lastname}${p.email}${p.domicile}${p.fokontany}${p.commune}${p.phone}`
				.toLowerCase()
				.includes(searchText.toLowerCase())
		)
	);

	let searchPersonnes = $state('');

	const findPersonnes = $derived(personnes.filter((p) => p.email == searchPersonnes));

	let setPerson: Personne | null = $state(null);
	function setPersonne(personne: Personne) {
		setPerson = personne;
	}

	function removeFindPersonne(){
		setPerson = null;
	}
</script>

<main class="min-h-full rounded-md bg-sidebar p-4 text-sidebar-foreground">
	<div class="flex justify-between">
		<Input
			type="search"
			placeholder="Rechercher un serverillant"
			class="max-w-md"
			bind:value={searchText}
		/>
		<Dialog.Root>
			<form>
				<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default' })}>
					Nouveau
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Ajouter un nouveau surveillant</Dialog.Title>
						<Dialog.Description>Plus de surveillant ameliorera l'etabilssement.</Dialog.Description>
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
							<div class="space-y-4 rounded-md p-4 border">
								<div class="grid gap-3">
									<Label for="email">Nom</Label>
									<Input id="nom" name="nom" required defaultValue={setPerson.name} />
								</div>
								<div class="grid gap-3">
									<Label for="email">Prenom</Label>
									<Input id="prenom" name="prenom" required defaultValue={setPerson.lastname} />
								</div>
								<Button onclick={removeFindPersonne}>Supprimer personne</Button>
							</div>
						{/if}
					</div>
					<Dialog.Footer>
						<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
							Annuler
						</Dialog.Close>
						<Button type="submit">Confirmer</Button>
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
				<Badge variant="secondary">{p.poste}</Badge>
			</SurveillantProfil>
		{/each}
	</div>
</main>
