<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Printer, School } from '@lucide/svelte/icons';
	import type { EleveCours, Note, Examen, Cours } from '$lib/types/Materiel.type';
	import type { PageProps } from './$types';
	import { formatClasseNom, formatExamenNom, formatAge } from '$lib/utils';
	import { SvelteSet } from 'svelte/reactivity';

	const { data }: PageProps = $props();

	let listeCours = $state<Cours[]>([...data.listeCours]);
	let listeExamens = $state<Examen[]>([...data.listeExamens]);
	let elevesClasse = $state<EleveCours[]>([...data.elevesClasse]);

	// Tri des bulletins : filles d'abord, puis garçons, par ordre alphabétique
	// (le numéro de classe est calculé indépendamment de l'ordre du tableau).
	let elevesTries = $derived(
		[...elevesClasse]
			.filter((e) => e.sexe === 'F')
			.sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'))
			.concat(
				[...elevesClasse]
					.filter((e) => e.sexe !== 'F')
					.sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'))
			)
	);

	let bulletinEleve = $state<EleveCours | null>(null);
	let bulletinTousEleves = $state(false);
	// Examens à inclure dans le bulletin (multi-sélection). Par défaut tous
	// les examens sont cochés (bulletin de fin d'année) ; en cours d'année on
	// peut ne sélectionner qu'un seul examen.
	let bulletinExamenSelection = $state<string[]>(data.listeExamens.map((e) => e.id));

	// Examens réellement pris en compte (dans l'ordre des examens de la classe).
	let examensSelectionnes = $derived(
		listeExamens.filter((e) => bulletinExamenSelection.includes(e.id))
	);
	let selectionIds = $derived(examensSelectionnes.map((e) => e.id));
	// Bulletin « périodique » (un seul examen) vs bulletin cumulatif (plusieurs
	// examens : fin d'année ou fin de semestre).
	let modeCumule = $derived(examensSelectionnes.length > 1);
	let toutSelectionne = $derived(
		listeExamens.length > 0 && examensSelectionnes.length === listeExamens.length
	);
	// Libellés de la colonne récapitulative : « annuel » uniquement lorsque
	// tous les examens de l'année sont inclus.
	let labelMoyenneCumulee = $derived(toutSelectionne ? 'MOYENNE ANNUELLE' : 'MOYENNE GENERALE');
	let labelRangCumule = $derived(toutSelectionne ? 'RANG ANNUEL' : 'RANG GENERAL');

	let anneeScolaireValue = $state<string>(data.classe?.anneeScolaire?.nom || '');
	let titreBulletinValue = $state<string>("BULLETIN FIN D'ANNEE");
	// Tant que l'utilisateur n'a pas saisi son propre titre, celui-ci suit la
	// sélection d'examens (bulletin de période vs bulletin de fin d'année).
	let titrePersonnalise = $state(false);

	function titreParDefaut(): string {
		if (examensSelectionnes.length === 1) {
			const label = getExamenPeriodeLabel(examensSelectionnes[0]).trim();
			return label ? `BULLETIN ${label.toUpperCase()}` : 'BULLETIN DE NOTES';
		}
		if (toutSelectionne) return "BULLETIN FIN D'ANNEE";
		return 'BULLETIN DE NOTES';
	}

	function toggleExamen(id: string) {
		bulletinExamenSelection = bulletinExamenSelection.includes(id)
			? bulletinExamenSelection.filter((x) => x !== id)
			: [...bulletinExamenSelection, id];
	}

	function selectionnerTousExamens() {
		bulletinExamenSelection = listeExamens.map((e) => e.id);
	}

	function viderSelectionExamens() {
		bulletinExamenSelection = [];
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

	function getExamenPeriodeLabel(examen: Examen): string {
		return formatExamenNom(examen);
	}

	function normaliserPourFichier(valeur: string): string {
		return valeur
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/\s+/g, '_')
			.replace(/[^a-z0-9_]/g, '')
			.replace(/^_|_$/g, '');
	}

	function getBulletinFilename(forSingleEleve: boolean): string {
		const selected = listeExamens.filter((e) => bulletinExamenSelection.includes(e.id));
		const rawPeriode =
			selected.length === 1
				? getExamenPeriodeLabel(selected[0])
				: selected.length > 1 && selected.length === listeExamens.length
					? 'annuel'
					: 'bulletin';
		const periode = normaliserPourFichier(rawPeriode);
		const annee = normaliserPourFichier(anneeScolaireValue || '');

		if (forSingleEleve && bulletinEleve) {
			const nomComplet = normaliserPourFichier(`${bulletinEleve.nom} ${bulletinEleve.prenom}`);
			return `${nomComplet}_${annee}_${periode}.pdf`;
		}

		const classe = normaliserPourFichier(formatClasseNom(data.classe?.niveau, data.classe?.nom));
		return `${classe}_${annee}_${periode}.pdf`;
	}

	// Format décimal français (virgule)
	function formatFr(valeur: number): string {
		return formatNombre(valeur).replace('.', ',');
	}

	function getNotesEleveExamens(e: EleveCours | null, examenIds: string[]): Note[] {
		if (!e) return [];
		// Une note doit appartenir a un sous-examen pour etre prise en compte.
		const seen = new SvelteSet<string>();
		return (
			e.notes?.filter((n) => {
				if (!n.sousExamenId) return false;
				if (n.examenId && examenIds.length > 0 && !examenIds.includes(n.examenId)) {
					return false;
				}
				// Dedoublonnage par identifiant de note (un sous-examen = une note).
				if (seen.has(n.id)) return false;
				seen.add(n.id);
				return true;
			}) || []
		);
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

	function estParticipant(cours: Cours, eleve: EleveCours): boolean {
		const participants = cours.participants;
		if (!participants || participants.length === 0) return false;
		return participants.includes(eleve.id);
	}

	// Note d'une matiere sur les examens selectionnes : moyenne des moyennes
	// obtenues a chaque examen (un examen sans note n'est pas compte).
	function moyenneMatierePeriodes(eleve: EleveCours, coursId: string, examenIds: string[]): number {
		if (examenIds.length === 0) return 0;
		const vals: number[] = [];
		for (const examenId of examenIds) {
			const notes = getNotesMatiere(eleve, coursId, [examenId]);
			if (notes.length === 0) continue;
			vals.push(calculerMoyenneMatiere(notes));
		}
		if (vals.length === 0) return 0;
		return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
	}

	function calculerMoyenneGenerale(eleve: EleveCours, examenIds: string[]): number {
		if (listeCours.length === 0 || examenIds.length === 0) return 0;
		const totalCoef = listeCours.reduce((s, c) => {
			if (!estParticipant(c, eleve)) return s;
			return s + (c.coefficient || 0);
		}, 0);
		if (totalCoef === 0) return 0;
		const totalPoints = listeCours.reduce((s, c) => {
			if (!estParticipant(c, eleve)) return s;
			const moy = moyenneMatierePeriodes(eleve, c.id, examenIds);
			return s + moy * (c.coefficient || 0);
		}, 0);
		return Math.round((totalPoints / totalCoef) * 100) / 100;
	}

	function calculerRang(eleveId: string, examenIds: string[]): number {
		if (examenIds.length === 0) return 0;
		const tries = elevesClasse
			.map((e) => ({ id: e.id, moy: calculerMoyenneGenerale(e, examenIds) }))
			.sort((a, b) => b.moy - a.moy);
		let rank = 0;
		let prevMoy: number | null = null;
		for (let i = 0; i < tries.length; i++) {
			if (tries[i].moy !== prevMoy) {
				rank = i + 1;
				prevMoy = tries[i].moy;
			}
			if (tries[i].id === eleveId) return rank;
		}
		return 0;
	}

	// Échelle d'appréciation (barème malgache)
	function appreciationScale(m: number): string {
		if (m <= 0) return '';
		if (m >= 18) return 'Excellent';
		if (m >= 16) return 'Très-Bien';
		if (m >= 14) return 'Bien';
		if (m >= 12) return 'Assez-Bien';
		if (m >= 10) return 'Passable';
		if (m >= 6) return 'Faible';
		return 'Blâme';
	}

	// Appréciation de la matière = appréciation de la note moyenne
	function appreciationMatiere(moyenne: number): string {
		return appreciationScale(moyenne);
	}

	// Moyenne generale de la classe, calculee uniquement sur les examens
	// selectionnes (sur les eleves ayant une moyenne > 0).
	function moyenneClasse(examenIds: string[]): number {
		if (examenIds.length === 0) return 0;
		const vals = elevesClasse
			.map((e) => calculerMoyenneGenerale(e, examenIds))
			.filter((m) => m > 0);
		if (vals.length === 0) return 0;
		return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
	}

	// Moyenne de l'eleve sur les examens selectionnes (moyenne annuelle
	// lorsque tous les examens de l'annee sont coches).
	function moyenneSelection(eleve: EleveCours): number {
		return calculerMoyenneGenerale(eleve, selectionIds);
	}

	function rangSelection(eleveId: string): number {
		return calculerRang(eleveId, selectionIds);
	}

	function formatRang(rang: number): string {
		if (rang <= 0) return '—';
		return rang === 1 ? '1ᵉʳ' : `${rang}ᵉ`;
	}

	// Décision du conseil de classe, avec mention de la série attribuée pour les
	// élèves admis d'une classe ayant un niveau suivant (2nde → 1ère, 1ère → Tle).
	// Ex : « ADMISE EN PREMIER S ». La série est saisie manuellement en délibération.
	function formatDecisionAvecSerie(
		eleve: EleveCours,
		m: number,
		niveauClasse: number | undefined | null
	): string {
		if (m <= 0) return '—';
		const feminin = eleve.sexe === 'F';
		if (m < 10) return feminin ? 'AJOURNÉE' : 'AJOURNÉ';
		// Admis : on ajoute la série et le niveau suivant si pertinent.
		const niveauSuivant = niveauClasse === 0 ? 'PREMIER' : niveauClasse === 1 ? 'TERMINAL' : '';
		const base = feminin ? 'ADMISE' : 'ADMIS';
		if (eleve.serie && niveauSuivant) {
			return `${base} EN ${niveauSuivant} ${eleve.serie.toUpperCase()}`;
		}
		if (eleve.serie) return `${base} EN ${eleve.serie.toUpperCase()}`;
		return base;
	}

	// Numéro de classe : ordre alphabétique (A→Z) + suffixe F (Fille) / G (Garçon)
	function numeroClasse(eleve: EleveCours): string {
		const ordre =
			[...elevesClasse]
				.filter((e) => e.sexe === eleve.sexe)
				.sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'))
				.findIndex((e) => e.id === eleve.id) + 1;
		const suffix = eleve.sexe === 'F' ? 'F' : 'G';
		return `${ordre}${suffix}`;
	}

	// Update list local data if data properties change
	let dernierEnsembleExamens = '';
	$effect(() => {
		listeCours = [...data.listeCours];
		listeExamens = [...data.listeExamens];
		elevesClasse = [...data.elevesClasse];
		// Si la liste d'examens change (nouvelle classe, examen ajouté), on
		// repart d'une sélection complète.
		const cle = data.listeExamens.map((e) => e.id).join('|');
		if (cle !== dernierEnsembleExamens) {
			dernierEnsembleExamens = cle;
			bulletinExamenSelection = data.listeExamens.map((e) => e.id);
		}
	});

	// Le titre suit la sélection d'examens tant qu'il n'a pas été personnalisé.
	$effect(() => {
		const titre = titreParDefaut();
		if (titrePersonnalise) return;
		titreBulletinValue = titre;
	});

	function ouvrirBulletin(e: EleveCours) {
		if (selectionIds.length === 0) return;
		bulletinTousEleves = false;
		bulletinEleve = e;
	}

	function ouvrirTousBulletins() {
		bulletinTousEleves = true;
		bulletinEleve = null;
	}

	function retourListe() {
		bulletinTousEleves = false;
		bulletinEleve = null;
	}

	function ajusterEchelleBulletins() {
		const pages = document.querySelectorAll<HTMLElement>('.bulletin-page');
		pages.forEach((page) => {
			const content = page.querySelector<HTMLElement>('.bulletin-content');
			if (!content) return;
			content.style.transform = 'none';
			const style = getComputedStyle(page);
			const padTop = parseFloat(style.paddingTop) || 0;
			const padBottom = parseFloat(style.paddingBottom) || 0;
			const boxH = page.clientHeight - padTop - padBottom;
			const naturalH = content.scrollHeight;
			if (naturalH > boxH && boxH > 0) {
				const scale = boxH / naturalH;
				content.style.transformOrigin = 'center center';
				content.style.transform = `scale(${scale})`;
			}
		});
	}

	// Réduit automatiquement le contenu des bulletins pour qu'ils
	// tiennent sur une seule page (utile quand il y a beaucoup de matières).
	$effect(() => {
		bulletinTousEleves;
		bulletinEleve;
		selectionIds;
		titreBulletinValue;
		anneeScolaireValue;
		elevesTries;
		ajusterEchelleBulletins();
		// Recalcule après le chargement des polices (sinon la hauteur
		// mesurée avec la police de secours est fausse et le contenu déborde).
		if (typeof document !== 'undefined' && 'fonts' in document) {
			(document as Document & { fonts: FontFaceSet }).fonts.ready.then(() =>
				ajusterEchelleBulletins()
			);
		}
	});

	async function imprimerBulletin() {
		const originalTitle = document.title;
		const isSingle = bulletinEleve !== null;
		const filename = getBulletinFilename(isSingle).replace(/\.pdf$/i, '');
		document.title = filename;
		// S'assurer que les polices sont chargées avant de mesurer et d'imprimer.
		if (typeof document !== 'undefined' && 'fonts' in document) {
			await (document as Document & { fonts: FontFaceSet }).fonts.ready;
		}
		ajusterEchelleBulletins();
		window.print();
		setTimeout(() => {
			document.title = originalTitle;
		}, 100);
	}
</script>

{#if !bulletinEleve && !bulletinTousEleves}
	<div class="flex min-h-full flex-col space-y-6 bg-sidebar p-6 text-sidebar-foreground">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Bulletins de notes</h1>
				<p class="text-sm text-muted-foreground">
					Sélectionnez les examens à inclure dans le bulletin. Les moyennes de l'élève et de la
					classe sont calculées uniquement sur les examens sélectionnés.
				</p>
			</div>
			{#if listeExamens.length > 0}
				<Button
					onclick={ouvrirTousBulletins}
					class="gap-2"
					variant="default"
					disabled={selectionIds.length === 0}
				>
					<Printer class="size-4" />
					Imprimer tous les bulletins
				</Button>
			{/if}
		</div>

		<!-- EXAMENS INCLUS DANS LE BULLETIN -->
		<div class="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm">
			<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
				<h2 class="flex items-center gap-2 font-semibold text-foreground">
					<School class="size-4 text-primary" />
					Examens inclus dans le bulletin
				</h2>
				{#if listeExamens.length > 1}
					<div class="flex items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							onclick={selectionnerTousExamens}
							disabled={toutSelectionne}
						>
							Tout sélectionner
						</Button>
						<Button
							size="sm"
							variant="outline"
							onclick={viderSelectionExamens}
							disabled={selectionIds.length === 0}
						>
							Tout décocher
						</Button>
					</div>
				{/if}
			</div>
			{#if listeExamens.length === 0}
				<p class="text-sm text-muted-foreground italic">
					Aucun examen n'a encore été créé pour cette classe.
				</p>
			{:else}
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{#each listeExamens as examen (examen.id)}
						<label
							class="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition duration-200 hover:bg-muted/30 {bulletinExamenSelection.includes(
								examen.id
							)
								? 'border-primary bg-primary/5'
								: 'border-sidebar-border'}"
						>
							<input
								type="checkbox"
								value={examen.id}
								checked={bulletinExamenSelection.includes(examen.id)}
								onchange={() => toggleExamen(examen.id)}
								class="size-4 rounded border-sidebar-border text-primary focus:ring-primary"
							/>
							<div class="flex flex-col">
								<span class="text-sm font-medium text-foreground">{formatExamenNom(examen)}</span>
								<span class="text-xs text-muted-foreground">{examen.date}</span>
							</div>
						</label>
					{/each}
				</div>
				{#if selectionIds.length === 0}
					<p class="mt-4 text-xs font-medium text-destructive">
						Sélectionnez au moins un examen pour générer les bulletins.
					</p>
				{:else if modeCumule}
					<p class="mt-4 text-xs text-muted-foreground">
						{examensSelectionnes.length} examens sélectionnés : le bulletin affiche la
						{toutSelectionne ? 'moyenne annuelle' : 'moyenne générale'} (moyenne des examens sélectionnés)
						ainsi que la décision du conseil de classe.
					</p>
				{:else}
					<p class="mt-4 text-xs text-muted-foreground">
						Un seul examen sélectionné : le bulletin affiche uniquement la moyenne de « {formatExamenNom(
							examensSelectionnes[0]
						)} », sans moyenne annuelle ni décision du conseil de classe.
					</p>
				{/if}
			{/if}
		</div>

		<!-- STUDENTS LIST TABLE -->
		<div class="overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Élève</Table.Head>
						<Table.Head class="text-center">
							{modeCumule ? (toutSelectionne ? 'Moyenne annuelle' : 'Moyenne générale') : 'Moyenne'}
						</Table.Head>
						<Table.Head class="text-center">Rang</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each elevesTries as eleve (eleve.id)}
						{@const moyenne = moyenneSelection(eleve)}
						{@const rang = rangSelection(eleve.id)}
						<Table.Row class="hover:bg-muted/20">
							<Table.Cell>
								<div class="font-semibold text-foreground">{eleve.nom} {eleve.prenom}</div>
								<div class="text-xs text-muted-foreground">
									{#if eleve.dateNaissance}
										Né(e) le {new Date(eleve.dateNaissance).toLocaleDateString('fr-FR')}
										{formatAge(eleve.dateNaissance) ? ` (${formatAge(eleve.dateNaissance)})` : ''}
									{:else}
										—
									{/if}
								</div>
							</Table.Cell>
							<Table.Cell class="text-center text-base font-bold">
								{moyenne > 0 ? `${formatNombre(moyenne)}/20` : '—'}
							</Table.Cell>
							<Table.Cell class="text-center">
								{#if rang > 0}
									<span
										class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
									>
										{rang}<sup>{rang === 1 ? 'er' : 'e'}</sup>
									</span>
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-right">
								<Button
									size="sm"
									variant="outline"
									disabled={selectionIds.length === 0}
									onclick={() => ouvrirBulletin(eleve)}
								>
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
	<div
		class="bulletin-print-area flex min-h-[calc(100vh-4rem)] flex-col items-center space-y-6 p-6 print:block print:p-0"
	>
		<div
			class="mb-4 flex w-full flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between print:hidden"
		>
			<Button variant="outline" onclick={retourListe}>Retour à la liste</Button>
			<p class="text-xs text-muted-foreground">
				Examens inclus : {examensSelectionnes.map((e) => formatExamenNom(e)).join(', ') || '—'}
			</p>
			<div class="flex flex-wrap items-end gap-3">
				<div class="grid gap-1">
					<Label class="text-xs" for="titre-input">Titre du bulletin</Label>
					<Input
						id="titre-input"
						bind:value={titreBulletinValue}
						oninput={() => (titrePersonnalise = true)}
						class="h-8 w-56"
					/>
				</div>
				<div class="grid gap-1">
					<Label class="text-xs" for="annee-input">Année scolaire</Label>
					<Input
						id="annee-input"
						bind:value={anneeScolaireValue}
						class="h-8 w-40"
						placeholder="2023 - 2024"
					/>
				</div>
				<Button onclick={imprimerBulletin} class="gap-2" variant="default">
					<Printer class="size-4" />
					Imprimer
				</Button>
			</div>
		</div>

		<div
			class="bulletin-print-area flex w-full flex-1 flex-col items-center justify-center print:block"
		>
			{#if bulletinEleve}
				<div class="bulletin-sheet">
					<div class="bulletin-inner">
						{@render singleBulletin(bulletinEleve, false)}
						{@render singleBulletin(bulletinEleve, true)}
					</div>
				</div>
			{:else if bulletinTousEleves}
				{#each elevesTries as eleve (eleve.id)}
					<div class="bulletin-sheet">
						<div class="bulletin-inner">
							{@render singleBulletin(eleve, false)}
							{@render singleBulletin(eleve, true)}
						</div>
					</div>
				{/each}
			{/if}
			<div class="print-spacer"></div>
		</div>
	</div>
{/if}

{#snippet singleBulletin(eleve: EleveCours, doublure: boolean = false)}
	{@const refIds = selectionIds}
	{@const moyenneEleve = moyenneSelection(eleve)}
	{@const rangG = rangSelection(eleve.id)}
	{@const moyClasse = moyenneClasse(refIds)}
	{@const totalCoef = listeCours.reduce((s, c) => s + (c.coefficient || 0), 0)}
	{@const totalNDef = listeCours.reduce(
		(s, c) => s + moyenneMatierePeriodes(eleve, c.id, refIds) * (c.coefficient || 0),
		0
	)}
	{@const numero = numeroClasse(eleve)}
	{@const mentionGenerale = appreciationScale(moyenneEleve)}

	<div class="bulletin-page {doublure ? 'bulletin-doublure' : ''}">
		<div class="bulletin-content">
			<!-- EN-TÊTE -->
			<div class="bulletin-header">
				<!-- Logo gauche -->
				<div class="bulletin-logo">
					<img src="/logos/logo-left.png" alt="Logo établissement" class="logo-rond" />
				</div>

				<!-- Bloc texte central -->
				<div class="bulletin-titre">
					<img src="/logos/building-icon.png" alt="Icône établissement" class="building-icon" />
					<p class="ecole-nom">LYCEE TSARARIVOTRA ANDRIAMANELO</p>
					<p class="ecole-nom">SAINT CHRISTOPHOROS ALASORA</p>
					<h1 class="bulletin-grand-titre">{titreBulletinValue}</h1>
					<p class="annee-scolaire">
						Année scolaire : <span class="valeur-annee">{anneeScolaireValue || '—'}</span>
					</p>
				</div>

				<!-- Logo droit -->
				<div class="bulletin-logo">
					<img src="/logos/logo-right.png" alt="Sceau officiel" class="logo-rond" />
				</div>
			</div>

			<!-- INFORMATIONS ÉLÈVE -->
			<div class="infos-eleve">
				<div class="ligne-infos">
					<span class="libelle">Nom et Prénom(s) :</span>
					<span class="valeur">{eleve.nom} {eleve.prenom}</span>
				</div>
				<div class="ligne-infos-multiple">
					<span
						><span class="libelle">Date de naissance :</span>
						{eleve.dateNaissance
							? new Date(eleve.dateNaissance).toLocaleDateString('fr-FR')
							: '—'}</span
					>
					<span
						><span class="libelle">Classe :</span>
						{formatClasseNom(data.classe?.niveau, data.classe?.nom)}</span
					>
					<span><span class="libelle">N° :</span> {numero || '—'}</span>
					<span><span class="libelle">Situation :</span> {eleve.situation || 'P'}</span>
					<span><span class="libelle">IM :</span> {eleve.im || '—'}</span>
				</div>
			</div>

			<!-- TABLEAU PRINCIPAL DES NOTES -->
			<table class="bulletin-table">
				<thead>
					<tr>
						<th class="col-matiere">MATIERES</th>
						<th class="col-note">Note / 20</th>
						<th class="col-coef">Coef</th>
						<th class="col-ndef">NDef</th>
						<th class="col-appr">Appréciations</th>
					</tr>
				</thead>
				<tbody>
					{#each listeCours as cours (cours.id)}
						{@const notesM = getNotesMatiere(eleve, cours.id, refIds)}
						{@const moyM = moyenneMatierePeriodes(eleve, cours.id, refIds)}
						{@const ndef = moyM * (cours.coefficient || 0)}
						{@const appr = appreciationMatiere(moyM)}
						<tr>
							<td class="col-matiere">{cours.nom}</td>
							<td class="col-note">{notesM.length > 0 ? formatFr(moyM) : '0'}</td>
							<td class="col-coef">{cours.coefficient || 0}</td>
							<td class="col-ndef">{notesM.length > 0 ? formatFr(ndef) : '0'}</td>
							<td class="col-appr">{appr}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr class="ligne-total">
						<td colspan="2" class="col-matiere col-total-label">TOTAL</td>
						<td class="col-coef">{formatFr(totalCoef)}</td>
						<td class="col-ndef">{formatFr(totalNDef)}</td>
						<td class="col-appr"></td>
					</tr>
				</tfoot>
			</table>

			<!-- MOYENNE ET RANG -->
			<div class="moyenne-rang">
				{#if !modeCumule}
					<p>
						<span class="libelle">MOYENNE :</span>
						<span class="valeur">{moyenneEleve > 0 ? `${formatFr(moyenneEleve)} / 20` : '—'}</span>
					</p>
				{/if}
				<p>
					<span class="libelle">MOYENNE DE LA CLASSE :</span>
					<span class="valeur">{moyClasse > 0 ? formatFr(moyClasse) : '—'}</span>
				</p>
				<p>
					<span class="libelle">RANG :</span>
					<span class="valeur"
						>{rangG > 0 ? `${formatRang(rangG)} / ${elevesClasse.length} élèves` : '—'}</span
					>
				</p>
				{#if !modeCumule}
					<p>
						<span class="libelle">MENTION :</span>
						<span class="valeur">{mentionGenerale || '—'}</span>
					</p>
				{/if}
			</div>

			{#if modeCumule}
				<!-- TABLEAU RÉCAPITULATIF DES EXAMENS SÉLECTIONNÉS -->
				<table class="bulletin-table table-trimestres">
					<thead>
						<tr>
							{#each examensSelectionnes as ex (ex.id)}
								<th>{formatExamenNom(ex)}</th>
							{/each}
							<th>{labelMoyenneCumulee}</th>
							<th>{labelRangCumule}</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							{#each examensSelectionnes as ex (ex.id)}
								{@const m = calculerMoyenneGenerale(eleve, [ex.id])}
								<td>{m > 0 ? formatFr(m) : '—'}</td>
							{/each}
							<td>{moyenneEleve > 0 ? formatFr(moyenneEleve) : '—'}</td>
							<td>{rangG > 0 ? `${formatRang(rangG)} / ${elevesClasse.length} élèves` : '—'}</td>
						</tr>
					</tbody>
				</table>

				<!-- DÉCISION DU CONSEIL DE CLASSE -->
				<div class="decision">
					<h2 class="decision-titre">DECISION DU CONSEIL DE CLASSE</h2>
					<div class="decision-corps">
						<div class="decision-col">
							<span class="libelle">Mention :</span>
							<span class="valeur">{mentionGenerale || '—'}</span>
						</div>
						<div class="decision-col decision-decision">
							<span class="valeur"
								>{formatDecisionAvecSerie(eleve, moyenneEleve, data.classe?.niveau)}</span
							>
						</div>
					</div>
				</div>
			{/if}

			<!-- SIGNATURES -->
			<div class="signatures">
				<div class="signature-bloc">
					<p class="signature-label">SIGNATURE PARENTS/TUTEUR,</p>
					<div class="signature-espace"></div>
				</div>
				<div class="signature-bloc">
					<p class="signature-label">LE PROVISEUR,</p>
					<div class="signature-espace"></div>
					<p class="proviseur-nom">{data.administrateurNom || '—'}</p>
				</div>
			</div>

			<!-- PIED DE PAGE -->
			<div class="bulletin-footer">Tehirizo tsara ity fa tsy misy solony</div>
		</div>
	</div>
{/snippet}

<style>
	/* Feuille A4 paysage : 2 bulletins identiques côte à côte (gauche/droite) */
	.bulletin-sheet {
		width: 100%;
		max-width: 297mm;
		display: flex;
		flex-direction: row;
		background: #fff;
	}

	.bulletin-inner {
		display: flex;
		flex-direction: row;
		width: 100%;
		gap: 4mm;
	}

	/* Un bulletin = moitié de la largeur de la feuille A4 paysage */
	.bulletin-page {
		width: 50%;
		flex: 1 1 0;
		min-height: 160mm;
		overflow: hidden;
		padding: 1.5mm 6mm 2mm;
		box-sizing: border-box;
		background: #fff;
		color: #000;
		font-family: Arial, Helvetica, sans-serif;
		font-size: 9px;
		line-height: 1.2;
		border: 1px solid #000;
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.bulletin-page + .bulletin-page {
		border-left: 1px solid #000;
	}

	/* Conteneur de contenu mis à l'échelle automatiquement pour tenir dans la page */
	.bulletin-content {
		width: 100%;
		flex-shrink: 0;
	}

	/* EN-TÊTE */
	.bulletin-header {
		display: grid;
		grid-template-columns: 70px 1fr 70px;
		align-items: center;
		gap: 8px;
		padding-bottom: 6px;
	}
	.bulletin-logo {
		display: flex;
		justify-content: center;
	}
	.logo-rond {
		width: 56px;
		height: 56px;
		object-fit: contain;
	}
	.building-icon {
		height: 28px;
		width: auto;
		display: block;
		margin: 0 auto 4px;
	}
	.bulletin-titre {
		text-align: center;
	}
	.ecole-nom {
		font-size: 10px;
		font-weight: bold;
		letter-spacing: 0.5px;
		margin: 0;
	}
	.embleme-centre {
		font-size: 12px;
		line-height: 1;
		margin: 1px 0;
		color: #000;
	}
	.bulletin-grand-titre {
		font-size: 19px;
		font-weight: bold;
		text-transform: uppercase;
		margin: 2px 0;
		letter-spacing: 1px;
	}
	.annee-scolaire {
		font-size: 12px;
		margin: 0;
	}
	.valeur-annee {
		text-decoration: underline;
	}

	/* INFORMATIONS ÉLÈVE */
	.infos-eleve {
		margin: 4px 0 6px;
	}
	.ligne-infos {
		margin-bottom: 3px;
	}
	.ligne-infos-multiple {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 18px;
	}
	.libelle {
		font-weight: bold;
		font-style: italic;
		text-decoration: underline;
	}
	.valeur {
		font-weight: normal;
	}

	/* TABLEAUX */
	.bulletin-table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 5px;
	}
	.bulletin-table th,
	.bulletin-table td {
		border: 1px solid #000;
		padding: 2px 5px;
	}
	.bulletin-table thead th {
		font-weight: bold;
		text-align: center;
		background: #fff;
	}
	.col-matiere {
		text-align: left;
	}
	.col-note,
	.col-coef,
	.col-ndef {
		text-align: center;
		width: 70px;
	}
	.col-appr {
		text-align: left;
	}
	.col-total-label {
		text-align: center;
		font-weight: bold;
	}
	.ligne-total td {
		font-weight: bold;
	}

	.table-trimestres th,
	.table-trimestres td {
		text-align: center;
	}

	/* MOYENNE ET RANG */
	.moyenne-rang {
		margin-bottom: 5px;
	}
	.moyenne-rang p {
		margin: 2px 0;
	}

	/* DÉCISION */
	.decision {
		border: 1px solid #000;
		margin-bottom: 6px;
	}
	.decision-titre {
		text-align: center;
		font-weight: bold;
		text-transform: uppercase;
		margin: 0;
		padding: 4px;
		border-bottom: 1px solid #000;
		font-size: 12px;
	}
	.decision-corps {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}
	.decision-col {
		padding: 8px;
	}
	.decision-col + .decision-col {
		border-left: 1px solid #000;
	}
	.decision-decision .valeur {
		font-weight: bold;
		text-transform: uppercase;
		font-size: 13px;
	}

	/* SIGNATURES */
	.signatures {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		margin-bottom: 6px;
	}
	.signature-label {
		font-weight: bold;
		margin: 0 0 4px;
	}
	.signature-espace {
		height: 32px;
	}
	.proviseur-nom {
		font-style: italic;
		text-align: center;
		font-weight: bold;
		position: relative;
		z-index: 1;
		margin-top: 12px;
	}

	/* PIED DE PAGE */
	.bulletin-footer {
		text-align: center;
		font-style: italic;
		font-weight: bold;
		padding-top: 2px;
	}

	/* Feuille A4 paysage : 2 bulletins identiques côte à côte par page */
	@page {
		size: A4 landscape;
		margin: 0;
	}

	@media print {
		:global(body) {
			background: white !important;
			color: black !important;
			margin: 0;
			padding: 0;
		}
		.bulletin-print-area {
			display: block !important;
			min-height: 0 !important;
			height: auto !important;
			margin: 0 !important;
			padding: 0 !important;
		}
		.print-spacer {
			display: none;
		}
		.bulletin-sheet {
			width: 291mm;
			min-height: 200mm;
			margin: 3mm auto;
			display: flex;
			align-items: center;
			justify-content: center;
			break-before: page;
			page-break-before: always;
		}
		.bulletin-inner {
			display: flex;
			flex-direction: row;
			align-items: center;
			width: 100%;
			gap: 4mm;
		}
		.bulletin-page {
			width: 50%;
			flex: 1 1 0;
			min-height: 160mm;
			overflow: hidden;
			margin: 0;
			box-sizing: border-box;
			display: flex;
			flex-direction: column;
			justify-content: center;
		}
		.bulletin-page + .bulletin-page {
			border-left: 1px solid #000;
		}
		.bulletin-table,
		.bulletin-table tr,
		.decision,
		.signatures,
		.infos-eleve {
			break-inside: avoid;
		}
	}
</style>
