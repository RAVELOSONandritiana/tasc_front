<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Plus, Calendar, Save, FileText, Lock } from '@lucide/svelte/icons';
	import type { EleveCours, Note, Examen, Cours } from '$lib/types/Materiel.type';
	import { page } from '$app/stores';

	const classeId = $page.params.id || '1';
	const coursId = $page.params.coursId || '1';

	let listeCours = $state<Cours[]>([
		{ id: '1', nom: 'Mathématiques', coefficient: 6, professeur: 'RANDRIANANTENAINA Tsitoarimanjakely' },
		{ id: '2', nom: 'Physique', coefficient: 4, professeur: 'ANDRIANTENAINA Bako' },
		{ id: '3', nom: 'Français', coefficient: 5, professeur: 'RAKOTO Fanomezamasy' }
	]);

	let listeExamens = $state<Examen[]>([
		{ id: 'e1', nom: 'Examen de mi-semestre', date: '2026-02-15', classeId: classeId, periode: 'Semestre 1' },
		{ id: 'e2', nom: 'Examen de fin de semestre', date: '2026-03-20', classeId: classeId, periode: 'Semestre 1' }
	]);

	let elevesClasse = $state<EleveCours[]>([
		{
			id: '1',
			nom: 'RANDRIANANTENAINA',
			prenom: 'Tsitoarimanjakely',
			dateNaissance: '2008-05-15',
			actif: true,
			notes: [
				{ id: 'n1', valeur: 15, coefficient: 4, date: '2026-02-15', libelle: 'Examen de mi-semestre', coursId: '1', examenId: 'e1' }
			]
		},
		{
			id: '2',
			nom: 'RAKOTO',
			prenom: 'Fanomezamasy',
			dateNaissance: '2008-03-22',
			actif: true,
			notes: [
				{ id: 'n2', valeur: 16, coefficient: 4, date: '2026-02-15', libelle: 'Examen de mi-semestre', coursId: '1', examenId: 'e1' }
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

	let notesTemp = $state<Record<string, number>>({});

	function setNote(eleveId: string, valeur: number) {
		notesTemp[eleveId] = valeur;
	}

	function sauvegarderNotes() {
		if (!examenSelectionne || !coursInfo) return;
		
		Object.entries(notesTemp).forEach(([eleveId, valeur]) => {
			const eleve = elevesClasse.find((e) => e.id === eleveId);
			if (eleve && valeur > 0) {
				const noteExistante = eleve.notes?.find((n) => n.examenId === examenSelectionne.id && n.coursId === coursInfo.id);
				if (noteExistante) {
					noteExistante.valeur = valeur;
				} else {
					const nouvelleNote: Note = {
						id: Date.now().toString() + '_' + eleveId,
						valeur,
						coefficient: coursInfo.coefficient,
						date: examenSelectionne.date,
						libelle: examenSelectionne.nom,
						coursId: coursInfo.id,
						examenId: examenSelectionne.id
					};
					eleve.notes = eleve.notes || [];
					eleve.notes = [...eleve.notes, nouvelleNote];
				}
			}
		});
		notesTemp = {};
	}

	function getNoteExistante(eleveId: string): number | undefined {
		const eleve = elevesClasse.find((e) => e.id === eleveId);
		return eleve?.notes?.find((n) => n.examenId === examenSelectionne?.id && n.coursId === coursInfo?.id)?.valeur;
	}

	const coursInfo = $derived(listeCours.find((c) => c.id === coursId));
	
	let examenSelectionne = $derived<Examen | null>(
		(() => {
			const examenId = $page.url.searchParams.get('examen');
			return listeExamens.find((e) => e.id === examenId) || null;
		})()
	);

	function calculerMoyenne(eleve: EleveCours): number {
		const notes = eleve.notes?.filter((n) => n.coursId === coursInfo?.id && n.examenId === examenSelectionne?.id) || [];
		if (notes.length === 0) {
			const notesTempVals = Object.entries(notesTemp).filter(([id]) => {
				const e = elevesClasse.find((e) => e.id === id);
				return e && notesTemp[id] > 0;
			}).map(([_, v]) => v);
			if (notesTempVals.length === 0) return 0;
			return notesTempVals[0];
		}
		return notes[0].valeur;
	}
</script>

<div class="min-h-full bg-sidebar p-4 text-sidebar-foreground">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">{coursInfo?.nom || 'Cours'}</h1>
			<p class="text-sm text-muted-foreground">
				Professeur : {coursInfo?.professeur || '—'} • Coefficient : {coursInfo?.coefficient}
			</p>
			{#if examenSelectionne}
				<p class="text-xs text-muted-foreground mt-1">
					Examen : {examenSelectionne.nom} • {examenSelectionne.date}
				</p>
			{/if}
		</div>
		{#if examenSelectionne}
			<Button variant="default" class="gap-2" onclick={sauvegarderNotes}>
				<Save class="size-4" />
				Sauvegarder
			</Button>
		{/if}
	</div>

	{#if !examenSelectionne}
		<div class="rounded-md border p-8 text-center">
			<FileText class="mx-auto mb-4 size-12 text-muted-foreground" />
			<p class="text-muted-foreground mb-4">Sélectionnez un examen depuis la page des cours</p>
			<div class="flex justify-center gap-2">
				{#each listeExamens as examen (examen.id)}
					<a href="/classe/{classeId}/cours/{coursId}?examen={examen.id}">
						<Button size="sm" variant="outline">{examen.nom}</Button>
					</a>
				{/each}
			</div>
		</div>
	{:else}
		<CardUI>
			<div class="p-4">
				<h2 class="mb-4 font-semibold">Notes des élèves pour {examenSelectionne.nom}</h2>
				<div class="overflow-x-auto">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Élève</Table.Head>
								<Table.Head class="text-center">{coursInfo?.nom}</Table.Head>
								<Table.Head class="text-center">Autres matières</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each elevesClasse.filter((e) => e.actif) as eleve (eleve.id)}
								<Table.Row>
									<Table.Cell>
										<div class="font-medium">{eleve.nom} {eleve.prenom}</div>
										<div class="text-xs text-muted-foreground">
											{eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString() : '—'}
										</div>
									</Table.Cell>
									<Table.Cell class="text-center">
										<Input
											type="number"
											min="0"
											max="20"
											step="0.25"
											class="h-8 w-16 px-2 text-sm"
											value={getNoteExistante(eleve.id) ?? notesTemp[eleve.id] ?? ''}
											oninput={(e) => setNote(eleve.id, parseFloat(e.currentTarget.value) || 0)}
											placeholder="0"
										/>
									</Table.Cell>
									<Table.Cell class="text-center">
										<Lock class="mx-auto size-4 text-muted-foreground" />
										<span class="text-xs text-muted-foreground">Verrouillé</span>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</div>
		</CardUI>
	{/if}
</div>