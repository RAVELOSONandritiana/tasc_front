<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { Plus, Printer, School } from '@lucide/svelte/icons';
	import type { EleveCours, Note, Examen, Cours } from '$lib/types/Materiel.type';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let listeCours = $state<Cours[]>([...data.listeCours]);
	let listeExamens = $state<Examen[]>([...data.listeExamens]);
	let elevesClasse = $state<EleveCours[]>([...data.elevesClasse]);

	let nouvelExamen = $state({
		nom: '',
		date: '',
		periode: ''
	});

	let bulletinEleve = $state<EleveCours | null>(null);
	let bulletinExamenIds = $state<string[]>([]);
	let bulletinTousEleves = $state(false);
	let examensActifs = $state<string[]>(data.listeExamens.map((e) => e.id));
	let examenDialogOpen = $state(false);

	const notesBulletin = $derived(getNotesEleveExamens(bulletinEleve, bulletinExamenIds));

	function ajouterExamen() {
		if (!nouvelExamen.nom || !nouvelExamen.date) return;
		const examen: Examen = {
			id: Date.now().toString(),
			nom: nouvelExamen.nom,
			date: nouvelExamen.date,
			classeId: data.classe?.id || '',
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

	// Update list local data if data properties change
	$effect(() => {
		listeCours = [...data.listeCours];
		listeExamens = [...data.listeExamens];
		elevesClasse = [...data.elevesClasse];
	});

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

{#if !bulletinEleve && !bulletinTousEleves}
	<div class="flex flex-col bg-sidebar text-sidebar-foreground min-h-full p-6 space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Bulletins de notes</h1>
				<p class="text-sm text-muted-foreground">Sélectionnez les examens pour calculer les moyennes de la classe.</p>
			</div>
			{#if listeExamens.length > 0}
				<Button onclick={ouvrirTousBulletins} class="gap-2" variant="default" disabled={examensActifs.length === 0}>
					<Printer class="size-4" />
					Imprimer tous les bulletins
				</Button>
			{/if}
		</div>

		<!-- EXAM SELECTION CARD -->
		<div class="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm">
			<h2 class="mb-4 font-semibold flex items-center gap-2 text-foreground">
				<School class="size-4 text-primary" />
				Examens à inclure
			</h2>
			{#if listeExamens.length === 0}
				<p class="text-sm text-muted-foreground italic">Aucun examen n'a encore été créé pour cette classe.</p>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
					{#each listeExamens as examen (examen.id)}
						<label class="flex items-center gap-3 rounded-lg border border-sidebar-border p-3 cursor-pointer hover:bg-muted/30 transition duration-200">
							<input
								type="checkbox"
								checked={examensActifs.includes(examen.id)}
								onchange={() => toggleExamen(examen.id)}
								class="rounded border-sidebar-border text-primary focus:ring-primary size-4"
							/>
							<div class="flex flex-col">
								<span class="text-sm font-medium text-foreground">{examen.nom}</span>
								<span class="text-xs text-muted-foreground">{examen.date} {examen.periode ? `(${examen.periode})` : ''}</span>
							</div>
						</label>
					{/each}
				</div>
			{/if}
		</div>

		<!-- STUDENTS LIST TABLE -->
		<div class="rounded-xl border border-sidebar-border bg-card shadow-sm overflow-hidden">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Élève</Table.Head>
						<Table.Head class="text-center">Moyenne Générale</Table.Head>
						<Table.Head class="text-center">Rang</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each elevesClasse as eleve (eleve.id)}
						{@const moyenne = calculerMoyenneGenerale(eleve, examensActifs)}
						{@const rang = calculerRang(eleve.id, examensActifs)}
						<Table.Row class="hover:bg-muted/20">
							<Table.Cell>
								<div class="font-semibold text-foreground">{eleve.nom} {eleve.prenom}</div>
								<div class="text-xs text-muted-foreground">
									{#if eleve.dateNaissance}
										Né(e) le {new Date(eleve.dateNaissance).toLocaleDateString('fr-FR')}
									{:else}
										—
									{/if}
								</div>
							</Table.Cell>
							<Table.Cell class="text-center font-bold text-base">
								{moyenne > 0 ? `${formatNombre(moyenne)}/20` : '—'}
							</Table.Cell>
							<Table.Cell class="text-center">
								{#if rang > 0 && moyenne > 0}
									<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
										{rang}<sup>{rang === 1 ? 'er' : 'e'}</sup>
									</span>
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-right">
								<Button size="sm" variant="outline" disabled={examensActifs.length === 0} onclick={() => ouvrirBulletin(eleve)}>
									Voir bulletin
								</Button>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={4} class="text-center py-8 text-muted-foreground">
								Aucun élève dans cette classe.
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</div>
{:else}
	<div class="p-6 max-w-4xl mx-auto space-y-6 print:p-0 print:m-0 print:max-w-none">
		<div class="flex justify-between items-center print:hidden border-b pb-4 mb-4">
			<Button variant="outline" onclick={retourListe}>Retour à la liste</Button>
			<Button onclick={imprimerBulletin} class="gap-2" variant="default">
				<Printer class="size-4" />
				Imprimer
			</Button>
		</div>

		{#if bulletinEleve}
			{@render singleBulletin(bulletinEleve)}
		{:else if bulletinTousEleves}
			<div class="space-y-12 print:space-y-0">
				{#each elevesClasse as eleve}
					<div class="print:break-after-page mb-12">
						{@render singleBulletin(eleve)}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

{#snippet singleBulletin(eleve: EleveCours)}
	{@const moyenneG = calculerMoyenneGenerale(eleve, bulletinExamenIds)}
	{@const rangG = calculerRang(eleve.id, bulletinExamenIds)}
	<div class="bg-white text-black p-8 rounded-xl border border-gray-300 shadow-md print:border-0 print:shadow-none print:p-0 print:bg-transparent">
		<!-- School Header -->
		<div class="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
			<div>
				<h2 class="text-xl font-bold tracking-tight uppercase">Tasc School Manager</h2>
				<p class="text-xs text-gray-600">Année Scolaire : {data.classe?.anneeScolaire?.nom || 'Active'}</p>
			</div>
			<div class="text-right">
				<h1 class="text-2xl font-black uppercase text-gray-800">Bulletin de notes</h1>
				<p class="text-sm font-semibold">{getNomExamens(bulletinExamenIds)}</p>
			</div>
		</div>

		<!-- Student Info -->
		<div class="grid grid-cols-2 gap-4 mb-6 text-sm">
			<div>
				<p><span class="font-bold text-gray-700">Nom & Prénom :</span> {eleve.nom} {eleve.prenom}</p>
				<p>
					<span class="font-bold text-gray-700">Date de naissance :</span> 
					{#if eleve.dateNaissance}
						{new Date(eleve.dateNaissance).toLocaleDateString('fr-FR')}
					{:else}
						—
					{/if}
				</p>
			</div>
			<div class="text-right">
				<p><span class="font-bold text-gray-700">Classe :</span> {data.classe?.nom || ''}</p>
				<p><span class="font-bold text-gray-700">Professeur Principal :</span> {data.classe?.titulaire ? `${data.classe.titulaire.personne.name} ${data.classe.titulaire.personne.lastname}` : '—'}</p>
			</div>
		</div>

		<!-- Grades Table -->
		<table class="w-full border-collapse border border-gray-800 text-sm mb-6">
			<thead>
				<tr class="bg-gray-100 border-b border-gray-800">
					<th class="border border-gray-800 px-4 py-2 text-left">Matière</th>
					<th class="border border-gray-800 px-4 py-2 text-center w-24">Coefficient</th>
					<th class="border border-gray-800 px-4 py-2 text-center w-40">Notes</th>
					<th class="border border-gray-800 px-4 py-2 text-center w-32">Moyenne / 20</th>
					<th class="border border-gray-800 px-4 py-2 text-left">Enseignant & Appréciations</th>
				</tr>
			</thead>
			<tbody>
				{#each listeCours as cours}
					{@const notesM = getNotesMatiere(eleve, cours.id, bulletinExamenIds)}
					{@const moyM = calculerMoyenneMatiere(notesM)}
					<tr class="border-b border-gray-800">
						<td class="border border-gray-800 px-4 py-2.5 font-semibold">{cours.nom}</td>
						<td class="border border-gray-800 px-4 py-2.5 text-center">{cours.coefficient}</td>
						<td class="border border-gray-800 px-4 py-2.5 text-center text-xs">
							{#each notesM as note}
								<span class="inline-block bg-gray-100 rounded px-1.5 py-0.5 m-0.5 border border-gray-300 font-mono">
									{note.valeur}/20
								</span>
							{:else}
								<span class="text-gray-400 italic">aucune</span>
							{/each}
						</td>
						<td class="border border-gray-800 px-4 py-2.5 text-center font-bold">
							{notesM.length > 0 ? formatNombre(moyM) : '—'}
						</td>
						<td class="border border-gray-800 px-4 py-2.5 text-xs text-gray-700 font-sans">
							<span class="font-medium text-black block">{cours.professeur || '—'}</span>
							{#if notesM.length > 0}
								{#if moyM >= 16} Excellent travail.
								{:else if moyM >= 14} Très bon travail.
								{:else if moyM >= 12} Bon travail.
								{:else if moyM >= 10} Travail satisfaisant.
								{:else} Travail insuffisant, doit progresser.
								{/if}
							{:else}
								Pas d'évaluation.
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<!-- Summary & Signatures -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-sm">
			<!-- Summary Results -->
			<div class="border border-gray-800 rounded-lg p-4 bg-gray-50 grid grid-cols-2 gap-2">
				<div class="font-bold text-gray-700">Moyenne Générale :</div>
				<div class="font-bold text-base text-right">{moyenneG > 0 ? `${formatNombre(moyenneG)} / 20` : '—'}</div>
				
				<div class="font-bold text-gray-700">Rang :</div>
				<div class="font-bold text-base text-right">
					{#if rangG > 0 && moyenneG > 0}
						{rangG} {rangG === 1 ? 'er' : 'e'} sur {elevesClasse.length}
					{:else}
						—
					{/if}
				</div>

				<div class="font-bold text-gray-700">Décision du conseil :</div>
				<div class="font-semibold text-right">
					{#if moyenneG >= 10} Admis(e)
					{:else if moyenneG > 0} Ajourné(e)
					{:else} —
					{/if}
				</div>
			</div>

			<!-- Signatures -->
			<div class="grid grid-cols-2 gap-4 text-center mt-4 md:mt-0">
				<div>
					<p class="font-bold underline text-gray-700">Le Professeur Principal</p>
					<div class="h-16"></div>
				</div>
				<div>
					<p class="font-bold underline text-gray-700">Le Chef d'Établissement</p>
					<div class="h-16"></div>
				</div>
			</div>
		</div>
	</div>
{/snippet}

<style>
	@media print {
		:global(body) {
			background: white !important;
			color: black !important;
		}
		:global(header) {
			display: none !important;
		}
		.print\:break-after-page {
			break-after: page;
		}
	}
</style>