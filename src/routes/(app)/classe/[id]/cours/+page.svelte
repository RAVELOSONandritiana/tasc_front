<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Search } from '@lucide/svelte/icons';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { matiere } from '$lib/variables/territoire';
	import { Pencil, Users, Calendar, Plus } from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Cours, Examen, EleveCours } from '$lib/types/Materiel.type';
	import { buttonVariants } from '$lib/components/ui/button/index.js';

	let searchCours = $state('');

	let nouveaCours: Partial<Cours> = $state({
		nom: '',
		coefficient: 1,
		professeur: ''
	});


	let nouveauCoeff = $state(1);

	let coursSelectionne = $state<Cours | null>(null);
	let coursParticipantsSelectionne = $state<Cours | null>(null);
	let participantsSelectionnes = $state<string[]>([]);

	let listeCours = $state<Cours[]>([
		{
			id: '1',
			nom: 'Mathématiques',
			coefficient: 6,
			professeur: 'RANDRIANANTENAINA Tsitoarimanjakely',
			participants: ['1', '2', '3']
		},
		{
			id: '2',
			nom: 'Physique',
			coefficient: 4,
			professeur: 'ANDRIANTENAINA Bako',
			participants: ['1', '3']
		},
		{
			id: '3',
			nom: 'Français',
			coefficient: 5,
			professeur: 'RAKOTO Fanomezamasy',
			participants: ['2', '3']
		}
	]);

	// Examens globaux à la classe
	let listeExamens = $state<Examen[]>([
		{ id: 'e1', nom: 'Examen de mi-semestre', date: '2026-02-15', classeId: '1' },
		{ id: 'e2', nom: 'Examen de fin de semestre', date: '2026-03-20', classeId: '1' }
	]);

	let elevesClasse = $state<EleveCours[]>([
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
			actif: true,
			notes: []
		}
	]);

	let nouvelExamen = $state({
		nom: '',
		date: '',
		periode: ''
	});

	const coursFiltres = $derived(
		listeCours.filter((c) => c.nom.toLowerCase().includes(searchCours.toLowerCase()) || (c.professeur?.toLowerCase() || '').includes(searchCours.toLowerCase()))
	);

	function formaterParticipants(cours: Cours): string {
		if (!cours.participants?.length) return 'Tous les élèves';
		return cours.participants.join(', ');
	}

	function ajouterCours() {
		if (!nouveaCours.nom || nouveaCours.coefficient! < 1) return;
		const nouveau: Cours = {
			id: Date.now().toString(),
			nom: nouveaCours.nom,
			coefficient: nouveaCours.coefficient || 1,
			professeur: nouveaCours.professeur
		};
		listeCours = [...listeCours, nouveau];
		nouveaCours = { nom: '', coefficient: 1, professeur: '' };
	}


	function modifierCoefficient(cours: Cours) {
		coursSelectionne = cours;
		nouveauCoeff = cours.coefficient;
	}

	function sauvegarderCoefficient() {
		if (coursSelectionne) {
			coursSelectionne.coefficient = nouveauCoeff;
			coursSelectionne = null;
		}
	}

	function isParticipantSelectionne(eleveId: string): boolean {
		return participantsSelectionnes.includes(eleveId);
	}

	function toggleParticipant(eleveId: string) {
		if (participantsSelectionnes.includes(eleveId)) {
			participantsSelectionnes = participantsSelectionnes.filter((id) => id !== eleveId);
		} else {
			participantsSelectionnes = [...participantsSelectionnes, eleveId];
		}
	}

	function modifierParticipants(cours: Cours) {
		coursParticipantsSelectionne = cours;
		participantsSelectionnes = cours.participants?.length ? [...cours.participants] : elevesClasse.map((e) => e.id);
	}

	function sauvegarderParticipants() {
		if (coursParticipantsSelectionne) {
			coursParticipantsSelectionne.participants = [...participantsSelectionnes];
			coursParticipantsSelectionne = null;
		}
	}


	function ajouterExamen() {
		if (!nouvelExamen.nom || !nouvelExamen.date) return;
		const examen: Examen = {
			id: Date.now().toString(),
			nom: nouvelExamen.nom,
			date: nouvelExamen.date,
			classeId: '1',
			periode: nouvelExamen.periode
		};
		listeExamens = [...listeExamens, examen];
		nouvelExamen = { nom: '', date: '', periode: '' };
	}
</script>

<div class="min-h-full bg-sidebar text-sidebar-foreground">
	<div class="sticky top-16 z-50 flex flex-col gap-4 bg-sidebar p-4">
		<div class="flex justify-between">
			<SearchInput placeholder="Rechercher un cours" bind:value={searchCours} />
			<Dialog.Root>
				<form>
					<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default', class: 'h-9' })}>
						<Calendar class="mr-1 size-4" />
						Nouvel examen
					</Dialog.Trigger>
<Dialog.Content class="sm:max-w-md">
					<Dialog.Header class="mb-1 space-y-1">
						<Dialog.Title class="text-xl font-semibold">Créer un examen global</Dialog.Title>
						<Dialog.Description>Cet examen pourra être utilisé par toutes les matières pour saisir les notes</Dialog.Description>
					</Dialog.Header>

					<div class="space-y-4 py-2">
						<div class="grid gap-2">
							<Label for="examen_nom" class="text-sm font-medium">Nom de l'examen *</Label>
							<Input
								id="examen_nom"
								bind:value={nouvelExamen.nom}
								placeholder="Examen de mi-semestre"
								class="mt-1.5"
							/>
						</div>
						<div class="grid gap-2">
							<Label for="examen_date" class="text-sm font-medium">Date *</Label>
							<Input
								id="examen_date"
								type="date"
								bind:value={nouvelExamen.date}
								class="mt-1.5"
							/>
						</div>
						<div class="grid gap-2">
							<Label for="examen_periode" class="text-sm font-medium">Période</Label>
							<Input
								id="examen_periode"
								bind:value={nouvelExamen.periode}
								placeholder="Semestre 1"
								class="mt-1.5"
							/>
						</div>
					</div>

					<Dialog.Footer class="mt-2 gap-2 sm:justify-end">
						<Button variant="outline" size="sm">Annuler</Button>
						<Button variant="default" size="sm" onclick={ajouterExamen}>Créer</Button>
					</Dialog.Footer>
				</Dialog.Content>
				</form>
			</Dialog.Root>
		</div>

		{#if listeExamens.length > 0}
			<div class="flex flex-wrap gap-2">
				{#each listeExamens as examen (examen.id)}
					<span class="rounded-md bg-sidebar-accent/30 px-3 py-1 text-sm">
						{examen.nom} - {examen.date}
					</span>
				{/each}
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
		{#each coursFiltres as cours (cours.id)}
			<CardUI>
				<div class="flex h-full flex-col p-4">
					<div class="flex-1">
						<div class="flex items-start justify-between">
							<h3 class="text-lg font-semibold">{cours.nom}</h3>
							<div class="flex gap-1">
								<Button
									size="icon"
									variant="ghost"
									class="h-7 w-7"
									onclick={() => modifierCoefficient(cours)}
									aria-label="Modifier le coefficient"
								>
									<Pencil class="size-4" />
								</Button>
								<Button
									size="icon"
									variant="ghost"
									class="h-7 w-7"
									onclick={() => modifierParticipants(cours)}
									aria-label="Modifier les participants"
								>
									<Users class="size-4" />
								</Button>
							</div>
						</div>
						<div class="mt-3 space-y-2">
							<p class="text-sm">
								<span class="text-muted-foreground">Coefficient :</span>
								<span class="ml-1 font-medium">{cours.coefficient}</span>
							</p>
							{#if cours.professeur}
								<p class="text-sm">
									<span class="text-muted-foreground">Professeur :</span>
									<span class="ml-1 font-medium truncate">{cours.professeur}</span>
								</p>
							{/if}
							<p class="text-sm">
								<span class="text-muted-foreground">Participants :</span>
								<span class="ml-1 font-medium truncate">{formaterParticipants(cours)}</span>
							</p>
						</div>
					</div>
					<div class="mt-4 flex flex-col gap-2">
						<Button
							size="sm"
							variant="secondary"
							class="w-full"
							onclick={() => goto(`/classe/${$page.params.id}/cours/${cours.id}`)}
						>
							<Users class="mr-1 size-3" />
							Gérer les notes
						</Button>
						{#if listeExamens.length > 0}
							<select
								class="rounded-md border border-sidebar-border bg-background px-2 py-1 text-sm"
								onchange={(e) => {
									const examenId = e.currentTarget.value;
									if (examenId) goto(`/classe/${$page.params.id}/cours/${cours.id}?examen=${examenId}`);
								}}
							>
								<option value="">Sélectionner un examen...</option>
								{#each listeExamens as examen (examen.id)}
									<option value={examen.id}>{examen.nom}</option>
								{/each}
							</select>
						{/if}
					</div>
				</div>
			</CardUI>
		{/each}
	</div>


<Dialog.Root open={coursParticipantsSelectionne !== null}>
	<Dialog.Content class="sm:max-w-3xl">
		<Dialog.Header>
			<Dialog.Title>Modifier les participants</Dialog.Title>
			<Dialog.Description>
				Sélectionnez les élèves participants au cours {coursParticipantsSelectionne?.nom}
			</Dialog.Description>
		</Dialog.Header>
		<div class="py-4 space-y-2">
			<div class="flex-1">
				<p class="text-sm text-muted-foreground mb-2">
					Sélectionnez les élèves participants au cours {coursParticipantsSelectionne?.nom}
				</p>
			</div>
			<div class="overflow-x-auto rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-12 whitespace-nowrap">Participant</Table.Head>
							<Table.Head>Nom</Table.Head>
							<Table.Head>Prénom</Table.Head>
							<Table.Head>Date naissance</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each elevesClasse as eleve (eleve.id)}
							<Table.Row>
								<Table.Cell>
									<Checkbox checked={isParticipantSelectionne(eleve.id)} onchange={() => toggleParticipant(eleve.id)} />
								</Table.Cell>
								<Table.Cell class="font-medium">{eleve.nom}</Table.Cell>
								<Table.Cell>{eleve.prenom}</Table.Cell>
								<Table.Cell>
									{eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString() : '—'}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
			<p class="mt-2 text-xs text-muted-foreground">
				Cochez uniquement les élèves qui participent à ce cours.
			</p>
		</div>
		<Dialog.Footer>
			<Button variant="outline" size="sm" onclick={() => (coursParticipantsSelectionne = null)}>Annuler</Button>
			<Button variant="default" size="sm" onclick={sauvegarderParticipants}>Sauvegarder</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
</div>

<Dialog.Root open={coursSelectionne !== null}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Modifier le coefficient</Dialog.Title>
			<Dialog.Description>
				Changez le coefficient du cours {coursSelectionne?.nom}
			</Dialog.Description>
		</Dialog.Header>
		<div class="py-4 space-y-2">
			<Label for="new_coeff" class="text-sm font-medium">Nouveau coefficient</Label>
			<Input
				id="new_coeff"
				type="number"
				min="1"
				max="20"
				bind:value={nouveauCoeff}
				placeholder="Entrez le coefficient"
				class="mt-1.5"
			/>
		</div>
		<Dialog.Footer>
			<Button variant="outline" size="sm" onclick={() => (coursSelectionne = null)}>Annuler</Button>
			<Button variant="default" size="sm" onclick={sauvegarderCoefficient}>Sauvegarder</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>