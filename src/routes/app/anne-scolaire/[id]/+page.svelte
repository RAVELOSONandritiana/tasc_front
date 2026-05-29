<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Input } from '$lib/components/ui/input';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import CardEmploye from '$lib/components/user/CardEmploye.svelte';

	let surveillant = [
		{
			id: 0,
			name: 'Lalaina',
			lastname: 'RAKOTO',
			poste: 'Surveillant Général',
			sexe: 1, // Homme
			image: 'https://i.pravatar.cc/150?u=0'
		},
		{
			id: 1,
			name: 'Soa',
			lastname: 'ANDRIANIRINA',
			poste: 'Surveillante Principale',
			sexe: 2, // Femme
			image: 'https://i.pravatar.cc/150?u=1'
		},
		{
			id: 2,
			name: 'Mamy',
			lastname: 'RAZAFIMBELO',
			poste: "Surveillant d'Externes",
			sexe: 1,
			image: 'https://i.pravatar.cc/150?u=2'
		},
		{
			id: 3,
			name: 'Kanto',
			lastname: 'RANDRIANARISOA',
			poste: 'Surveillant de Quartier',
			sexe: 1,
			image: 'https://i.pravatar.cc/150?u=3'
		},
		{
			id: 4,
			name: 'Tahina',
			lastname: 'RABEARIMANANA',
			poste: "Surveillante d'Internat",
			sexe: 2,
			image: 'https://i.pravatar.cc/150?u=4'
		},
		{
			id: 5,
			name: 'Fara',
			lastname: 'RATIARISON',
			poste: 'Surveillant de Permanence',
			sexe: 1,
			image: 'https://i.pravatar.cc/150?u=5'
		},
		{
			id: 6,
			name: 'Vololona',
			lastname: 'ANDRIAMAHEFA',
			poste: 'Surveillante Générale Adjointe',
			sexe: 2,
			image: 'https://i.pravatar.cc/150?u=6'
		},
		{
			id: 7,
			name: 'Heritiana',
			lastname: 'RAKOTOMALALA',
			poste: 'Surveillant de Cour',
			sexe: 1,
			image: 'https://i.pravatar.cc/150?u=7'
		},
		{
			id: 8,
			name: 'Sarobidy',
			lastname: 'RANDRIAMBOLOLONA',
			poste: 'Surveillante de Study Hall',
			sexe: 2,
			image: 'https://i.pravatar.cc/150?u=8'
		},
		{
			id: 9,
			name: 'Andry',
			lastname: 'RAZAFINDRAIBE',
			poste: 'Surveillant de Nuit',
			sexe: 1,
			image: 'https://i.pravatar.cc/150?u=9'
		}
	];
</script>

<main class="m-4 min-h-full rounded-md bg-sidebar text-sidebar-foreground">
	<div class="flex justify-between">
		<Input type="search" placeholder="Rechercher anne scolaire" class="max-w-md" />
		<Dialog.Root>
			<form>
				<Dialog.Trigger type="button" class={buttonVariants({ variant: 'outline' })}>
					Creer
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-106.25">
					<Dialog.Header>
						<Dialog.Title>Ajouter un collegue</Dialog.Title>
						<Dialog.Description>Avoir des collaborateurs est essentiel</Dialog.Description>
					</Dialog.Header>
					<div class="grid gap-4">
						<div class="grid gap-3">
							<Label for="name">Nom</Label>
							<Input id="name" defaultValue="RAKOTO" />
						</div>
						<div class="grid gap-3">
							<Label for="lastname">Prenom</Label>
							<Input id="lastname" defaultValue="Lalasoa" />
						</div>
					</div>
					<Dialog.Footer>
						<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
							Annuler
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
	<div class="my-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
		{#each surveillant as s (s.id)}
			<CardEmploye
				lastname={s.lastname}
				name={s.name}
				poste={s.poste}
				image={s.image}
			/>
		{/each}
	</div>
</main>
