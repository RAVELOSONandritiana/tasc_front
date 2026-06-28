<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { Plus, Printer, School } from '@lucide/svelte/icons';
	import type { EleveCours, Note, Examen, Cours } from '$lib/types/Materiel.type';

	let listeCours = $state<Cours[]>([
		{ id: '1', nom: 'Mathématiques', coefficient: 6, professeur: 'RANDRIANANTENAINA Tsitoarimanjakely' },
		{ id: '2', nom: 'Physique', coefficient: 4, professeur: 'ANDRIANTENAINA Bako' },
		{ id: '3', nom: 'Français', coefficient: 5, professeur: 'RAKOTO Fanomezamasy' }
	]);

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
			notes: [
				{ id: 'n1', valeur: 14, coefficient: 6, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '1', examenId: 'e1' },
				{ id: 'n2', valeur: 12, coefficient: 4, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '2', examenId: 'e1' },
				{ id: 'n3', valeur: 16, coefficient: 5, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '3', examenId: 'e1' }
			]
		},
		{
			id: '2',
			nom: 'RAKOTO',
			prenom: 'Fanomezamasy',
			dateNaissance: '2008-03-22',
			actif: true,
			notes: [
				{ id: 'n4', valeur: 16, coefficient: 6, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '1', examenId: 'e1' },
				{ id: 'n5', valeur: 14, coefficient: 4, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '2', examenId: 'e1' },
				{ id: 'n6', valeur: 11, coefficient: 5, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '3', examenId: 'e1' }
			]
		},
		{
			id: '3',
			nom: 'ANDRIANTENAINA',
			prenom: 'Bako',
			dateNaissance: '2008-07-10',
			actif: true,
			notes: [
				{ id: 'n7', valeur: 11, coefficient: 6, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '1', examenId: 'e1' },
				{ id: 'n8', valeur: 9, coefficient: 4, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '2', examenId: 'e1' },
				{ id: 'n9', valeur: 13, coefficient: 5, date: '2026-02-15', libelle: 'Examen mi-semestre', coursId: '3', examenId: 'e1' }
			]
		}
	]);

	let nouvelExamen = $state({
		nom: '',
		date: '',
		periode: ''
	});

	let bulletinEleve = $state<EleveCours | null>(null);
	let bulletinExamenIds = $state<string[]>([]);
	let bulletinTousEleves = $state(false);
	let examensActifs = $state<string[]>(['e1']);
	let examenDialogOpen = $state(false);

	const notesBulletin = $derived(getNotesEleveExamens(bulletinEleve, bulletinExamenIds));

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
		examenDialogOpen = false;
	}

	function toggleExamen(examenId: string) {
		if (examensActifs.includes(examenId)) {
			examensActifs = examensActifs.filter((id) => id !== examenId);
		} else {
			examensActifs = [...examensActifs, examenId];
		}
	}

	function getExamen(examenId: string): Examen | undefined {
		return listeExamens.find((e) => e.id === examenId);
	}

	function getCoefficientCours(coursId: string): number {
		return listeCours.find((c) => c.id === coursId)?.coefficient ?? 0;
	}

	function getNoteCoefficient(note: Note): number {
		return note.coefficient || getCoefficientCours(note.coursId);
	}

	function formatNombre(valeur: number): string {
		return Number.isInteger(valeur) ? valeur.toString() : valeur.toFixed(2);
	}

	function getNotesEleveExamens(e: EleveCours | null, examenIds: string[]): Note[] {
		if (!e || examenIds.length === 0) return [];
		return e.notes?.filter((n) => n.examenId && examenIds.includes(n.examenId)) || [];
	}

	function getNotesMatiere(eleve: EleveCours, coursId: string, examenIds: string[]): Note[] {
		return getNotesEleveExamens(eleve, examenIds).filter((n) => n.coursId === coursId);
	}

	function calculerMoyenneMatiere(notes: Note[]): number {
		if (notes.length === 0) return 0;
		const totalPoints = notes.reduce((sum, n) => sum + n.valeur * getNoteCoefficient(n), 0);
		const totalCoef = notes.reduce((sum, n) => sum + getNoteCoefficient(n), 0);
		return totalCoef > 0 ? Math.round((totalPoints / totalCoef) * 100) / 100 : 0;
	}

	function calculerMoyenneNotes(notes: Note[]): number {
		if (notes.length === 0) return 0;
		const totalPoints = notes.reduce((sum, n) => sum + n.valeur * getNoteCoefficient(n), 0);
		const totalCoef = notes.reduce((sum, n) => sum + getNoteCoefficient(n), 0);
		return totalCoef > 0 ? Math.round((totalPoints / totalCoef) * 100) / 100 : 0;
	}

	function calculerMoyenneGenerale(eleve: EleveCours, examenIds: string[]): number {
		return calculerMoyenneNotes(getNotesEleveExamens(eleve, examenIds));
	}

	function calculerRang(eleveId: string, examenIds: string[]): number {
		if (examenIds.length === 0) return 0;
		const notes = elevesClasse.map((e) => ({
			id: e.id,
			moy: calculerMoyenneGenerale(e, examenIds)
		})).sort((a, b) => b.moy - a.moy);
		return notes.findIndex((n) => n.id === eleveId) + 1;
	}

	function getNomExamens(examenIds: string[]): string {
		const noms = examenIds.map((id) => getExamen(id)?.nom).filter((nom): nom is string => Boolean(nom));
		return noms.length > 0 ? noms.join(', ') : '—';
	}

	function ouvrirBulletin(e: EleveCours) {
		if (examensActifs.length === 0) return;
		bulletinTousEleves = false;
		bulletinEleve = e;
		bulletinExamenIds = [...examensActifs];
	}

	function ouvrirTousBulletins() {
		bulletinTousEleves = true;
		bulletinEleve = null;
		bulletinExamenIds = [...examensActifs];
	}

	function retourListe() {
		bulletinTousEleves = false;
		bulletinEleve = null;
		bulletinExamenIds = [];
	}

	function imprimerBulletin() {
		window.print();
	}
</script>

{#snippet BulletinPrint({ eleve })}
	<div class="max-w-3xl mx-auto">
		<div class="mb-6 border-b pb-4">
			<div class="flex items-center gap-3 mb-4">
				<School class="size-8" />
				<h1 class="text-2xl font-bold">LYCÉE TASC - BULLETIN SCOLAIRE</h1>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<p><span class="font-semibold">Élève:</span> {eleve.prenom} {eleve.nom}</p>
					<p><span class="font-semibold">Né(e):</span> {eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString() : '—'}</p>
					<p><span class="font-semibold">Classe:</span> 1ère L</p>
					<p><span class="font-semibold">Examens inclus:</span> {getNomExamens(bulletinExamenIds)}</p>
				</div>
				<div class="text-right">
					<p class="text-sm">Année scolaire: 2025-2026</p>
				</div>
			</div>
		</div>

		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Matière</Table.Head>
					<Table.Head class="text-center">Moyenne /20</Table.Head>
					<Table.Head class="text-center">Coefficient</Table.Head>
					<Table.Head class="text-center">Total</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each listeCours as cours (cours.id)}
					{@const notesMatiere = getNotesMatiere(eleve, cours.id, bulletinExamenIds)}
					{@const moyenneMatiere = calculerMoyenneMatiere(notesMatiere)}
					{@const pointsMatiere = notesMatiere.length > 0 ? moyenneMatiere * cours.coefficient : undefined}
					<Table.Row>
						<Table.Cell>{cours.nom}</Table.Cell>
						<Table.Cell class="text-center">
							{notesMatiere.length > 0 ? formatNombre(moyenneMatiere) : '—'}
						</Table.Cell>
						<Table.Cell class="text-center">{cours.coefficient}</Table.Cell>
						<Table.Cell class="text-center">
							{pointsMatiere === undefined ? '—' : formatNombre(pointsMatiere)}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		<div class="mt-6 rounded-md border bg-sidebar-accent/20 p-4">
			<div class="flex justify-between">
				<span class="font-semibold">Moyenne générale:</span>
				<span class="font-bold text-lg">{formatNombre(calculerMoyenneGenerale(eleve, bulletinExamenIds))}</span>
			</div>
			<div class="flex justify-between mt-2">
				<span class="font-semibold">Rang:</span>
				<span class="font-bold">{calculerRang(eleve.id, bulletinExamenIds)}</span>
			</div>
		</div>

		<div class="mt-8 grid grid-cols-2 gap-8">
			<div class="rounded-md border p-4">
				<p class="mb-12 text-sm font-medium">Signature élève</p>
				<p class="text-xs text-muted-foreground">Lu et approuvé</p>
			</div>
			<div class="rounded-md border p-4">
				<p class="mb-12 text-sm font-medium">Signature administrateur</p>
				<p class="text-xs text-muted-foreground">Cachet et signature</p>
			</div>
		</div>
	</div>
{/snippet}

{#if bulletinTousEleves}
	<div class="print-section bg-background p-8">
		{#each elevesClasse.filter((e) => e.actif) as eleve (eleve.id)}
			<div class="print-page">
				{@render BulletinPrint({ eleve })}
			</div>
		{/each}
		<div class="mt-6 flex gap-2">
			<Button variant="outline" onclick={retourListe}>Retour</Button>
			<Button onclick={imprimerBulletin}>Imprimer tous les bulletins</Button>
		</div>
	</div>
{:else if !bulletinEleve}
	<div class="min-h-full bg-sidebar p-4 text-sidebar-foreground">
		<div class="mb-6 flex items-center justify-between gap-4">
			<h1 class="text-2xl font-bold">Bulletins de la classe</h1>
			<div class="flex items-center gap-2">
				<Dialog.Root bind:open={examenDialogOpen}>
					<Dialog.Trigger class={buttonVariants({ variant: 'default' })}>
						<Plus class="mr-1 size-4" />
						Nouvel examen
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Créer un examen global</Dialog.Title>
						<Dialog.Description>
							Toutes les matières pourront saisir les notes pour cet examen
						</Dialog.Description>
					</Dialog.Header>
					<div class="grid gap-4 py-4">
						<div class="grid gap-2">
							<Label for="examen_nom">Nom de l'examen *</Label>
							<Input
								id="examen_nom"
								bind:value={nouvelExamen.nom}
								placeholder="Examen de mi-semestre"
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
							<Label for="examen_periode">Période</Label>
							<Input
								id="examen_periode"
								bind:value={nouvelExamen.periode}
								placeholder="Semestre 1"
							/>
						</div>
					</div>
					<Dialog.Footer>
						<Button variant="outline" size="sm" onclick={() => examenDialogOpen = false}>
							Annuler
						</Button>
						<Button variant="default" size="sm" onclick={ajouterExamen}>
							Créer
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
			<Button
				variant="outline"
				onclick={ouvrirTousBulletins}
			>
				<Printer class="mr-1 size-4" />
				Imprimer tous les bulletins
			</Button>
			</div>
		</div>

		{#if listeExamens.length > 0}
			<div class="mb-6 rounded-md border p-4">
				<div class="mb-4 flex items-center justify-between gap-4">
					<div>
						<h2 class="font-semibold">Examens disponibles</h2>
						<p class="text-sm text-muted-foreground">
							Activez les examens à inclure dans le bulletin
						</p>
					</div>
					<span class="rounded-md bg-sidebar-accent/50 px-3 py-1 text-sm">
						{examensActifs.length}/{listeExamens.length} actifs
					</span>
				</div>
				<div class="flex flex-wrap gap-2">
					{#each listeExamens as examen (examen.id)}
						{@const actif = examensActifs.includes(examen.id)}
						<button
							type="button"
							onclick={() => toggleExamen(examen.id)}
							class="rounded-md px-3 py-2 text-sm {actif ? 'bg-primary text-primary-foreground' : 'bg-sidebar-accent/30 text-sidebar-foreground'}"
						>
							<span>{examen.nom} ({examen.date})</span>
							<span class="ml-2 text-xs opacity-80">{actif ? 'Actif' : 'Inactif'}</span>
						</button>
					{/each}
				</div>
			</div>
		{:else}
			<div class="mb-6 rounded-md border p-8 text-center text-muted-foreground">
				Aucun examen créé
			</div>
		{/if}

		{#if examensActifs.length > 0}
			<div class="mb-6 rounded-md border bg-background/50 p-4">
				<div class="overflow-x-auto">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Élève</Table.Head>
								{#each listeCours as cours (cours.id)}
									<Table.Head class="min-w-40 text-center">
										<div>{cours.nom}</div>
										<div class="text-xs text-muted-foreground">Examens actifs × {cours.coefficient}</div>
									</Table.Head>
								{/each}
								<Table.Head class="text-center">Moyenne</Table.Head>
								<Table.Head class="text-center">Rang</Table.Head>
								<Table.Head class="w-20"></Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each elevesClasse.filter((e) => e.actif) as eleve (eleve.id)}
								<Table.Row>
									<Table.Cell>
										<div class="font-medium">{eleve.nom} {eleve.prenom}</div>
										<div class="text-xs text-muted-foreground">
											Né(e) : {eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString() : '—'}
										</div>
									</Table.Cell>
									{#each listeCours as cours (cours.id)}
										{@const notesMatiere = getNotesMatiere(eleve, cours.id, examensActifs)}
										{@const moyenneMatiere = calculerMoyenneMatiere(notesMatiere)}
										{@const pointsMatiere = notesMatiere.length > 0 ? moyenneMatiere * getCoefficientCours(cours.id) : undefined}
										<Table.Cell class="text-center">
											{#if notesMatiere.length === 0}
												<span class="text-muted-foreground">—</span>
											{:else}
												<div class="font-medium">{formatNombre(moyenneMatiere)}/20</div>
												<div class="text-xs text-muted-foreground">{formatNombre(pointsMatiere ?? 0)} pts</div>
											{/if}
										</Table.Cell>
									{/each}
									<Table.Cell class="text-center font-medium">
										{formatNombre(calculerMoyenneGenerale(eleve, examensActifs))}
									</Table.Cell>
									<Table.Cell class="text-center">
										{calculerRang(eleve.id, examensActifs)}/{elevesClasse.filter(e => e.actif).length}
									</Table.Cell>
									<Table.Cell>
										<Button size="sm" variant="ghost" onclick={() => ouvrirBulletin(eleve)}>
											<Printer class="size-4" />
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</div>
		{:else}
			<div class="rounded-md border p-8 text-center text-muted-foreground">
				Aucun examen actif
			</div>
		{/if}
	</div>
{:else}
	<div class="print-section bg-background p-8">
		<div class="max-w-3xl mx-auto">
			<div class="mb-6 border-b pb-4">
				<div class="flex items-center gap-3 mb-4">
					<School class="size-8" />
					<h1 class="text-2xl font-bold">LYCÉE TASC - BULLETIN SCOLAIRE</h1>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<p><span class="font-semibold">Élève:</span> {bulletinEleve.prenom} {bulletinEleve.nom}</p>
						<p><span class="font-semibold">Né(e):</span> {bulletinEleve.dateNaissance ? new Date(bulletinEleve.dateNaissance).toLocaleDateString() : '—'}</p>
						<p><span class="font-semibold">Classe:</span> 1ère L</p>
						<p><span class="font-semibold">Examens inclus:</span> {getNomExamens(bulletinExamenIds)}</p>
					</div>
					<div class="text-right">
						<p class="text-sm">Année scolaire: 2025-2026</p>
					</div>
				</div>
			</div>

			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Matière</Table.Head>
						<Table.Head class="text-center">Moyenne /20</Table.Head>
						<Table.Head class="text-center">Coefficient</Table.Head>
						<Table.Head class="text-center">Total</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each listeCours as cours (cours.id)}
						{@const notesMatiere = notesBulletin.filter((n) => n.coursId === cours.id)}
						{@const moyenneMatiere = calculerMoyenneMatiere(notesMatiere)}
						{@const pointsMatiere = notesMatiere.length > 0 ? moyenneMatiere * cours.coefficient : undefined}
						<Table.Row>
							<Table.Cell>{cours.nom}</Table.Cell>
							<Table.Cell class="text-center">
								{notesMatiere.length > 0 ? formatNombre(moyenneMatiere) : '—'}
							</Table.Cell>
							<Table.Cell class="text-center">{cours.coefficient}</Table.Cell>
							<Table.Cell class="text-center">
								{pointsMatiere === undefined ? '—' : formatNombre(pointsMatiere)}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>

			<div class="mt-6 rounded-md border bg-sidebar-accent/20 p-4">
				<div class="flex justify-between">
					<span class="font-semibold">Moyenne générale:</span>
					<span class="font-bold text-lg">{formatNombre(calculerMoyenneNotes(notesBulletin))}</span>
				</div>
				<div class="flex justify-between mt-2">
					<span class="font-semibold">Rang:</span>
					<span class="font-bold">{bulletinEleve ? calculerRang(bulletinEleve.id, bulletinExamenIds) : '-'}</span>
				</div>
			</div>

			<div class="mt-8 grid grid-cols-2 gap-8">
				<div class="rounded-md border p-4">
					<p class="mb-12 text-sm font-medium">Signature élève</p>
					<p class="text-xs text-muted-foreground">Lu et approuvé</p>
				</div>
				<div class="rounded-md border p-4">
					<p class="mb-12 text-sm font-medium">Signature administrateur</p>
					<p class="text-xs text-muted-foreground">Cachet et signature</p>
				</div>
			</div>

			<div class="mt-6 flex gap-2">
				<Button variant="outline" onclick={retourListe}>
					Retour
				</Button>
				<Button onclick={imprimerBulletin}>Imprimer</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.print-page {
		page-break-after: always;
	}

	.print-page:last-child {
		page-break-after: auto;
	}

	@media print {
		.print-page {
			break-after: page;
		}

		.print-page:last-child {
			break-after: auto;
		}

		.print-section {
			padding: 20px !important;
			background: white !important;
			color: black !important;
		}

		.print-section button {
			display: none !important;
		}
	}
</style>
