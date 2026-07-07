<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Search, Plus, Users, Calendar, Pencil, BookOpen, GraduationCap } from '@lucide/svelte/icons';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';
	import { Select } from '$lib/components/ui/select';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import type { Cours, Examen, EleveCours, Note } from '$lib/types/Materiel.type';
	import type { PageProps } from './$types';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner';

	const { data }: PageProps = $props();

	let searchCours = $state('');

	let listeCours = $state<Cours[]>([...(data.listeCours || [])]);
	let listeExamens = $state<Examen[]>([...(data.listeExamens || [])]);
	let elevesClasse = $state<EleveCours[]>([...(data.elevesClasse || [])]);
	let matieres = $state<{ id: string; nom: string }[]>([...(data.matieres || [])]);
	let enseignants = $state<{ id: string; name: string; lastname: string }[]>([...(data.enseignants || [])]);

	let submitting = $state(false);
	let success = $state(false);
	let errors = $state<Record<string, string>>({});

	let openCoursDialog = $state(false);
	let openCoeffDialog = $state(false);
	let openParticipantsDialog = $state(false);
	let openExamenDialog = $state(false);
	let openNoteDialog = $state(false);
	let openMatiereDialog = $state(false);

	let selectedCours: Cours | null = $state(null);

	let nouveauCours = $state({
		matiereId: '',
		professeurId: '',
		coefficient: 1,
		participants: [] as string[]
	});

	let nouveauCoeff = $state(1);
	let participantsSelectionnes = $state<string[]>([]);

	let nouvelExamen = $state({
		nom: '',
		date: '',
		periode: ''
	});

	let nouvelleNote = $state({
		valeur: 0,
		coefficient: 1,
		libelle: '',
		eleveId: '',
		coursId: '',
		examenId: ''
	});

	let notesCours = $state<Note[]>([]);
	let notesLoading = $state(false);

	$effect(() => {
		if (openCoursDialog) {
			nouveauCours = { matiereId: '', professeurId: '', coefficient: 1, participants: [] };
			errors = {};
			success = false;
		}
	});

	$effect(() => {
		if (openExamenDialog) {
			nouvelExamen = { nom: '', date: '', periode: '' };
		}
	});

	$effect(() => {
		if (openNoteDialog) {
			nouvelleNote = { valeur: 0, coefficient: 1, libelle: '', eleveId: '', coursId: '', examenId: '' };
		}
	});

	const coursFiltres = $derived(
		listeCours.filter(
			(c) =>
				c.nom.toLowerCase().includes(searchCours.toLowerCase()) ||
				(c.professeur?.toLowerCase() || '').includes(searchCours.toLowerCase())
		)
	);

	async function loadNotes(coursId: string) {
		notesLoading = true;
		try {
			const res = await fetch(`/classe/${$page.params.id}/cours/${coursId}?/getNotes&coursId=${coursId}`);
			const result = await res.json();
			if (result.success) {
				notesCours = result.notes || [];
			}
		} catch (e) {
			console.error('Failed to load notes:', e);
		} finally {
			notesLoading = false;
		}
	}

	function openNotes(cours: Cours) {
		selectedCours = cours;
		loadNotes(cours.id);
		openNoteDialog = true;
	}

	function formaterParticipants(cours: Cours): string {
		if (!cours.participants?.length) return 'Tous les élèves';
		return cours.participants.join(', ');
	}

	function toggleParticipantSelection(eleveId: string) {
		if (participantsSelectionnes.includes(eleveId)) {
			participantsSelectionnes = participantsSelectionnes.filter((id) => id !== eleveId);
		} else {
			participantsSelectionnes = [...participantsSelectionnes, eleveId];
		}
	}

	function ouvrirModifierCoefficient(cours: Cours) {
		selectedCours = cours;
		nouveauCoeff = cours.coefficient;
		openCoeffDialog = true;
	}

	function ouvrirModifierParticipants(cours: Cours) {
		selectedCours = cours;
		participantsSelectionnes = cours.participants?.length ? [...cours.participants] : [...elevesClasse.map((e) => e.id)];
		openParticipantsDialog = true;
	}

	function sauvegarderCoefficient() {
		if (!selectedCours) return;
		const formData = new FormData();
		formData.append('coursId', selectedCours.id);
		formData.append('coefficient', nouveauCoeff.toString());

		fetch(`/classe/${$page.params.id}/cours?/updateCoefficient`, {
			method: 'POST',
			body: formData
		}).then(async (res) => {
			const result = await res.json();
			if (result.success) {
				listeCours = listeCours.map((c) =>
					c.id === selectedCours!.id ? { ...c, coefficient: nouveauCoeff } : c
				);
				selectedCours = null;
				openCoeffDialog = false;
			}
		}).catch(console.error);
	}

	function sauvegarderParticipants() {
		if (!selectedCours) return;
		const formData = new FormData();
		formData.append('coursId', selectedCours.id);
		participantsSelectionnes.forEach((id) => formData.append('participants', id));

		fetch(`/classe/${$page.params.id}/cours?/updateParticipants`, {
			method: 'POST',
			body: formData
		}).then(async (res) => {
			const result = await res.json();
			if (result.success) {
				listeCours = listeCours.map((c) =>
					c.id === selectedCours!.id ? { ...c, participants: [...participantsSelectionnes] } : c
				);
				selectedCours = null;
				openParticipantsDialog = false;
			}
		}).catch(console.error);
	}

	function ajouterNote() {
		if (!selectedCours || !nouvelleNote.eleveId || !nouvelleNote.valeur) return;
		const formData = new FormData();
		formData.append('valeur', nouvelleNote.valeur.toString());
		formData.append('coefficient', nouvelleNote.coefficient.toString());
		formData.append('libelle', nouvelleNote.libelle);
		formData.append('eleveId', nouvelleNote.eleveId);
		formData.append('coursId', selectedCours.id);
		if (nouvelleNote.examenId) {
			formData.append('examenId', nouvelleNote.examenId);
		}

		fetch(`/classe/${$page.params.id}/cours?/createNote`, {
			method: 'POST',
			body: formData
		}).then(async (res) => {
			const result = await res.json();
			if (result.success) {
				loadNotes(selectedCours!.id);
				nouvelleNote = { valeur: 0, coefficient: 1, libelle: '', eleveId: '', coursId: '', examenId: '' };
			}
		}).catch(console.error);
	}
</script>

<div class="flex h-screen flex-col bg-sidebar text-sidebar-foreground">
	<div class="sticky top-16 z-50 flex flex-col gap-4 border-b border-sidebar-border bg-sidebar p-4">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<h1 class="text-lg font-semibold">
				Configurer classe
				{#if data.classe}
					- {data.classe.nom || `Niveau ${data.classe.niveau}`}
				{/if}
			</h1>
			<div class="flex flex-col gap-2 md:flex-row md:items-center">
				<Dialog.Root bind:open={openMatiereDialog}>
					<Dialog.Trigger class={buttonVariants({ variant: 'outline', size: 'sm', class: 'gap-2' })}>
						<BookOpen class="size-4" />
						Nouvelle matière
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-sm">
						<Dialog.Header>
							<Dialog.Title>Créer une matière</Dialog.Title>
							<Dialog.Description>Ex: Mathématiques, Physique, Histoire...</Dialog.Description>
						</Dialog.Header>

						<form
							method="POST"
							action={`?/createMatiere`}
							use:enhance={() => {
								return async ({ result }) => {
									if (result.type === 'success' && result.data) {
										const matiere = (result.data as any)?.matiere;
										if (matiere) {
											matieres = [...matieres, { id: matiere.id, nom: matiere.nom }];
										}
										openMatiereDialog = false;
									}
								};
							}}
							class="space-y-4"
						>
							<div class="grid gap-2">
								<Label for="matiere_nom">Nom de la matière *</Label>
								<Input id="matiere_nom" name="nom" placeholder="Ex: Mathématiques" />
							</div>
							<div class="grid gap-2">
								<Label for="matiere_couleur">Couleur</Label>
								<Input id="matiere_couleur" name="couleur" placeholder="#3b82f6" />
							</div>
							<Dialog.Footer class="gap-2 sm:justify-end">
								<Button type="button" variant="outline" size="sm" onclick={() => (openMatiereDialog = false)}>Annuler</Button>
								<Button type="submit" size="sm">Créer</Button>
							</Dialog.Footer>
						</form>
					</Dialog.Content>
				</Dialog.Root>

				<Dialog.Root bind:open={openCoursDialog}>
					<Dialog.Trigger class={buttonVariants({ variant: 'default', size: 'sm', class: 'gap-2' })}>
						<Plus class="size-4" />
						Nouveau cours
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-md">
						<Dialog.Header>
							<Dialog.Title>Ajouter un cours</Dialog.Title>
							<Dialog.Description>Associer une matière et un professeur</Dialog.Description>
						</Dialog.Header>

						{#if success}
							<div class="mb-4 rounded-md border border-emerald-500 bg-emerald-500/10 p-3 text-center">
								<p class="text-sm font-medium text-emerald-500">Cours créé avec succès !</p>
							</div>
						{/if}
						{#if errors._form}
							<div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3">
								<p class="text-sm text-destructive">{errors._form}</p>
							</div>
						{/if}

						<form
							method="POST"
							action={`?/createCours`}
							use:enhance={() => {
								submitting = true;
								errors = {};
								return async ({ result }) => {
									submitting = false;
									if (result.type === 'success') {
										const cours = (result.data as any)?.cours;
										if (cours) {
											listeCours = [...listeCours, {
												id: cours.id,
												nom: cours.matiere?.nom || 'Matière',
												coefficient: cours.coefficient,
												professeur: cours.professeur ? `${cours.professeur.personne?.name || ''} ${cours.professeur.personne?.lastname || ''}`.trim() || '' : '',
												participants: cours.participants || []
											}];
										}
										success = true;
										setTimeout(() => {
											openCoursDialog = false;
										}, 600);
									} else if (result.type === 'failure') {
										errors = (result.data as any)?.errors || {};
									}
								};
							}}
							class="space-y-4"
						>
							<div class="grid gap-2">
								<Label for="matiereId">Matière *</Label>
								<NativeSelect.Root name="matiereId" required>
									<option value="">Choisir une matière</option>
									{#each matieres as matiere}
										<NativeSelect.Option value={matiere.id}>{matiere.nom}</NativeSelect.Option>
									{/each}
								</NativeSelect.Root>
							</div>

							<div class="grid gap-2">
								<Label for="professeurId">Professeur *</Label>
								<NativeSelect.Root name="professeurId" required>
									<option value="">Choisir un professeur</option>
									{#each enseignants as prof}
										<NativeSelect.Option value={prof.id}>{prof.name} {prof.lastname}</NativeSelect.Option>
									{/each}
								</NativeSelect.Root>
							</div>

							<div class="grid gap-2">
								<Label for="coefficient">Coefficient</Label>
								<Input id="coefficient" name="coefficient" type="number" min="1" max="20" value="1" />
							</div>

							<div class="grid gap-2">
								<Label>Participants (élèves)</Label>
								<div class="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
									{#each elevesClasse as eleve}
										<div class="flex items-center gap-2">
											<Checkbox id={`eleve-${eleve.id}`} name="participants" value={eleve.id} />
											<label for={`eleve-${eleve.id}`} class="text-sm">{eleve.nom} {eleve.prenom}</label>
										</div>
									{/each}
								</div>
							</div>

							<div class="flex items-center gap-2">
								<Button type="submit" disabled={submitting || success}>
									{#if submitting}
										<Spinner class="mr-2 size-4" />
										Création...
									{:else if success}
										Créé !
									{:else}
										<Plus class="mr-2 size-4" />
										Créer le cours
									{/if}
								</Button>
								<Button type="button" variant="outline" onclick={() => (openCoursDialog = false)}>Annuler</Button>
							</div>
						</form>
					</Dialog.Content>
				</Dialog.Root>

				<Dialog.Root bind:open={openExamenDialog}>
					<Dialog.Trigger class={buttonVariants({ variant: 'outline', size: 'sm', class: 'gap-2' })}>
						<Calendar class="size-4" />
						Nouvel examen
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-md">
						<Dialog.Header>
							<Dialog.Title>Créer un examen</Dialog.Title>
							<Dialog.Description>Examen pour la classe {data.classe?.nom || ''}</Dialog.Description>
						</Dialog.Header>
						<form
							method="POST"
							action={`?/createExamen`}
							use:enhance={() => {
								return async ({ result }) => {
									if (result.type === 'success') {
										const examen = (result.data as any)?.examen;
										if (examen) {
											listeExamens = [...listeExamens, {
												id: examen.id,
												nom: examen.nom,
												date: new Date(examen.date).toISOString().split('T')[0],
												classeId: examen.classeId,
												periode: examen.periode || undefined
											}];
										}
										openExamenDialog = false;
									}
								};
							}}
							class="space-y-4"
						>
							<div class="grid gap-2">
								<Label for="examen_nom">Nom de l'examen *</Label>
								<Input id="examen_nom" name="nom" placeholder="Examen de mi-semestre" />
							</div>
							<div class="grid gap-2">
								<Label for="examen_date">Date *</Label>
								<Input id="examen_date" name="date" type="date" />
							</div>
							<div class="grid gap-2">
								<Label for="examen_periode">Période</Label>
								<Input id="examen_periode" name="periode" placeholder="Semestre 1" />
							</div>
							<Dialog.Footer class="gap-2 sm:justify-end">
								<Button type="button" variant="outline" size="sm" onclick={() => (openExamenDialog = false)}>Annuler</Button>
								<Button type="submit" size="sm">Créer</Button>
							</Dialog.Footer>
						</form>
					</Dialog.Content>
				</Dialog.Root>
			</div>

			{#if listeExamens.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each listeExamens as examen (examen.id)}
						<span class="rounded-md bg-sidebar-accent/30 px-3 py-1 text-sm">{examen.nom} - {examen.date}</span>
					{/each}
				</div>
			{/if}
		</div>
	

		<div class="mx-auto max-w-7xl">
			{#if listeCours.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-center">
					<BookOpen class="mb-4 size-12 text-muted-foreground" />
					<p class="text-lg font-medium text-muted-foreground">Aucun cours configuré</p>
					<p class="text-sm text-muted-foreground">Commencez par ajouter des matières et des cours à cette classe.</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
												onclick={() => ouvrirModifierCoefficient(cours)}
												aria-label="Modifier le coefficient"
											>
												<Pencil class="size-4" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												class="h-7 w-7"
												onclick={() => ouvrirModifierParticipants(cours)}
												aria-label="Modifier les participants"
											>
												<Users class="size-4" />
											</Button>
											<form
												method="POST"
												action={`?/deleteCours`}
												use:enhance={() => {
													return async ({ result }) => {
														if (result.type === 'success') {
															listeCours = listeCours.filter((c) => c.id !== cours.id);
														}
													};
												}}
											>
												<input type="hidden" name="coursId" value={cours.id} />
												<Button size="icon" variant="ghost" class="h-7 w-7" type="submit" aria-label="Supprimer le cours">
													<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
												</Button>
											</form>
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
												<span class="ml-1 truncate font-medium">{cours.professeur}</span>
											</p>
										{/if}
										<p class="text-sm">
											<span class="text-muted-foreground">Participants :</span>
											<span class="ml-1 truncate font-medium">{formaterParticipants(cours)}</span>
										</p>
									</div>
								</div>
								<div class="mt-4 flex flex-col gap-2">
									<Button
										size="sm"
										variant="secondary"
										class="w-full"
										onclick={() => openNotes(cours)}
									>
										<BookOpen class="mr-1 size-3" />
										Gérer les notes
									</Button>
									{#if listeExamens.length > 0}
										<select
											class="rounded-md border border-sidebar-border bg-background px-2 py-1 text-sm"
											onchange={(e) => {
												const examenId = e.currentTarget.value;
												if (examenId)
													goto(`/classe/${$page.params.id}/cours/${cours.id}?examen=${examenId}`);
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
			{/if}
		</div>
	</div>

	<Dialog.Root bind:open={openCoeffDialog}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>Modifier le coefficient</Dialog.Title>
				<Dialog.Description>
					Coefficient actuel : {selectedCours?.coefficient}
				</Dialog.Description>
			</Dialog.Header>
			<div class="space-y-2 py-4">
				<Label for="new_coeff" class="text-sm font-medium">Nouveau coefficient</Label>
				<Input
					id="new_coeff"
					type="number"
					min="1"
					max="20"
					bind:value={nouveauCoeff}
				/>
			</div>
			<Dialog.Footer class="gap-2 sm:justify-end">
				<Button type="button" variant="outline" size="sm" onclick={() => (openCoeffDialog = false)}>Annuler</Button>
				<Button type="button" size="sm" onclick={sauvegarderCoefficient}>Sauvegarder</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={openParticipantsDialog}>
		<Dialog.Content class="sm:max-w-3xl">
			<Dialog.Header>
				<Dialog.Title>Modifier les participants</Dialog.Title>
				<Dialog.Description>
					Sélectionnez les élèves participants au cours {selectedCours?.nom}
				</Dialog.Description>
			</Dialog.Header>
			<div class="space-y-2 py-4">
				<div class="max-h-96 overflow-y-auto rounded-md border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-12"></Table.Head>
								<Table.Head>Nom</Table.Head>
								<Table.Head>Prénom</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each elevesClasse as eleve (eleve.id)}
								<Table.Row>
									<Table.Cell>
										<Checkbox
											checked={participantsSelectionnes.includes(eleve.id)}
											onclick={() => toggleParticipantSelection(eleve.id)}
										/>
									</Table.Cell>
									<Table.Cell class="font-medium">{eleve.nom}</Table.Cell>
									<Table.Cell>{eleve.prenom}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
				<p class="text-xs text-muted-foreground">
					Cochez uniquement les élèves qui participent à ce cours.
				</p>
			</div>
			<Dialog.Footer class="gap-2 sm:justify-end">
				<Button type="button" variant="outline" size="sm" onclick={() => (openParticipantsDialog = false)}>Annuler</Button>
				<Button type="button" size="sm" onclick={sauvegarderParticipants}>Sauvegarder</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={openNoteDialog}>
		<Dialog.Content class="sm:max-w-3xl">
			<Dialog.Header>
				<Dialog.Title>Gérer les notes - {selectedCours?.nom}</Dialog.Title>
				<Dialog.Description>
					Ajouter et consulter les notes pour ce cours
				</Dialog.Description>
			</Dialog.Header>
			<div class="space-y-4 py-4">
				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-3 rounded-md border p-4">
						<h3 class="text-sm font-semibold">Ajouter une note</h3>
						<form
							method="POST"
							action={`?/createNote`}
							use:enhance={() => {
								return async ({ result }) => {
									if (result.type === 'success' && selectedCours) {
										loadNotes(selectedCours.id);
										nouvelleNote = { valeur: 0, coefficient: 1, libelle: '', eleveId: '', coursId: '', examenId: '' };
									}
								};
							}}
							class="space-y-3"
						>
							<div class="grid gap-2">
								<Label for="eleveId">Élève *</Label>
								<NativeSelect.Root name="eleveId" required>
									<option value="">Choisir un élève</option>
									{#each elevesClasse as eleve}
										<NativeSelect.Option value={eleve.id}>{eleve.nom} {eleve.prenom}</NativeSelect.Option>
									{/each}
								</NativeSelect.Root>
							</div>
							<div class="grid grid-cols-2 gap-2">
								<div class="grid gap-2">
									<Label for="valeur">Note *</Label>
									<Input id="valeur" name="valeur" type="number" step="0.5" min="0" max="20" required />
								</div>
								<div class="grid gap-2">
									<Label for="coefficient">Coefficient</Label>
									<Input id="coefficient" name="coefficient" type="number" min="1" max="20" value="1" />
								</div>
							</div>
							<div class="grid gap-2">
								<Label for="libelle">Libellé</Label>
								<Input id="libelle" name="libelle" placeholder="Devoir, Interrogation..." />
							</div>
							{#if listeExamens.length > 0}
								<div class="grid gap-2">
									<Label for="examenId">Examen</Label>
									<NativeSelect.Root name="examenId">
										<option value="">Sans examen</option>
										{#each listeExamens as examen (examen.id)}
											<NativeSelect.Option value={examen.id}>{examen.nom}</NativeSelect.Option>
										{/each}
									</NativeSelect.Root>
								</div>
							{/if}
							<input type="hidden" name="coursId" value={selectedCours?.id || ''} />
							<Button type="submit" size="sm" class="w-full">Ajouter la note</Button>
						</form>
					</div>

					<div class="space-y-2">
						<h3 class="text-sm font-semibold">Notes enregistrées</h3>
						{#if notesLoading}
							<p class="text-sm text-muted-foreground">Chargement...</p>
						{:else if notesCours.length === 0}
							<p class="text-sm text-muted-foreground">Aucune note enregistrée</p>
						{:else}
							<div class="max-h-80 space-y-2 overflow-y-auto rounded-md border p-2">
								{#each notesCours as note (note.id)}
									<div class="flex items-center justify-between rounded-md bg-muted/30 p-2">
										<div>
											<p class="text-sm font-medium">{note.eleveNom}</p>
											<p class="text-xs text-muted-foreground">
												{note.libelle || 'Note'} {note.examenId ? '(examen)' : ''} - Coeff. {note.coefficient}
											</p>
										</div>
										<span class="text-sm font-semibold">{note.valeur}/20</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
			<Dialog.Footer class="gap-2 sm:justify-end">
				<Button type="button" variant="outline" size="sm" onclick={() => (openNoteDialog = false)}>Fermer</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>
