<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Printer, School } from '@lucide/svelte/icons';
	import type { EleveCours, Note, Examen, Cours } from '$lib/types/Materiel.type';
	import type { PageProps } from './$types';
	import { formatClasseNom, formatExamenNom } from '$lib/utils';

	const { data }: PageProps = $props();

	let listeCours = $state<Cours[]>([...data.listeCours]);
	let listeExamens = $state<Examen[]>([...data.listeExamens]);
	let elevesClasse = $state<EleveCours[]>([...data.elevesClasse]);

	let bulletinEleve = $state<EleveCours | null>(null);
	let bulletinExamenIds = $state<string[]>([]);
	let bulletinTousEleves = $state(false);
	let examensActifs = $state<string[]>(data.listeExamens.map((e) => e.id));
	let bulletinExamenRef = $state<string>(
		data.listeExamens.length ? data.listeExamens[data.listeExamens.length - 1].id : ''
	);
	let anneeScolaireValue = $state<string>(data.classe?.anneeScolaire?.nom || '');
	let titreBulletinValue = $state<string>("BULLETIN FIN D'ANNEE");

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

	// Format décimal français (virgule)
	function formatFr(valeur: number): string {
		return formatNombre(valeur).replace('.', ',');
	}

	function getNotesEleveExamens(e: EleveCours | null, examenIds: string[]): Note[] {
		if (!e) return [];
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const seen = new Set<string>();
		return (
			e.notes?.filter((n) => {
				if (!(!n.examenId || examenIds.includes(n.examenId))) return false;
				const key = `${n.coursId}|${n.valeur}|${n.coefficient}|${n.examenId ?? ''}|${n.libelle ?? ''}`;
				if (seen.has(key)) return false;
				seen.add(key);
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

	function getNomExamens(examenIds: string[]): string {
		const noms = examenIds
			.map((id) => formatExamenNom(getExamen(id)))
			.filter((nom): nom is string => Boolean(nom));
		return noms.length > 0 ? noms.join(', ') : '—';
	}

	function ouvrirBulletin(e: EleveCours) {
		if (examensActifs.length === 0) return;
		bulletinTousEleves = false;
		bulletinEleve = e;
		bulletinExamenIds = [...examensActifs];
		if (!bulletinExamenRef || !examensActifs.includes(bulletinExamenRef)) {
			bulletinExamenRef = examensActifs[examensActifs.length - 1];
		}
	}

	function ouvrirTousBulletins() {
		bulletinTousEleves = true;
		bulletinEleve = null;
		bulletinExamenIds = [...examensActifs];
		if (!bulletinExamenRef || !examensActifs.includes(bulletinExamenRef)) {
			bulletinExamenRef = examensActifs[examensActifs.length - 1];
		}
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
	<div class="flex min-h-full flex-col space-y-6 bg-sidebar p-6 text-sidebar-foreground">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Bulletins de notes</h1>
				<p class="text-sm text-muted-foreground">
					Sélectionnez les examens pour calculer les moyennes de la classe.
				</p>
			</div>
			{#if listeExamens.length > 0}
				<Button
					onclick={ouvrirTousBulletins}
					class="gap-2"
					variant="default"
					disabled={examensActifs.length === 0}
				>
					<Printer class="size-4" />
					Imprimer tous les bulletins
				</Button>
			{/if}
		</div>

		<!-- EXAM SELECTION CARD -->
		<div class="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm">
			<h2 class="mb-4 flex items-center gap-2 font-semibold text-foreground">
				<School class="size-4 text-primary" />
				Examens à inclure
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
								type="checkbox"
								checked={examensActifs.includes(examen.id)}
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

				<!-- EXAMEN DE RÉFÉRENCE -->
				<div class="mt-6 border-t border-sidebar-border pt-4">
					<h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
						<School class="size-4 text-primary" />
						Examen de référence (notes affichées)
					</h3>
					{#if listeExamens.length === 0}
						<p class="text-sm text-muted-foreground italic">Aucun examen disponible.</p>
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
										<span class="text-sm font-medium text-foreground"
											>{formatExamenNom(examen)}</span
										>
										<span class="text-xs text-muted-foreground">{examen.date}</span>
									</div>
								</label>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- STUDENTS LIST TABLE -->
		<div class="overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm">
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
									disabled={examensActifs.length === 0}
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
	<div class="space-y-6 p-6 print:m-0 print:max-w-none print:p-0">
		<div
			class="mb-4 flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between print:hidden"
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

		{#if bulletinEleve}
			<div class="bulletin-print-sheet">
				{@render singleBulletin(bulletinEleve)}
				{@render singleBulletin(bulletinEleve)}
			</div>
		{:else if bulletinTousEleves}
			{#each elevesClasse as eleve (eleve.id)}
				<div class="bulletin-print-sheet">
					{@render singleBulletin(eleve)}
					{@render singleBulletin(eleve)}
				</div>
			{/each}
		{/if}
	</div>
{/if}

{#snippet singleBulletin(eleve: EleveCours)}
	{@const refIds = bulletinExamenRef ? [bulletinExamenRef] : bulletinExamenIds}
	{@const moyenneG = calculerMoyenneGenerale(eleve, refIds)}
	{@const rangG = calculerRang(eleve.id, refIds)}
	{@const moyClasse = moyenneClasse(refIds)}
	{@const totalCoef = listeCours.reduce((s, c) => s + (c.coefficient || 0), 0)}
	{@const totalNDef = listeCours.reduce(
		(s, c) =>
			s + calculerMoyenneMatiere(getNotesMatiere(eleve, c.id, refIds)) * (c.coefficient || 0),
		0
	)}
	{@const numero = numeroClasse(eleve)}
	{@const mentionGenerale = appreciationScale(moyenneG)}

	<div class="bulletin-page">
		<!-- EN-TÊTE -->
		<div class="bulletin-header">
			<!-- Logo gauche -->
			<div class="bulletin-logo">
				<svg viewBox="0 0 100 100" class="logo-rond" role="img" aria-label="Logo établissement">
					<circle cx="50" cy="50" r="48" fill="#3c6e47" stroke="#2a4f33" stroke-width="2" />
					<path d="M2 72 A48 48 0 0 0 98 72 L98 80 A48 48 0 0 1 2 80 Z" fill="#e25b8a" />
					<g fill="#fff">
						<rect x="36" y="42" width="28" height="24" />
						<rect x="32" y="38" width="36" height="6" />
						<path d="M32 38 L50 26 L68 38 Z" />
						<rect x="46" y="50" width="8" height="16" fill="#3c6e47" />
						<rect x="39" y="50" width="5" height="5" />
						<rect x="56" y="50" width="5" height="5" />
					</g>
				</svg>
			</div>

			<!-- Bloc texte central -->
			<div class="bulletin-titre">
				<p class="ecole-nom">LYCEE TSARARIVOTRA ANDRIAMANELO</p>
				<p class="ecole-nom">SAINT CHRISTOPHOROS ALASORA</p>
				<div class="embleme-centre" aria-hidden="true">★</div>
				<h1 class="bulletin-grand-titre">{titreBulletinValue}</h1>
				<p class="annee-scolaire">
					Année scolaire : <span class="valeur-annee">{anneeScolaireValue || '—'}</span>
				</p>
			</div>

			<!-- Logo droit -->
			<div class="bulletin-logo">
				<svg viewBox="0 0 100 100" class="logo-rond" role="img" aria-label="Sceau officiel">
					<circle cx="50" cy="50" r="48" fill="#f4c20d" stroke="#caa00a" stroke-width="2" />
					<circle cx="50" cy="50" r="32" fill="#1f8fb0" />
					<circle cx="50" cy="50" r="26" fill="none" stroke="#fff" stroke-width="1.5" />
					<text x="50" y="54" text-anchor="middle" font-size="11" fill="#fff" font-weight="bold"
						>ÉTAB</text
					>
				</svg>
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
					{#each bulletinExamenIds as exId (exId)}
						<th>{formatExamenNom(getExamen(exId))}</th>
					{/each}
					<th>MOYENNE ANNUELLE</th>
					<th>RANG ANNUEL</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					{#each bulletinExamenIds as exId (exId)}
						{@const m = calculerMoyenneGenerale(eleve, [exId])}
						<td>{m > 0 ? formatFr(m) : '—'}</td>
					{/each}
					<td>{moyenneG > 0 ? formatFr(moyenneG) : '—'}</td>
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
					<span class="valeur">{formatDecision(moyenneG)}</span>
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
	/* Cadre de page type A4 */
	.bulletin-page {
		width: 210mm;
		min-height: 297mm;
		margin: 0 auto;
		padding: 8mm 10mm 6mm;
		box-sizing: border-box;
		background: #fff;
		color: #000;
		font-family: Arial, Helvetica, sans-serif;
		font-size: 11px;
		line-height: 1.3;
		border: 1px solid #000;
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
	}

	/* EN-TÊTE */
	.bulletin-header {
		display: grid;
		grid-template-columns: 70px 1fr 70px;
		align-items: center;
		gap: 8px;
		border-bottom: 1px solid #000;
		padding-bottom: 6px;
	}
	.bulletin-logo {
		display: flex;
		justify-content: center;
	}
	.logo-rond {
		width: 64px;
		height: 64px;
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
		border-top: 1px solid #000;
		padding-top: 6px;
	}

	@media print {
		@page {
			size: A4 landscape;
			margin: 6mm;
		}
		:global(body) {
			background: white !important;
			color: black !important;
		}
		.print\:break-after-page {
			break-after: page;
		}
		.bulletin-page {
			width: 100%;
			min-height: auto;
			border: 1px solid #000;
			page-break-inside: avoid;
		}
		/* Une feuille A4 paysage = 2 exemplaires superposés (haut/bas) */
		.bulletin-print-sheet {
			display: flex;
			flex-direction: column;
			height: 100%;
		}
		.bulletin-print-sheet .bulletin-page {
			flex: 1 1 0;
			min-height: 0;
			width: 100%;
			margin: 0;
			overflow: hidden;
			page-break-inside: avoid;
			break-inside: avoid;
			border: 1px solid #000;
			font-size: 9px;
			padding: 4mm 6mm 3mm;
		}
		.bulletin-print-sheet .bulletin-page + .bulletin-page {
			border-top: 1px dashed #999;
		}
		.bulletin-print-sheet .bulletin-grand-titre {
			font-size: 16px;
		}
		.bulletin-print-sheet .bulletin-table th,
		.bulletin-print-sheet .bulletin-table td {
			padding: 2px 4px;
		}
		.bulletin-print-sheet .logo-rond {
			width: 48px;
			height: 48px;
		}
		.bulletin-print-sheet .decision {
			margin-bottom: 6px;
		}
		.bulletin-print-sheet .signatures {
			margin-bottom: 6px;
			gap: 8px;
		}
	}
</style>
