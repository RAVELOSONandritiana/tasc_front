<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as NativeSelect from '$lib/components/ui/native-select';
	import { Search } from '@lucide/svelte/icons';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import type { EleveCours } from '$lib/types/Materiel.type';

	let searchEleve = $state('');

	let elevesInscrits = $state<EleveCours[]>([
		{
			id: '1',
			nom: 'RANDRIANANTENAINA',
			prenom: 'Tsitoarimanjakely',
			dateNaissance: '2008-05-15',
			actif: true,
			notes: []
		},
		{
			id: '2',
			nom: 'RAKOTO',
			prenom: 'Fanomezamasy',
			dateNaissance: '2008-03-22',
			actif: true,
			notes: []
		},
		{
			id: '3',
			nom: 'ANDRIANTENAINA',
			prenom: 'Bako',
			dateNaissance: '2008-07-10',
			actif: false,
			notes: []
		}
	]);

	let nouvelEleve = $state({
		nom: '',
		prenom: '',
		dateNaissance: ''
	});

	const elevesFiltres = $derived(
		elevesInscrits.filter(
			(e) =>
				`${e.nom}${e.prenom}`
					.toLowerCase()
					.includes(searchEleve.toLowerCase())
		)
	);

	function ajouterEleve() {
		if (!nouvelEleve.nom || !nouvelEleve.prenom || !nouvelEleve.dateNaissance) return;
		const nouveau: EleveCours = {
			id: Date.now().toString(),
			nom: nouvelEleve.nom,
			prenom: nouvelEleve.prenom,
			dateNaissance: nouvelEleve.dateNaissance,
			actif: true,
			notes: []
		};
		elevesInscrits = [...elevesInscrits, nouveau];
		nouvelEleve = { nom: '', prenom: '', dateNaissance: '' };
	}

	function toggleActif(eleveId: string) {
		const eleve = elevesInscrits.find((e) => e.id === eleveId);
		if (eleve) {
			eleve.actif = !eleve.actif;
		}
	}
</script>

<div class="min-h-full bg-sidebar text-sidebar-foreground">
	<div class="sticky top-16 z-50 flex justify-between bg-sidebar p-4">
		<SearchInput placeholder="Rechercher un élève" bind:value={searchEleve} />

		<Dialog.Root>
			<form>
				<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default' })}>
					Nouvel élève
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Ajouter un élève</Dialog.Title>
						<Dialog.Description>L'élève sera automatiquement inscrit à tous les cours</Dialog.Description>
					</Dialog.Header>
					<div class="grid gap-4 py-4">
						<div class="grid gap-2">
							<Label for="nom_eleve">Nom *</Label>
							<Input id="nom_eleve" bind:value={nouvelEleve.nom} placeholder="Nom de l'élève" required />
						</div>
						<div class="grid gap-2">
							<Label for="prenom_eleve">Prénom *</Label>
							<Input id="prenom_eleve" bind:value={nouvelEleve.prenom} placeholder="Prénom de l'élève" required />
						</div>
						<div class="grid gap-2">
							<Label for="date_naiss">Date de naissance *</Label>
							<Input id="date_naiss" type="date" bind:value={nouvelEleve.dateNaissance} required />
						</div>
					</div>
					<Dialog.Footer>
						<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
							Annuler
						</Dialog.Close>
						<Dialog.Close class={buttonVariants({ variant: 'default' })} onclick={ajouterEleve}>
							Ajouter
						</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</form>
		</Dialog.Root>
	</div>

	<div class="p-4">
		<p class="mb-4 text-sm text-muted-foreground">
			Tous les élèves inscrits seront automatiquement affectés aux examens de chaque cours.
		</p>

		<div class="overflow-x-auto rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-12">Actif</Table.Head>
						<Table.Head>Nom</Table.Head>
						<Table.Head>Prénom</Table.Head>
						<Table.Head>Date naissance</Table.Head>
						<Table.Head class="text-center">Notes</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each elevesFiltres as eleve (eleve.id)}
						<Table.Row>
							<Table.Cell>
								<Checkbox checked={eleve.actif} onchange={() => toggleActif(eleve.id)} />
							</Table.Cell>
							<Table.Cell class="font-medium">{eleve.nom}</Table.Cell>
							<Table.Cell>{eleve.prenom}</Table.Cell>
							<Table.Cell>
								{eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString() : '—'}
							</Table.Cell>
							<Table.Cell class="text-center">
								{eleve.notes?.length || 0}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</div>
</div>