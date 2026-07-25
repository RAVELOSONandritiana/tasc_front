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

	let bulletinEleve = $state<EleveCours | null>(null);
	let bulletinTousEleves = $state(false);
	let bulletinExamenRef = $state<string>(
		data.listeExamens.length ? data.listeExamens[data.listeExamens.length - 1].id : ''
	);
	let anneeScolaireValue = $state<string>(data.classe?.anneeScolaire?.nom || '');
	let titreBulletinValue = $state<string>("BULLETIN FIN D'ANNEE");

	function getCoefficientCours(coursId: string): number {
		return listeCours.find((c) => c.id === coursId)?.coefficient ?? 0;
	}

	function getNoteCoefficient(note: Note): number {
		return note.coefficient || getCoefficientCours(note.coursId);
	}

	function formatNombre(valeur: number): string {
		return Number.isInteger(valeur) ? valeur.toString() : valeur.toFixed(2);
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

	function calculerMoyenneGenerale(eleve: EleveCours, examenIds: string[]): number {
		if (listeCours.length === 0) return 0;
		const totalCoef = listeCours.reduce((s, c) => {
			if (!estParticipant(c, eleve)) return s;
			return s + (c.coefficient || 0);
		}, 0);
		if (totalCoef === 0) return 0;
		const totalPoints = listeCours.reduce((s, c) => {
			if (!estParticipant(c, eleve)) return s;
			const notesM = getNotesMatiere(eleve, c.id, examenIds);
			const moy = calculerMoyenneMatiere(notesM);
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

	// Moyenne générale de la classe (sur les élèves ayant une moyenne > 0)
	function moyenneClasse(examenIds: string[]): number {
		if (examenIds.length === 0) return 0;
		const vals = elevesClasse
			.map((e) => calculerMoyenneGenerale(e, examenIds))
			.filter((m) => m > 0);
		if (vals.length === 0) return 0;
		return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
	}

	// Moyenne annuelle = moyenne de toutes les moyennes d'examens de l'eleve.
	function moyenneAnnuelle(eleve: EleveCours): number {
		if (listeExamens.length === 0) return 0;
		const vals = listeExamens
			.map((ex) => calculerMoyenneGenerale(eleve, [ex.id]))
			.filter((m) => m > 0);
		if (vals.length === 0) return 0;
		return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
	}

	function rangAnnuel(eleveId: string): number {
		const tries = elevesClasse
			.map((e) => ({ id: e.id, moy: moyenneAnnuelle(e) }))
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

	function formatRang(rang: number): string {
		if (rang <= 0) return '—';
		return rang === 1 ? '1ᵉʳ' : `${rang}ᵉ`;
	}

	function formatDecision(m: number): string {
		if (m >= 10) return 'ADMIS(E)';
		if (m > 0) return 'AJOURNÉ(E)';
		return '—';
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
	$effect(() => {
		listeCours = [...data.listeCours];
		listeExamens = [...data.listeExamens];
		elevesClasse = [...data.elevesClasse];
	});

	function ouvrirBulletin(e: EleveCours) {
		if (!bulletinExamenRef) return;
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

	function imprimerBulletin() {
		window.print();
	}
</script>

{#if !bulletinEleve && !bulletinTousEleves}
	<div class="flex min-h-full flex-col space-y-6 bg-sidebar p-6 text-sidebar-foreground">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Bulletins de notes</h1>
				<p class="text-sm text-muted-foreground">
					Sélectionnez l'examen de référence dont les notes seront affichées. La moyenne annuelle
					est calculée à partir de tous les examens.
				</p>
			</div>
			{#if listeExamens.length > 0}
				<Button
					onclick={ouvrirTousBulletins}
					class="gap-2"
					variant="default"
					disabled={listeExamens.length === 0}
				>
					<Printer class="size-4" />
					Imprimer tous les bulletins
				</Button>
			{/if}
		</div>

		<!-- EXAMEN DE RÉFÉRENCE -->
		<div class="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm">
			<h2 class="mb-4 flex items-center gap-2 font-semibold text-foreground">
				<School class="size-4 text-primary" />
				Examen de référence (notes affichées)
			</h2>
			{#if listeExamens.length === 0}
				<p class="text-sm text-muted-foreground italic">
					Aucun examen n'a encore été créé pour cette classe.
				</p>
			{:else}
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{#each listeExamens as examen (examen.id)}
						<label
							class="flex cursor-pointer items-center gap-3 rounded-lg border border-sidebar-border p-3 transition duration-200 hover:bg-muted/30"
						>
							<input
								type="radio"
								name="examenRef"
								value={examen.id}
								checked={bulletinExamenRef === examen.id}
								onchange={() => (bulletinExamenRef = examen.id)}
								class="size-4 rounded-full border-sidebar-border text-primary focus:ring-primary"
							/>
							<div class="flex flex-col">
								<span class="text-sm font-medium text-foreground">{formatExamenNom(examen)}</span>
								<span class="text-xs text-muted-foreground">{examen.date}</span>
							</div>
						</label>
					{/each}
				</div>
				<p class="mt-4 text-xs text-muted-foreground">
					La moyenne annuelle affichée dans le bulletin est la moyenne de toutes les moyennes
					d'examens.
				</p>
			{/if}
		</div>

		<!-- STUDENTS LIST TABLE -->
		<div class="overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Élève</Table.Head>
						<Table.Head class="text-center">Moyenne annuelle</Table.Head>
						<Table.Head class="text-center">Rang annuel</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each elevesClasse as eleve (eleve.id)}
						{@const moyenne = moyenneAnnuelle(eleve)}
						{@const rang = rangAnnuel(eleve.id)}
						<Table.Row class="hover:bg-muted/20">
							<Table.Cell>
								<div class="font-semibold text-foreground">{eleve.nom} {eleve.prenom}</div>
								<div class="text-xs text-muted-foreground">
									{#if eleve.dateNaissance}
										Né(e) le {new Date(eleve.dateNaissance).toLocaleDateString('fr-FR')}
										{formatAge(eleve.dateNaissance)
											? ` (${formatAge(eleve.dateNaissance)})`
											: ''}
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
									disabled={!bulletinExamenRef}
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
		class="flex min-h-[calc(100vh-4rem)] flex-col items-center space-y-6 p-6 print:block print:p-0"
	>
		<div
			class="mb-4 flex w-full flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between print:hidden"
		>
			<Button variant="outline" onclick={retourListe}>Retour à la liste</Button>
			<div class="flex flex-wrap items-end gap-3">
				<div class="grid gap-1">
					<Label class="text-xs" for="titre-input">Titre du bulletin</Label>
					<Input id="titre-input" bind:value={titreBulletinValue} class="h-8 w-56" />
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

		<div class="flex w-full flex-1 items-center justify-center">
			{#if bulletinEleve}
				<div class="bulletin-sheet">
					{@render singleBulletin(bulletinEleve, false)}
					{@render singleBulletin(bulletinEleve, true)}
				</div>
			{:else if bulletinTousEleves}
				{#each elevesClasse as eleve (eleve.id)}
					<div class="bulletin-sheet">
						{@render singleBulletin(eleve, false)}
						{@render singleBulletin(eleve, true)}
					</div>
				{/each}
			{/if}
		</div>
	</div>
{/if}

{#snippet singleBulletin(eleve: EleveCours, doublure: boolean = false)}
	{@const refIds = bulletinExamenRef ? [bulletinExamenRef] : []}
	{@const rangG = refIds.length ? calculerRang(eleve.id, refIds) : 0}
	{@const moyenneAnnuelleEleve = moyenneAnnuelle(eleve)}
	{@const rangAnnuelEleve = rangAnnuel(eleve.id)}
	{@const moyClasse = refIds.length ? moyenneClasse(refIds) : 0}
	{@const totalCoef = listeCours.reduce((s, c) => s + (c.coefficient || 0), 0)}
	{@const totalNDef = listeCours.reduce(
		(s, c) =>
			s + calculerMoyenneMatiere(getNotesMatiere(eleve, c.id, refIds)) * (c.coefficient || 0),
		0
	)}
	{@const numero = numeroClasse(eleve)}
	{@const mentionGenerale = appreciationScale(moyenneAnnuelleEleve)}

	<div class="bulletin-page print:break-after-page {doublure ? 'bulletin-doublure' : ''}">
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
				<span><span class="libelle">Situation :</span> {eleve.redoublant ? 'D' : 'P'}</span>
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
					{@const moyM = calculerMoyenneMatiere(notesM)}
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
		</div>

		<!-- TABLEAU RÉCAPITULATIF DES TRIMESTRES -->
		<table class="bulletin-table table-trimestres">
			<thead>
				<tr>
					{#each listeExamens as ex (ex.id)}
						<th>{formatExamenNom(ex)}</th>
					{/each}
					<th>MOYENNE ANNUELLE</th>
					<th>RANG ANNUEL</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					{#each listeExamens as ex (ex.id)}
						{@const m = calculerMoyenneGenerale(eleve, [ex.id])}
						<td>{m > 0 ? formatFr(m) : '—'}</td>
					{/each}
					<td>{moyenneAnnuelleEleve > 0 ? formatFr(moyenneAnnuelleEleve) : '—'}</td>
					<td
						>{rangAnnuelEleve > 0
							? `${formatRang(rangAnnuelEleve)} / ${elevesClasse.length} élèves`
							: '—'}</td
					>
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
					<span class="valeur">{formatDecision(moyenneAnnuelleEleve)}</span>
				</div>
			</div>
		</div>

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
{/snippet}

<style>
	/* Feuille A4 paysage : 2 bulletins côte à côte (gauche/droite) */
	.bulletin-sheet {
		width: 100%;
		max-width: 297mm;
		display: flex;
		flex-direction: row;
		background: #fff;
	}

	/* Un bulletin = moitié largeur de la feuille A4 paysage */
	.bulletin-page {
		width: 50%;
		flex: 1 1 0;
		min-height: 148mm;
		padding: 5mm 8mm 4mm;
		box-sizing: border-box;
		background: #fff;
		color: #000;
		font-family: Arial, Helvetica, sans-serif;
		font-size: 10px;
		line-height: 1.25;
		border: 1px solid #000;
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
	}
	.bulletin-page + .bulletin-page {
		border-left: none;
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
		width: 64px;
		height: 64px;
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
		font-size: 22px;
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
		margin: 6px 0 10px;
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
		margin-bottom: 10px;
	}
	.bulletin-table th,
	.bulletin-table td {
		border: 1px solid #000;
		padding: 3px 5px;
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
		margin-bottom: 10px;
	}
	.moyenne-rang p {
		margin: 2px 0;
	}

	/* DÉCISION */
	.decision {
		border: 1px solid #000;
		margin-bottom: 12px;
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
		gap: 12px;
		margin-bottom: 14px;
	}
	.signature-label {
		font-weight: bold;
		margin: 0 0 4px;
	}
	.signature-espace {
		height: 40px;
	}
	.proviseur-nom {
		font-style: italic;
		text-align: center;
		font-weight: bold;
		position: relative;
		z-index: 1;
	}

	/* PIED DE PAGE */
	.bulletin-footer {
		text-align: center;
		font-style: italic;
		font-weight: bold;
		padding-top: 6px;
	}

	/* Feuille A4 paysage : 2 bulletins empilés (haut/bas) par page */
	@page {
		size: A4 landscape;
		margin: 0;
	}

	@media print {
		:global(body) {
			background: white !important;
			color: black !important;
		}
	.bulletin-sheet {
		width: 297mm;
		height: 210mm;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		page-break-after: always;
		break-after: page;
	}
	.bulletin-page {
		width: 50%;
		flex: 1 1 0;
		min-height: 148mm;
		margin: 0;
		box-sizing: border-box;
		page-break-inside: avoid;
		break-inside: avoid;
	}
		.bulletin-page + .bulletin-page {
			border-left: none;
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
