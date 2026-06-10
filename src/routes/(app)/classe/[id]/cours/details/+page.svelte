<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Plus, Calendar } from '@lucide/svelte/icons';
	import type { EleveCours, Note, Examen, Cours } from '$lib/types/Materiel.type';

	const coursInfo: Cours = {
		id: '1',
		nom: 'Mathématiques',
		coefficient: 6,
		professeur: 'RANDRIANANTENAINA Tsitoarimanjakely',
		eleves: [],
		examens: [
			{ id: 'e1', nom: 'Examen 1', date: '2026-02-15', coursId: '1', coefficient: 4 },
			{ id: 'e2', nom: 'Examen 2', date: '2026-03-20', coursId: '1', coefficient: 6 }
		]
	};

	let elevesCours = $state<EleveCours[]>([
		{
			id: '1',
			nom: 'RANDRIANANTENAINA',
			prenom: 'Tsitoarimanjakely',
			dateNaissance: '2008-05-15',
			actif: true,
			notes: [
				{ id: 'n1', valeur: 15, coefficient: 2, date: '2026-01-10', libelle: 'Interrogation 1', coursId: '1' },
				{ id: 'n2', valeur: 12, coefficient: 4, date: '2026-01-25', libelle: 'Devoir 1', coursId: '1' }
			]
		},
		{
			id: '2',
			nom: 'RAKOTO',
			prenom: 'Fanomezamasy',
			dateNaissance: '2008-03-22',
			actif: true,
			notes: [
				{ id: 'n3', valeur: 18, coefficient: 2, date: '2026-01-10', libelle: 'Interrogation 1', coursId: '1' },
				{ id: 'n4', valeur: 14, coefficient: 4, date: '2026-01-25', libelle: 'Devoir 1', coursId: '1' }
			]
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

	let nouvelleNote = $state({
		valeur: 0,
		coefficient: 1,
		libelle: '',
		eleveId: ''
	});

	let nouvelExamen = $state({
		nom: '',
		date: '',
		coefficient: 1
	});

	function calculerMoyenne(eleve: EleveCours): number {
		if (!eleve.notes || eleve.notes.length === 0) return 0;
		const notesCours = eleve.notes.filter((n) => n.coursId === coursInfo.id);
		if (notesCours.length === 0) return 0;
		const totalPoints = notesCours.reduce((sum, n) => sum + n.valeur * n.coefficient, 0);
		const totalCoeff = notesCours.reduce((sum, n) => sum + n.coefficient, 0);
		return totalCoeff > 0 ? Math.round((totalPoints / totalCoeff) * 100) / 100 : 0;
	}

	function ajouterNote() {
		if (!nouvelleNote.eleveId || !nouvelleNote.libelle) return;
		const eleve = elevesCours.find((e) => e.id === nouvelleNote.eleveId);
		const note: Note = {
			id: Date.now().toString(),
			valeur: nouvelleNote.valeur || 0,
			coefficient: nouvelleNote.coefficient || 1,
			date: new Date().toISOString().split('T')[0],
			libelle: nouvelleNote.libelle,
			coursId: coursInfo.id
		};
		if (eleve) {
			if (!eleve.notes) eleve.notes = [];
			eleve.notes = [...eleve.notes, note];
		}
		nouvelleNote = { valeur: 0, coefficient: 1, libelle: '', eleveId: '' };
	}

	function ajouterExamen() {
		if (!nouvelExamen.nom || !nouvelExamen.date) return;
		const examen: Examen = {
			id: Date.now().toString(),
			nom: nouvelExamen.nom,
			date: nouvelExamen.date,
			coursId: coursInfo.id,
			coefficient: nouvelExamen.coefficient || 1
		};
		if (!coursInfo.examens) coursInfo.examens = [];
		coursInfo.examens = [...coursInfo.examens, examen];
		nouvelExamen = { nom: '', date: '', coefficient: 1 };
	}

	function modifierCoefficientNote(eleveId: string, noteId: string, delta: number) {
		const eleve = elevesCours.find((e) => e.id === eleveId);
		if (eleve) {
			const note = eleve.notes?.find((n) => n.id === noteId);
			if (note && note.coefficient + delta >= 1) {
				note.coefficient += delta;
			}
		}
	}

	// Gestion des notes d'examens
	let noteExamenEnCours = $state<Record<string, Record<string, number>>>({});

	function setNoteExamen(examenId: string, eleveId: string, valeur: number) {
		if (!noteExamenEnCours[examenId]) noteExamenEnCours[examenId] = {};
		noteExamenEnCours[examenId][eleveId] = valeur;
	}

	function sauvegarderNotesExamen(examenId: string) {
		const examen = coursInfo.examens?.find((e) => e.id === examenId);
		if (!examen) return;

		Object.entries(noteExamenEnCours[examenId] || {}).forEach(([eleveId, valeur]) => {
			const eleve = elevesCours.find((e) => e.id === eleveId);
			if (eleve) {
				const noteExistante = eleve.notes?.find((n) => n.examenId === examenId);
				if (noteExistante) {
					noteExistante.valeur = valeur;
				} else {
					const nouvelleNoteExamen: Note = {
						id: Date.now().toString() + '_' + eleveId,
						valeur,
						coefficient: examen.coefficient,
						date: examen.date,
						libelle: examen.nom,
						coursId: coursInfo.id,
						examenId
					};
					eleve.notes = eleve.notes || [];
					eleve.notes = [...eleve.notes, nouvelleNoteExamen];
				}
			}
		});
		if (noteExamenEnCours[examenId]) {
			delete noteExamenEnCours[examenId];
		}
	}
</script>

<div class="min-h-full bg-sidebar p-4 text-sidebar-foreground">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">{coursInfo.nom}</h1>
			<p class="text-sm text-muted-foreground">
				Professeur : {coursInfo.professeur} • Coefficient : {coursInfo.coefficient}
			</p>
		</div>
		<div class="flex gap-2">
			<Dialog.Root>
				<Dialog.Trigger class={buttonVariants({ variant: 'default' })}>
					<Plus class="mr-1 size-4" />
					Nouvelle note
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Ajouter une note</Dialog.Title>
						<Dialog.Description>
							Ajoutez une note pour un élève de ce cours
						</Dialog.Description>
					</Dialog.Header>
					<div class="grid gap-4 py-4">
						<div class="grid gap-2">
							<Label for="eleve">Élève *</Label>
							<select
								id="eleve"
								class="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm"
								bind:value={nouvelleNote.eleveId}
							>
								{#each elevesCours as eleve (eleve.id)}
									<option value={eleve.id}>{eleve.nom} {eleve.prenom}</option>
								{/each}
							</select>
						</div>
						<div class="grid gap-2">
							<Label for="libelle">Libellé *</Label>
							<Input
								id="libelle"
								bind:value={nouvelleNote.libelle}
								placeholder="Ex: Interrogation 1"
							/>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="grid gap-2">
								<Label for="valeur">Note (0-20) *</Label>
								<Input
									id="valeur"
									type="number"
									min="0"
									max="20"
									step="0.25"
									bind:value={nouvelleNote.valeur}
								/>
							</div>
							<div class="grid gap-2">
								<Label for="coeff_note">Coefficient *</Label>
								<Input
									id="coeff_note"
									type="number"
									min="1"
									max="10"
									bind:value={nouvelleNote.coefficient}
								/>
							</div>
						</div>
					</div>
					<Dialog.Footer>
						<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
							Annuler
						</Dialog.Close>
						<Dialog.Close class={buttonVariants({ variant: 'default' })} onclick={ajouterNote}>
							Ajouter
						</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>

			<Dialog.Root>
				<Dialog.Trigger class={buttonVariants({ variant: 'secondary' })}>
					<Calendar class="mr-1 size-4" />
					Examen
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Créer un examen</Dialog.Title>
						<Dialog.Description>
							Tous les élèves actifs seront automatiquement inscrits
						</Dialog.Description>
					</Dialog.Header>
					<div class="grid gap-4 py-4">
						<div class="grid gap-2">
							<Label for="examen_nom">Nom de l'examen *</Label>
							<Input
								id="examen_nom"
								bind:value={nouvelExamen.nom}
								placeholder="Examen final"
							/>
						</div>
						<div class="grid gap-2">
							<Label for="examen_date">Date *</Label>
							<Input
								id="examen_date"
								type="date"
								bind:value={nouvelExamen.date}
							/>
						</div>
						<div class="grid gap-2">
							<Label for="examen_coeff">Coefficient *</Label>
							<Input
								id="examen_coeff"
								type="number"
								min="1"
								max="20"
								bind:value={nouvelExamen.coefficient}
							/>
						</div>
					</div>
					<Dialog.Footer>
						<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
							Annuler
						</Dialog.Close>
						<Dialog.Close class={buttonVariants({ variant: 'default' })} onclick={ajouterExamen}>
							Créer
						</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6">
		<CardUI>
			<div class="p-4">
				<h2 class="mb-4 font-semibold">Liste des élèves et leurs notes</h2>
				<div class="overflow-x-auto">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-10">Actif</Table.Head>
								<Table.Head>Élève</Table.Head>
								<Table.Head class="text-center">Notes</Table.Head>
								<Table.Head class="text-center">Moyenne</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each elevesCours as eleve (eleve.id)}
								<Table.Row>
									<Table.Cell>
										<Checkbox checked={eleve.actif} />
									</Table.Cell>
									<Table.Cell>
										<div class="font-medium">{eleve.nom} {eleve.prenom}</div>
										<div class="text-xs text-muted-foreground">
											{eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString() : '—'}
										</div>
									</Table.Cell>
									<Table.Cell>
										{#if eleve.notes && eleve.notes.length > 0}
											<div class="flex flex-col gap-1">
												{#each eleve.notes as note (note.id)}
													{#if note.coursId === coursInfo.id}
														<div class="flex items-center gap-2 text-xs">
															<span class="truncate">{note.libelle}:</span>
															<span class="font-medium">{note.valeur}/20</span>
															<span class="text-muted-foreground">x{note.coefficient}</span>
															<Button
																size="sm"
																variant="ghost"
																class="h-5 w-5 p-0"
																onclick={() => modifierCoefficientNote(eleve.id, note.id, -1)}
															>
																-
															</Button>
															<Button
																size="sm"
																variant="ghost"
																class="h-5 w-5 p-0"
																onclick={() => modifierCoefficientNote(eleve.id, note.id, 1)}
															>
																+
															</Button>
														</div>
													{/if}
												{/each}
											</div>
										{:else}
											<span class="text-xs italic text-muted-foreground">Aucune note</span>
										{/if}
									</Table.Cell>
									<Table.Cell class="text-center">
										<span class="font-medium text-lg">{calculerMoyenne(eleve)}</span>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</div>
		</CardUI>

		{#if coursInfo.examens && coursInfo.examens.length > 0}
			{#each coursInfo.examens as examen (examen.id)}
				<CardUI>
					<div class="p-4">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="font-semibold">{examen.nom}</h2>
							<span class="text-xs text-muted-foreground">{examen.date} • Coef: {examen.coefficient}</span>
						</div>
						<div class="overflow-x-auto">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head>Élève</Table.Head>
										<Table.Head class="w-20">Note</Table.Head>
										<Table.Head class="w-20">Action</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each elevesCours.filter((e) => e.actif) as eleve (eleve.id)}
										{@const noteExistante = eleve.notes?.find((n) => n.examenId === examen.id)?.valeur}
										<Table.Row>
											<Table.Cell>
												<div class="font-medium">{eleve.nom} {eleve.prenom}</div>
											</Table.Cell>
											<Table.Cell>
												<Input
													type="number"
													min="0"
													max="20"
													step="0.25"
													class="h-8 w-16 px-2 text-sm"
													value={noteExistante ?? noteExamenEnCours[examen.id]?.[eleve.id] ?? ''}
													oninput={(e) => setNoteExamen(examen.id, eleve.id, parseFloat(e.currentTarget.value))}
													placeholder="0-20"
												/>
											</Table.Cell>
											<Table.Cell>
												<Button size="sm" onclick={() => sauvegarderNotesExamen(examen.id)}>
													Sauvegarder
												</Button>
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>
					</div>
				</CardUI>
			{/each}
		{/if}
	</div>
</div>