<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Table from '$lib/components/ui/table';
	import * as NativeSelect from '$lib/components/ui/native-select';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Calculator, Plus, Pencil, Trash2 } from '@lucide/svelte/icons';
	import type { EleveCours, Note, Examen } from '$lib/types/Materiel.type';

	const coursInfo = {
		nom: 'Mathématiques',
		professeur: 'RANDRIANANTENAINA Tsitoarimanjakely',
		coefficient: 6
	};

	let elevesCours = $state<EleveCours[]>([
		{
			id: '1',
			nom: 'RANDRIANANTENAINA',
			prenom: 'Tsitoarimanjakely',
			dateNaissance: '2008-05-15',
			actif: true,
			notes: [
				{ id: 'n1', valeur: 15, coefficient: 2, date: '2026-01-10', libelle: 'Interrogation 1' },
				{ id: 'n2', valeur: 12, coefficient: 4, date: '2026-01-25', libelle: 'Devoir 1' }
			]
		},
		{
			id: '2',
			nom: 'RAKOTO',
			prenom: 'Fanomezamasy',
			dateNaissance: '2008-03-22',
			actif: true,
			notes: [
				{ id: 'n3', valeur: 18, coefficient: 2, date: '2026-01-10', libelle: 'Interrogation 1' },
				{ id: 'n4', valeur: 14, coefficient: 4, date: '2026-01-25', libelle: 'Devoir 1' }
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

	let examenSelectionne = $state<Examen | null>(null);

	let examens = $state<Examen[]>([
		{ id: 'e1', nom: 'Examen 1', date: '2026-02-15', coursId: '1', coefficient: 4 },
		{ id: 'e2', nom: 'Examen 2', date: '2026-03-20', coursId: '1', coefficient: 6 }
	]);

	function calculerMoyenne(eleve: EleveCours): number {
		if (!eleve.notes || eleve.notes.length === 0) return 0;
		const totalPoints = eleve.notes.reduce((sum, n) => sum + n.valeur * n.coefficient, 0);
		const totalCoeff = eleve.notes.reduce((sum, n) => sum + n.coefficient, 0);
		return totalCoeff > 0 ? Math.round((totalPoints / totalCoeff) * 100) / 100 : 0;
	}

	function ajouterNote() {
		if (!nouvelleNote.eleveId || !nouvelleNote.libelle || nouvelleNote.valeur < 0 || nouvelleNote.valeur > 20) return;
		const eleve = elevesCours.find((e) => e.id === nouvelleNote.eleveId);
		if (eleve) {
			const note: Note = {
				id: Date.now().toString(),
				valeur: nouvelleNote.valeur,
				coefficient: nouvelleNote.coefficient || 1,
				date: new Date().toISOString().split('T')[0],
				libelle: nouvelleNote.libelle
			};
			if (!eleve.notes) eleve.notes = [];
			eleve.notes = [...eleve.notes, note];
		}
		nouvelleNote = { valeur: 0, coefficient: 1, libelle: '', eleveId: '' };
	}

	function modifierCoefficientNote(eleveId: string, noteId: string, nouveauCoeff: number) {
		const eleve = elevesCours.find((e) => e.id === eleveId);
		if (eleve) {
			const note = eleve.notes?.find((n) => n.id === noteId);
			if (note) {
				note.coefficient = nouveauCoeff;
			}
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
							Les élèves inscrits seront automatiquement concernérés par les examens
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

			<AlertDialog.Root>
				<AlertDialog.Trigger class={buttonVariants({ variant: 'secondary' })}>
					<Plus class="mr-1 size-4" />
					Examen
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Créer un examen</AlertDialog.Title>
						<AlertDialog.Description>
							Tous les élèves actifs seront automatiquement inscrits à cet examen
						</AlertDialog.Description>
					</AlertDialog.Header>
					<div class="py-4">
						<Label for="examen_nom">Nom de l'examen</Label>
						<Input id="examen_nom" placeholder="Examen final" />
					</div>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
						<AlertDialog.Action>Créer</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
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
											{eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString() : 'Date N/A'}
										</div>
									</Table.Cell>
									<Table.Cell>
										{#if eleve.notes && eleve.notes.length > 0}
											<div class="flex flex-col gap-1">
												{#each eleve.notes as note (note.id)}
													<div class="flex items-center gap-2 text-xs">
														<span>{note.libelle}:</span>
														<span class="font-medium">{note.valeur}/20</span>
														<span class="text-muted-foreground">x{note.coefficient}</span>
														<Button
															size="sm"
															variant="ghost"
															class="h-5 w-5 p-0"
															onclick={() => {
																const n = note.coefficient;
																if (n > 1) note.coefficient = n - 1;
															}}
														>
															-
														</Button>
														<Button
															size="sm"
															variant="ghost"
															class="h-5 w-5 p-0"
															onclick={() => {
																note.coefficient = note.coefficient + 1;
															}}
														>
															+
														</Button>
													</div>
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

		<CardUI>
			<div class="p-4">
				<h2 class="mb-4 font-semibold">Examens à venir</h2>
				<div class="space-y-3">
					{#each examens as examen (examen.id)}
						<div class="flex items-center justify-between rounded-md border border-sidebar-border p-3">
							<div>
								<p class="font-medium">{examen.nom}</p>
								<p class="text-xs text-muted-foreground">
									Coefficient : {examen.coefficient} • Date : {examen.date}
								</p>
							</div>
							<Badge variant="secondary">{examen.date}</Badge>
						</div>
					{/each}
				</div>
			</div>
		</CardUI>
	</div>
</div>