<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Download, Calendar, Plus } from '@lucide/svelte/icons';
	import type { EleveCours, Note, Examen, Cours } from '$lib/types/Materiel.type';

	// Données simulées avec notes d'examens
	let elevesClasse = $state<EleveCours[]>([
		{
			id: '1',
			nom: 'RANDRIANANTENAINA',
			prenom: 'Tsitoarimanjakely',
			dateNaissance: '2008-05-15',
			actif: true,
			notes: [
				{ id: 'n1', valeur: 15, coefficient: 2, date: '2026-01-10', libelle: 'Interrogation 1', coursId: '1' },
				{ id: 'n2', valeur: 12, coefficient: 4, date: '2026-01-25', libelle: 'Devoir 1', coursId: '1' },
				{ id: 'ne1', valeur: 14, coefficient: 4, date: '2026-02-15', libelle: 'Examen 1', coursId: '1', examenId: 'e1' }
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
				{ id: 'n4', valeur: 14, coefficient: 4, date: '2026-01-25', libelle: 'Devoir 1', coursId: '1' },
				{ id: 'ne2', valeur: 16, coefficient: 4, date: '2026-02-15', libelle: 'Examen 1', coursId: '1', examenId: 'e1' }
			]
		},
		{
			id: '3',
			nom: 'ANDRIANTENAINA',
			prenom: 'Bako',
			dateNaissance: '2008-07-10',
			actif: true,
			notes: [
				{ id: 'ne3', valeur: 11, coefficient: 4, date: '2026-02-15', libelle: 'Examen 1', coursId: '1', examenId: 'e1' }
			]
		}
	]);

	let listeCours = $state<Cours[]>([
		{
			id: '1',
			nom: 'Mathématiques',
			coefficient: 6,
			professeur: 'RANDRIANANTENAINA Tsitoarimanjakely',
			examens: [
				{ id: 'e1', nom: 'Examen 1', date: '2026-02-15', coursId: '1', coefficient: 4 },
				{ id: 'e2', nom: 'Examen 2', date: '2026-03-20', coursId: '1', coefficient: 6 }
			]
		},
		{
			id: '2',
			nom: 'Physique',
			coefficient: 4,
			professeur: 'RAKOTONDRA Mananjara',
			examens: [{ id: 'e3', nom: 'Examen Final', date: '2026-03-10', coursId: '2', coefficient: 6 }]
		},
		{
			id: '3',
			nom: 'Français',
			coefficient: 5,
			professeur: 'RANDRIAHARINIAINA Haja',
			examens: [
				{ id: 'e4', nom: 'Composition', date: '2026-02-28', coursId: '3', coefficient: 8 }
			]
		}
	]);

	let examensSelectionnes = $state<string[]>([]);

	function toggleSelectionExamen(examenId: string) {
		const idx = examensSelectionnes.indexOf(examenId);
		if (idx >= 0) {
			examensSelectionnes = examensSelectionnes.filter((id) => id !== examenId);
		} else {
			examensSelectionnes = [...examensSelectionnes, examenId];
		}
	}

	function calculerMoyenneMatiere(eleve: EleveCours, coursId: string): number {
		const notesCours = eleve.notes?.filter((n) => n.coursId === coursId) || [];
		if (notesCours.length === 0) return 0;
		const total = notesCours.reduce((sum, n) => sum + n.valeur * n.coefficient, 0);
		const coef = notesCours.reduce((sum, n) => sum + n.coefficient, 0);
		return coef > 0 ? Math.round((total / coef) * 100) / 100 : 0;
	}

	function calculerMoyenneGenerale(eleve: EleveCours): number {
		if (!eleve.notes || eleve.notes.length === 0) return 0;
		let totalPoints = 0;
		let totalCoef = 0;

		listeCours.forEach((cours) => {
			const notes = eleve.notes?.filter((n) => n.coursId === cours.id) || [];
			const points = notes.reduce((sum, n) => sum + n.valeur * n.coefficient, 0);
			const coef = notes.reduce((sum, n) => sum + n.coefficient, 0);
			totalPoints += points;
			totalCoef += coef;
		});

		return totalCoef > 0 ? Math.round((totalPoints / totalCoef) * 100) / 100 : 0;
	}

	// Tous les examens de la classe
	let tousExamens = $derived<Examen[]>([]);
	$effect(() => {
		tousExamens = [];
		listeCours.forEach((cours) => {
			if (cours.examens) {
				tousExamens.push(...cours.examens);
			}
		});
	});

	function noterExamen(examenId: string, eleveId: string, valeur: number) {
		const eleve = elevesClasse.find((e) => e.id === eleveId);
		if (!eleve) return;
		
		const noteExistante = eleve.notes?.find((n) => n.examenId === examenId);
		if (noteExistante) {
			noteExistante.valeur = valeur;
		} else {
			const examen = trouverExamen(examenId);
			if (examen) {
				const nouvelleNote: Note = {
					id: Date.now().toString(),
					valeur,
					coefficient: examen.coefficient,
					date: examen.date,
					libelle: examen.nom,
					coursId: examen.coursId,
					examenId
				};
				eleve.notes = eleve.notes || [];
				eleve.notes = [...eleve.notes, nouvelleNote];
			}
		}
	}

	function trouverExamen(examenId: string): Examen | undefined {
		for (const cours of listeCours) {
			const examen = cours.examens?.find((e) => e.id === examenId);
			if (examen) return examen;
		}
		return undefined;
	}

	function telechargerPDF() {
		// TODO: Implémenter le téléchargement PDF
		alert('Fonctionnalité PDF à implémenter');
	}
</script>

<div class="min-h-full bg-sidebar p-4 text-sidebar-foreground">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Bulletins de la classe</h1>
		<Button variant="default" class="gap-2" onclick={telechargerPDF}>
			<Download class="size-4" />
			Télécharger PDF
		</Button>
	</div>

	<div class="mb-6 rounded-md border p-4">
		<h2 class="mb-4 font-semibold">Sélection des examens pour calcul</h2>
		<div class="flex flex-col gap-3">
			{#each listeCours as cours (cours.id)}
				<div class="border-t border-sidebar-border pt-3">
					<p class="mb-2 font-medium">{cours.nom}</p>
					<div class="flex flex-wrap gap-2">
						{#if cours.examens && cours.examens.length > 0}
							{#each cours.examens as examen (examen.id)}
								<label class="flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/30 px-3 py-1 text-sm">
									<Checkbox
										checked={examensSelectionnes.includes(examen.id)}
										onchange={() => toggleSelectionExamen(examen.id)}
									/>
									<span>{examen.nom} ({examen.date})</span>
								</label>
							{/each}
						{:else}
							<span class="text-xs italic text-muted-foreground">Aucun examen</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="overflow-x-auto rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Élève</Table.Head>
					{#each listeCours as cours (cours.id)}
						<Table.Head class="text-center">{cours.nom}</Table.Head>
					{/each}
					<Table.Head class="text-center">Moyenne générale</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each elevesClasse as eleve (eleve.id)}
					<Table.Row>
						<Table.Cell>
							<div class="font-medium">{eleve.nom} {eleve.prenom}</div>
							<div class="text-xs text-muted-foreground">
								{eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString() : '—'}
							</div>
						</Table.Cell>
						{#each listeCours as cours (cours.id)}
							<Table.Cell class="text-center">
								{calculerMoyenneMatiere(eleve, cours.id)}
							</Table.Cell>
						{/each}
						<Table.Cell class="text-center font-bold text-lg">
							{calculerMoyenneGenerale(eleve)}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>