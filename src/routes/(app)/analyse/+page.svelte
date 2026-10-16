<script lang="ts">
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { Input } from '$lib/components/ui/input';
	import { Line, Bar, Radar } from 'svelte-chartjs';
	import '$lib/chartjs';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Users,
		BarChart3,
		TrendingUp,
		AlertTriangle,
		Clock3,
		Gavel,
		ShieldAlert,
		Filter,
		Layers,
		ChevronDown,
		ChevronUp,
		Medal,
		Search,
		X,
		Check
	} from '@lucide/svelte';
	import * as Popover from '$lib/components/ui/popover';
	import EleveFiche from '$lib/components/analyse/EleveFiche.svelte';
	import { formatClasseNom, formatExamenNom } from '$lib/utils';
	import { goto } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import {
		type AnalyseCoursLite,
		type AnalyseEleveBase,
		moyenneMatiere,
		moyenneGenerale,
		moyenneClasseMatiere,
		formatFr,
		round
	} from '$lib/utils/analyse';
	import type { PageProps } from './$types';
	import type { EleveDetail } from '$lib/server/analyseEleve';

	const { data }: PageProps = $props();

	// ---- Fiche élève (drawer latéral, chargement différé) ----
	let drawerOpen = $state(false);
	let eleveDetail = $state<EleveDetail | null>(null);
	let eleveLoading = $state(false);

	async function openEleve(id: string) {
		drawerOpen = true;
		eleveLoading = true;
		eleveDetail = null;
		try {
			const fd = new FormData();
			fd.append('eleveId', id);
			const res = await fetch('?/eleve', { method: 'POST', body: fd, credentials: 'same-origin' });
			const result = deserialize(await res.text());
			if (result.type === 'success' && result.data?.detail)
				eleveDetail = result.data.detail as EleveDetail;
		} catch (e) {
			console.error('Erreur chargement fiche élève', e);
		} finally {
			eleveLoading = false;
		}
	}

	type ClasseInfo = {
		id: string;
		nom: string | null;
		niveau: number;
		serie: string | null;
		titulaireId: string | null;
		titulaire: string | null;
	};
	type CoursSel = AnalyseCoursLite & { classeId: string };
	type ExamenSel = {
		id: string;
		nom: string;
		date: string;
		classeId: string;
		periode?: string;
		sousExamens: { id: string; nom: string; examenId: string }[];
	};
	type EleveSel = AnalyseEleveBase & {
		classeId: string | null;
		classeNom: string | null;
		classeNiveau: number;
		absences: { id: string; date: string; justifie: boolean }[];
		retards: { id: string; date: string; duree: string; justifie: boolean }[];
		incidents: { id: string; type: string; message: string; date: string }[];
	};

	const classes = $derived<ClasseInfo[]>(data.classes || []);
	const selectedIds = $derived<string[]>(data.selectedIds || []);
	const listeCours = $derived<CoursSel[]>(data.listeCours || []);
	const listeExamens = $derived<ExamenSel[]>(data.listeExamens || []);
	const edtSeances = $derived<
		{
			id: string;
			classeId: string;
			coursId: string;
			jour: string;
			heureDebut: string;
			heureFin: string;
			duree: number;
		}[]
	>(data.edtSeances || []);
	const eleves = $derived<EleveSel[]>(data.eleves || []);
	const absencesProf = $derived<
		{
			id: string;
			professeurId: string;
			professeurNom: string;
			coursId: string | null;
			coursNom: string;
			classeId: string | null;
			date: string;
			heures: number;
			justifie: boolean;
		}[]
	>(data.absencesProf || []);
	const pointages = $derived<
		{
			id: string;
			coursId: string;
			professeurId: string | null;
			heuresPrevues: number | null;
			heuresEffectuees: number;
			manque: number;
		}[]
	>(data.pointages || []);

	const coursById = $derived(
		listeCours.reduce(
			(acc, c) => {
				acc[c.id] = c;
				return acc;
			},
			{} as Record<string, CoursSel>
		)
	);
	const coursByClasse = $derived.by(() => {
		const m = new Map<string, CoursSel[]>();
		for (const c of listeCours) {
			if (!m.has(c.classeId)) m.set(c.classeId, []);
			m.get(c.classeId)!.push(c);
		}
		return m;
	});

	// ---- Sélection des examens ----
	let examensChoisis = $state<string[] | null>(null);
	const selectedExamens = $derived(examensChoisis ?? listeExamens.map((e) => e.id));
	const selectedOrdered = $derived(listeExamens.filter((e) => selectedExamens.includes(e.id)));

	// Examens regroupés par classe (ordre des classes sélectionnées, puis le reste).
	// Dans un groupe, on retire le nom de classe en fin de libellé : il est déjà
	// affiché par le tag du groupe, sinon chaque pilule le répète inutilement.
	const examensParClasse = $derived.by(() => {
		const ordre = [...classes.map((c) => c.id)];
		for (const e of listeExamens) if (!ordre.includes(e.classeId)) ordre.push(e.classeId);
		const groupes: {
			classeId: string;
			label: string;
			examens: { ex: ExamenSel; label: string }[];
		}[] = [];
		for (const classeId of ordre) {
			const examens = listeExamens.filter((e) => e.classeId === classeId);
			if (!examens.length) continue;
			const classe = classes.find((c) => c.id === classeId);
			const suffixe = classe?.nom
				? new RegExp(`\\s*-\\s*${classe.nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i')
				: null;
			groupes.push({
				classeId,
				label: classe ? formatClasseNom(classe.niveau, classe.nom) : 'Autres',
				examens: examens.map((ex) => {
					const complet = formatExamenNom(ex);
					const base = complet.replace(suffixe ?? /$^/, '').trim();
					return { ex, label: base || complet };
				})
			});
		}
		return groupes;
	});

	function toggleExamen(id: string) {
		const courant = selectedExamens;
		if (courant.includes(id)) {
			if (courant.length > 1) examensChoisis = courant.filter((x) => x !== id);
		} else {
			examensChoisis = [...courant, id];
		}
	}

	// ---- Sélection des classes (met à jour l'URL) ----
	async function toggleClasse(id: string) {
		let next: string[] | null = null;
		if (selectedIds.includes(id)) {
			if (selectedIds.length > 1) next = selectedIds.filter((x) => x !== id);
		} else {
			next = [...selectedIds, id];
		}
		if (next) await goto(`/analyse?classes=${next.join(',')}`, { invalidateAll: true });
	}
	async function setClasses(ids: string[]) {
		await goto(ids.length ? `/analyse?classes=${ids.join(',')}` : '/analyse', {
			invalidateAll: true
		});
	}

	// ---- Sélecteur de matières (tri du classement) ----
	const matieres = $derived.by(() => {
		const m = new Map<string, { id: string; nom: string; couleur?: string }>();
		for (const c of listeCours) {
			if (!m.has(c.matiereId)) m.set(c.matiereId, c.matiere);
		}
		return [...m.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
	});

	// Moyenne d'un élève pour une matière (via le cours de sa classe).
	function moyEleveMatiere(eleve: EleveSel, matiereId: string): number {
		const cours = listeCours.find(
			(c) => c.classeId === eleve.classeId && c.matiereId === matiereId
		);
		if (!cours) return 0;
		return moyenneMatiere(eleve.notes, coursById, cours.id, selectedExamens);
	}

	function moyGeneraleEleve(eleve: EleveSel): number {
		return moyenneGenerale(
			eleve,
			coursByClasse.get(eleve.classeId ?? '') || [],
			coursById,
			selectedExamens
		);
	}

	// ---- Tri ----
	type SortKey = 'nom' | 'moy' | 'abs' | 'err' | string; // string = matiereId
	let sortKey = $state<SortKey>('moy');
	let sortDir = $state<'asc' | 'desc'>('desc');
	let searchEleve = $state('');

	type RowEleve = {
		eleve: EleveSel;
		moy: number;
		absences: number;
		retards: number;
		incidents: number;
		erreurs: number;
		matieres: Map<string, number>;
	};

	function rowVal(r: RowEleve, key: SortKey): number | string {
		switch (key) {
			case 'nom':
				return `${r.eleve.nom} ${r.eleve.prenom}`;
			case 'moy':
				return r.moy;
			case 'abs':
				return r.absences;
			case 'err':
				return r.erreurs;
			default:
				return r.matieres.get(key) || 0;
		}
	}

	function compareRows(a: RowEleve, b: RowEleve, key: SortKey, dir: number): number {
		if (key === 'nom') {
			return (rowVal(a, key) as string).localeCompare(rowVal(b, key) as string, 'fr') * dir;
		}
		return ((rowVal(a, key) as number) - (rowVal(b, key) as number)) * dir;
	}

	function requestSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = key === 'nom' ? 'asc' : 'desc';
		}
	}

	function matchSearch(e: { nom: string; prenom: string; im?: string | null }): boolean {
		const q = searchEleve.trim().toLowerCase();
		if (!q) return true;
		return (
			`${e.nom} ${e.prenom}`.toLowerCase().includes(q) || (e.im || '').toLowerCase().includes(q)
		);
	}

	const sortMatiere = $derived(matieres.find((m) => m.id === sortKey) ?? null);

	function moyColor(v: number): string {
		if (v <= 0) return 'text-muted-foreground';
		if (v < 10) return 'text-destructive';
		if (v < 12) return 'text-amber-500';
		return 'text-emerald-600';
	}

	// ---- Indicateurs ----
	const nbEleves = $derived(eleves.length);
	const moyGeneraleClasse = $derived(
		nbEleves
			? round(eleves.reduce((s, e) => s + Math.max(0, moyGeneraleEleve(e)), 0) / nbEleves)
			: 0
	);
	const tauxReussite = $derived(
		nbEleves
			? Math.round((eleves.filter((e) => moyGeneraleEleve(e) >= 10).length / nbEleves) * 100)
			: 0
	);
	const totalAbsences = $derived(eleves.reduce((s, e) => s + e.absences.length, 0));
	const totalRetards = $derived(eleves.reduce((s, e) => s + e.retards.length, 0));
	const totalIncidents = $derived(eleves.reduce((s, e) => s + e.incidents.length, 0));

	// ---- Top / Flop élèves (analyse immédiate) ----
	// Top 3 de chaque classe : on ne compare pas un élève de 2nde à un
	// terminale, donc le classement est calculé classe par classe.
	const genAvecMoy = $derived((data.classementGeneral || []).filter((r) => r.moyenne > 0));
	type LigneClassement = (typeof genAvecMoy)[number];
	const topParClasse = $derived.by(() => {
		// clé de regroupement : identifiant de classe (ou 'sans-classe' si null)
		const parClasse = new Map<string, string>();
		const elevesParCle = new Map<string, LigneClassement[]>();
		for (const r of genAvecMoy) {
			const cle = r.classeId ?? 'sans-classe';
			if (!parClasse.has(cle)) {
				parClasse.set(cle, r.classeNom || 'Classe');
				elevesParCle.set(cle, []);
			}
			elevesParCle.get(cle)!.push(r);
		}
		return [...parClasse.entries()]
			.map(([cle, classeNom]) => ({
				classeId: cle === 'sans-classe' ? null : cle,
				classeNom,
				eleves: [...(elevesParCle.get(cle) ?? [])].sort((a, b) => b.moyenne - a.moyenne).slice(0, 3)
			}))
			.filter((g) => g.eleves.length > 0);
	});
	const flopEleves = $derived([...genAvecMoy].sort((a, b) => a.moyenne - b.moyenne).slice(0, 5));

	// ---- Volume horaire par matière + professeur titulaire ----
	const matiereHeures = $derived.by(() => {
		return matieres.map((m) => {
			const coursMat = listeCours.filter((c) => c.matiereId === m.id);
			const coursIds = coursMat.map((c) => c.id);
			const heures = edtSeances
				.filter((s) => coursIds.includes(s.coursId))
				.reduce((s, x) => s + x.duree, 0);
			const profs = coursMat.map((c) => ({
				nom: c.professeur || 'Non attribué',
				classe: formatClasseNom(
					c.classeId ? classes.find((cl) => cl.id === c.classeId)?.niveau : null,
					classes.find((cl) => cl.id === c.classeId)?.nom
				),
				classeId: c.classeId
			}));
			const coefMoy =
				coursMat.reduce((s, c) => s + c.coefficient, 0) / Math.max(1, coursMat.length);
			return {
				matiere: m,
				heures: round(heures),
				coef: round(coefMoy),
				profs,
				nbClasses: coursMat.length
			};
		});
	});

	const palette = [
		'#3b82f6',
		'#ef4444',
		'#10b981',
		'#f59e0b',
		'#8b5cf6',
		'#ec4899',
		'#14b8a6',
		'#6366f1',
		'#f97316',
		'#0ea5e9'
	];

	// ---- Analyse séparée par classe ----
	type AnalyseClasse = {
		classe: ClasseInfo;
		nb: number;
		moyenne: number;
		taux: number;
		abs: number;
		ret: number;
		inc: number;
		forts: { matiere: { id: string; nom: string; couleur?: string | null }; moy: number }[];
		faiblesses: { matiere: { id: string; nom: string; couleur?: string | null }; moy: number }[];
		classement: (RowEleve & { rang: number })[];
		matrice: {
			matiere: { id: string; nom: string; couleur?: string | null };
			parExamen: {
				examen: ExamenSel;
				val: number;
				sous: { sous: { id: string; nom: string }; val: number }[];
			}[];
			moy: number;
		}[];
	};
	const analysesParClasse = $derived.by<AnalyseClasse[]>(() => {
		const dir = sortDir === 'asc' ? 1 : -1;
		return classes
			.filter((c) => selectedIds.includes(c.id))
			.map((c) => {
				const coursC = coursByClasse.get(c.id) || [];
				const els = eleves.filter((e) => e.classeId === c.id);

				const rows: RowEleve[] = els.map((e) => ({
					eleve: e,
					moy: moyenneGenerale(e, coursC, coursById, selectedExamens),
					absences: e.absences.length,
					retards: e.retards.length,
					incidents: e.incidents.length,
					erreurs: e.incidents.filter((i) => i.type === 'ERREUR').length,
					matieres: new Map(matieres.map((m) => [m.id, moyEleveMatiere(e, m.id)]))
				}));
				rows.sort((a, b) => compareRows(a, b, sortKey, dir));
				const classement = rows.map((x, i) => ({ ...x, rang: i + 1 }));

				// Matrice matière × examen (uniquement les examens de la classe)
				const examensC = selectedOrdered.filter((ex) => ex.classeId === c.id);
				const matrice = matieres.map((m) => {
					const cours = coursC.find((cc) => cc.matiereId === m.id);
					const parExamen = examensC.map((ex) => {
						const val = cours ? moyenneClasseMatiere(els, coursById, cours.id, [ex.id]) : 0;
						const sous = (ex.sousExamens || []).map((s) => {
							let sum = 0;
							let n = 0;
							for (const e of els) {
								const ns = e.notes.filter(
									(nn) => nn.coursId === cours!.id && nn.sousExamenId === s.id
								);
								if (ns.length) {
									sum += round(ns.reduce((t, nn) => t + nn.valeur, 0) / ns.length);
									n++;
								}
							}
							return { sous: s, val: n ? round(sum / n) : 0 };
						});
						return { examen: ex, val, sous };
					});
					const vals = parExamen.map((p) => p.val).filter((v) => v > 0);
					const moy = vals.length ? round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
					return { matiere: m, parExamen, moy };
				});

				// Points forts / faibles de la classe
				const moyMat = matieres
					.map((m) => {
						const cm = coursC.find((cc) => cc.matiereId === m.id);
						return {
							matiere: m,
							moy: cm ? moyenneClasseMatiere(els, coursById, cm.id, selectedExamens) : 0
						};
					})
					.filter((x) => x.moy > 0)
					.sort((a, b) => a.moy - b.moy);
				const forts = [...moyMat].reverse().slice(0, 3);
				const faiblesses = moyMat.slice(0, 3);

				const moyenne = els.length
					? round(classement.reduce((s, x) => s + (x.moy > 0 ? x.moy : 0), 0) / els.length)
					: 0;
				const taux = els.length
					? Math.round((classement.filter((x) => x.moy >= 10).length / els.length) * 100)
					: 0;
				const abs = els.reduce((s, e) => s + e.absences.length, 0);
				const ret = els.reduce((s, e) => s + e.retards.length, 0);
				const inc = els.reduce((s, e) => s + e.incidents.length, 0);

				return {
					classe: c,
					nb: els.length,
					moyenne,
					taux,
					abs,
					ret,
					inc,
					forts,
					faiblesses,
					classement,
					matrice
				};
			});
	});

	// ---- Onglet actif (vue d'ensemble ou une classe) ----
	let activeTab = $state('overview');
	const activeClasse = $derived(
		activeTab === 'overview'
			? null
			: (analysesParClasse.find((ac) => ac.classe.id === activeTab) ?? null)
	);
	$effect(() => {
		if (activeTab !== 'overview' && !selectedIds.includes(activeTab)) activeTab = 'overview';
	});

	// ---- Assiduité des enseignants (heures manquées) ----
	const profAnalyse = $derived.by(() => {
		const map = new Map<
			string,
			{ id: string; nom: string; heures: number; absences: number; partiels: number }
		>();
		for (const a of absencesProf) {
			if (!map.has(a.professeurId))
				map.set(a.professeurId, {
					id: a.professeurId,
					nom: a.professeurNom,
					heures: 0,
					absences: 0,
					partiels: 0
				});
			const p = map.get(a.professeurId)!;
			p.heures += a.heures;
			p.absences++;
		}
		for (const p of pointages) {
			if (p.manque > 0 && p.professeurId) {
				if (!map.has(p.professeurId))
					map.set(p.professeurId, {
						id: p.professeurId,
						nom: '',
						heures: 0,
						absences: 0,
						partiels: 0
					});
				const pr = map.get(p.professeurId)!;
				pr.heures += p.manque;
				pr.partiels++;
			}
		}
		return [...map.values()]
			.map((p) => ({ ...p, heures: round(p.heures) }))
			.sort((a, b) => b.heures - a.heures);
	});

	// ---- Matrice (sous-examens) ----
	let showSousExamens = $state(false);

	// ---- Évaluation /10 des enseignants (année active) ----
	const evaluationsProf = $derived<Record<string, EvaluationProfUI>>(data.evaluationsProf || {});
	type EvaluationProfUI = {
		note: number;
		noteAssiduite: number | null;
		noteReussite: number | null;
		heuresPrevues: number;
		heuresManquees: number;
		nbAbsences: number;
		moyenneEleves: number;
		nbCours: number;
		nbEleves: number;
	};
	function classeNote(n: number): string {
		if (n >= 8) return 'text-emerald-500';
		if (n >= 5) return 'text-amber-500';
		return 'text-destructive';
	}
	function formatNote(n: number): string {
		return n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
	}
</script>

<div class="flex min-h-0 flex-1 flex-col bg-sidebar text-sidebar-foreground">
	<!-- En-tête fixe : titre, filtres, KPIs, onglets -->
	<div class="shrink-0 space-y-3 border-b bg-sidebar p-4">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<div>
				<h1 class="text-xl font-bold">Analyse par niveau</h1>
				<p class="text-xs text-muted-foreground">
					Vue d'ensemble comparative, puis détail matière par matière pour chaque classe.
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-2 text-sm">
				<span
					class="inline-flex items-center gap-1.5 rounded-lg border bg-card/50 px-2.5 py-1"
					title="Moyenne générale des classes sélectionnées"
				>
					<BarChart3 class="size-3.5 text-primary" />
					<span class="font-bold">{formatFr(moyGeneraleClasse)}</span>
					<span class="text-muted-foreground">/20</span>
				</span>
				<span
					class="inline-flex items-center gap-1.5 rounded-lg border bg-card/50 px-2.5 py-1"
					title="Part des élèves avec moyenne ≥ 10"
				>
					<TrendingUp class="size-3.5 text-emerald-500" />
					<span class="font-bold">{tauxReussite}%</span>
					<span class="text-muted-foreground">≥10</span>
				</span>
				<span
					class="inline-flex items-center gap-1.5 rounded-lg border bg-card/50 px-2.5 py-1"
					title="Total absences élèves"
				>
					<AlertTriangle class="size-3.5 text-amber-500" />
					<span class="font-bold">{totalAbsences}</span>
					<span class="text-muted-foreground">abs.</span>
				</span>
				<span
					class="inline-flex items-center gap-1.5 rounded-lg border bg-card/50 px-2.5 py-1"
					title="Total incidents élèves"
				>
					<ShieldAlert class="size-3.5 text-destructive" />
					<span class="font-bold">{totalIncidents}</span>
					<span class="text-muted-foreground">inc.</span>
				</span>
			</div>
		</div>

		<!-- Sélecteur de classes + examens -->
		<div class="space-y-1.5">
			<div class="flex flex-wrap items-center gap-1.5">
				<span
					class="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
					title="Classes affichées"
				>
					<Layers class="size-3.5 shrink-0 text-primary" /> Classes
				</span>
				{#each classes as c (c.id)}
					<button
						type="button"
						onclick={() => toggleClasse(c.id)}
						class="rounded-full border px-2.5 py-1 text-xs transition-colors {selectedIds.includes(
							c.id
						)
							? 'border-primary bg-primary/15 font-medium text-primary'
							: 'border-sidebar-border text-muted-foreground hover:bg-muted/30'}"
					>
						{formatClasseNom(c.niveau, c.nom)}
					</button>
				{/each}
				<Button variant="ghost" size="sm" onclick={() => setClasses(classes.map((c) => c.id))}
					>Toutes</Button
				>
			</div>
			{#if selectedIds.length && listeExamens.length}
				<div class="flex flex-wrap items-center gap-1.5">
					<span
						class="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
						title="Examens inclus dans les moyennes"
					>
						<Filter class="size-3.5 shrink-0 text-primary" /> Examens
					</span>
					<Popover.Root>
						<Popover.Trigger
							class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors {selectedExamens.length ===
							listeExamens.length
								? 'border-primary bg-primary/15 font-medium text-primary'
								: 'border-sidebar-border text-muted-foreground hover:bg-muted/30'}"
							title="Choisir les examens inclus dans les moyennes"
						>
							{selectedExamens.length}<span class="text-muted-foreground"
								>/{listeExamens.length}</span
							>
							<ChevronDown class="size-3.5" />
						</Popover.Trigger>
						<Popover.Content align="start" class="w-80 gap-0 p-0">
							<div class="flex items-center justify-between border-b px-3 py-2">
								<span class="text-sm font-semibold">Examens analysés</span>
								<button
									type="button"
									class="text-xs font-medium text-primary hover:underline"
									onclick={() => (examensChoisis = null)}>Tout sélectionner</button
								>
							</div>
							<div class="max-h-72 overflow-y-auto p-3">
								{#each examensParClasse as groupe (groupe.classeId)}
									<p
										class="mt-3 mb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase first:mt-0"
									>
										{groupe.label}
									</p>
									<div class="space-y-0.5">
										{#each groupe.examens as { ex, label } (ex.id)}
											<button
												type="button"
												onclick={() => toggleExamen(ex.id)}
												title={formatExamenNom(ex)}
												class="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-xs transition-colors hover:bg-muted/50"
											>
												<span
													class="flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors {selectedExamens.includes(
														ex.id
													)
														? 'border-primary bg-primary text-primary-foreground'
														: 'border-input bg-background'}"
												>
													{#if selectedExamens.includes(ex.id)}<Check class="size-3" />{/if}
												</span>
												<span class="min-w-0 flex-1 truncate">{label}</span>
											</button>
										{/each}
									</div>
								{/each}
							</div>
						</Popover.Content>
					</Popover.Root>
					{#if selectedExamens.length < listeExamens.length}
						<Button variant="ghost" size="sm" onclick={() => (examensChoisis = null)}>Tous</Button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Barre d'onglets : vue d'ensemble + une par classe -->
		{#if selectedIds.length}
			<div class="flex items-center gap-1 overflow-x-auto" role="tablist">
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'overview'}
					onclick={() => (activeTab = 'overview')}
					class="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab ===
					'overview'
						? 'bg-primary text-primary-foreground'
						: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
				>
					<BarChart3 class="size-4" /> Vue d'ensemble
				</button>
				{#each analysesParClasse as ac (ac.classe.id)}
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === ac.classe.id}
						onclick={() => (activeTab = ac.classe.id)}
						class="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab ===
						ac.classe.id
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					>
						{formatClasseNom(ac.classe.niveau, ac.classe.nom)}
						<Badge
							variant={activeTab === ac.classe.id ? 'secondary' : 'outline'}
							class="px-1.5 text-[10px]"
						>
							{formatFr(ac.moyenne)}
						</Badge>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Contenu défilant -->
	<div class="flex-1 space-y-4 overflow-y-auto p-4">
		{#if selectedIds.length === 0}
			<CardUI class="p-8 text-center text-muted-foreground"
				>Sélectionnez au moins une classe pour afficher l'analyse.</CardUI
			>
		{:else if activeTab === 'overview'}
			<!-- ==================== VUE D'ENSEMBLE ==================== -->
			<!-- Analyse immédiate : top / à suivre -->
			<div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
				<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
					<p class="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600">
						<TrendingUp class="size-4" /> Top 3 de chaque classe
					</p>
					{#if topParClasse.length}
						<div class="space-y-3">
							{#each topParClasse as g (g.classeId)}
								<div>
									<p
										class="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
									>
										{g.classeNom}
									</p>
									<ul class="space-y-0.5">
										{#each g.eleves as r, i (r.eleveId)}
											<li>
												<button
													type="button"
													class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/50"
													onclick={() => openEleve(r.eleveId)}
												>
													{#if i === 0}
														<Medal class="size-4 shrink-0 text-amber-500" />
													{:else}
														<span class="w-4 shrink-0 text-center text-xs text-muted-foreground"
															>{i + 1}</span
														>
													{/if}
													<span class="min-w-0 flex-1 truncate font-medium">{r.nom} {r.prenom}</span
													>
													<span class="shrink-0 font-bold {moyColor(r.moyenne)}"
														>{formatFr(r.moyenne)}</span
													>
												</button>
											</li>
										{/each}
									</ul>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-xs text-muted-foreground">Aucune moyenne disponible.</p>
					{/if}
				</div>
				<div class="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
					<p class="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
						<AlertTriangle class="size-4" /> Élèves à suivre (moyennes les plus faibles)
					</p>
					{#if flopEleves.length}
						<ul class="space-y-0.5">
							{#each flopEleves as r (r.eleveId)}
								<li>
									<button
										type="button"
										class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/50"
										onclick={() => openEleve(r.eleveId)}
									>
										<Search class="size-3.5 shrink-0 text-muted-foreground" />
										<span class="min-w-0 flex-1 truncate font-medium">{r.nom} {r.prenom}</span>
										<span class="shrink-0 text-xs text-muted-foreground">{r.classeNom}</span>
										<span class="shrink-0 font-bold {moyColor(r.moyenne)}"
											>{formatFr(r.moyenne)}</span
										>
									</button>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-xs text-muted-foreground">Aucune moyenne disponible.</p>
					{/if}
				</div>
			</div>

			<!-- Comparaison des classes -->
			<CardUI class="p-5">
				<h2 class="mb-3 font-semibold">Comparaison des classes</h2>
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div>
						<h3 class="mb-2 text-sm font-medium">Radar par matière</h3>
						{#if data.matieres.length && data.selectedIds.length}
							<div class="h-80">
								<Radar
									data={{
										labels: data.matieres.map((m) => m.nom),
										datasets: data.selectedIds.map((cid, i) => {
											const cls = data.classes.find((c) => c.id === cid);
											const vals = data.matieres.map((m) => {
												const pc = data.comparison.matieres
													.find((x) => x.matiere.id === m.id)
													?.perClasse.find((p) => p.classeId === cid);
												return pc ? pc.moyenne : 0;
											});
											const color = palette[i % palette.length];
											return {
												label: formatClasseNom(cls?.niveau ?? 0, cls?.nom ?? null),
												data: vals,
												borderColor: color,
												backgroundColor: color + '33',
												borderWidth: 2
											};
										})
									}}
									options={{
										responsive: true,
										maintainAspectRatio: false,
										scales: { r: { min: 0, max: 20 } }
									}}
								/>
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">Aucune donnée.</p>
						{/if}
					</div>
					<div>
						<h3 class="mb-2 text-sm font-medium">Classement des classes</h3>
						{#if data.comparison.classes.length}
							<div class="h-80">
								<Bar
									data={{
										labels: data.comparison.classes.map((c) => c.nom),
										datasets: [
											{
												label: 'Moyenne générale /20',
												data: data.comparison.classes.map((c) => c.moyenne),
												backgroundColor: 'rgba(59,130,246,0.6)'
											}
										]
									}}
									options={{
										responsive: true,
										maintainAspectRatio: false,
										scales: { y: { min: 0, max: 20 } }
									}}
								/>
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">Aucune donnée.</p>
						{/if}
					</div>
				</div>
			</CardUI>

			<!-- Évolution de la moyenne globale -->
			<CardUI class="p-5">
				<h2 class="mb-3 font-semibold">Évolution de la moyenne globale par examen</h2>
				{#if data.comparison.evolution.length}
					<div class="h-72">
						<Line
							data={{
								labels: data.comparison.evolution.map((e) => e.nom),
								datasets: [
									{
										label: 'Moyenne générale /20',
										data: data.comparison.evolution.map((e) => e.moyenne),
										borderColor: '#3b82f6',
										backgroundColor: 'rgba(59,130,246,0.1)',
										tension: 0.3,
										fill: true
									}
								]
							}}
							options={{
								responsive: true,
								maintainAspectRatio: false,
								scales: { y: { min: 0, max: 20 } }
							}}
						/>
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">Aucune donnée.</p>
				{/if}
			</CardUI>

			<!-- Classement général (repliable) -->
			<CardUI class="p-0">
				<Collapsible.Root>
					<Collapsible.Trigger
						class="group flex w-full items-center justify-between gap-2 px-5 py-3.5 text-left"
					>
						<span class="flex items-center gap-2 font-semibold">
							<Users class="size-4 text-primary" /> Classement général des élèves
							<span class="text-xs font-normal text-muted-foreground"
								>({genAvecMoy.length} élèves notés)</span
							>
						</span>
						<ChevronDown
							class="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
						/>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<div class="max-h-96 overflow-y-auto px-5 pb-5">
							<div class="overflow-x-auto">
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head class="w-14">Rang</Table.Head>
											<Table.Head>Élève</Table.Head>
											<Table.Head>Classe</Table.Head>
											<Table.Head class="text-center">Moy. gén.</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each genAvecMoy as r (r.eleveId)}
											<Table.Row
												class="cursor-pointer hover:bg-muted/40"
												onclick={() => openEleve(r.eleveId)}
											>
												<Table.Cell class="font-bold">{r.rang}</Table.Cell>
												<Table.Cell class="font-medium">{r.nom} {r.prenom}</Table.Cell>
												<Table.Cell class="text-muted-foreground">{r.classeNom}</Table.Cell>
												<Table.Cell class="text-center font-bold {moyColor(r.moyenne)}"
													>{formatFr(r.moyenne)}</Table.Cell
												>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							</div>
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
			</CardUI>

			<!-- Volume horaire (repliable) -->
			<CardUI class="p-0">
				<Collapsible.Root>
					<Collapsible.Trigger
						class="group flex w-full items-center justify-between gap-2 px-5 py-3.5 text-left"
					>
						<span class="flex items-center gap-2 font-semibold">
							<Clock3 class="size-4 text-primary" /> Volume horaire et professeurs titulaires
						</span>
						<ChevronDown
							class="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
						/>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<div class="overflow-x-auto px-5 pb-5">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head>Matière</Table.Head>
										<Table.Head class="text-center">H./sem.</Table.Head>
										<Table.Head class="text-center">Coef. moy.</Table.Head>
										<Table.Head class="text-center">Classes</Table.Head>
										<Table.Head>Professeur(s) titulaire(s)</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each matiereHeures as mh (mh.matiere.id)}
										<Table.Row>
											<Table.Cell class="font-medium">
												<span class="inline-flex items-center gap-2">
													{#if mh.matiere.couleur}<span
															class="size-2.5 rounded-full"
															style="background-color: {mh.matiere.couleur}"
														></span>{/if}
													{mh.matiere.nom}
												</span>
											</Table.Cell>
											<Table.Cell class="text-center font-bold">{formatFr(mh.heures)}h</Table.Cell>
											<Table.Cell class="text-center">{formatFr(mh.coef)}</Table.Cell>
											<Table.Cell class="text-center">{mh.nbClasses}</Table.Cell>
											<Table.Cell>
												<div class="flex flex-wrap gap-1.5">
													{#each mh.profs as p (p.classeId + p.nom)}
														<span class="rounded-full bg-muted/60 px-2 py-0.5 text-[11px]"
															>{p.nom}<span class="text-muted-foreground"> · {p.classe}</span></span
														>
													{/each}
												</div>
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
			</CardUI>

			<!-- Assiduité des enseignants (repliable) -->
			<CardUI class="p-0">
				<Collapsible.Root>
					<Collapsible.Trigger
						class="group flex w-full items-center justify-between gap-2 px-5 py-3.5 text-left"
					>
						<span class="flex items-center gap-2 font-semibold">
							<Gavel class="size-4 text-amber-500" /> Assiduité des enseignants (heures manquées)
						</span>
						<ChevronDown
							class="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
						/>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<div class="space-y-4 px-5 pb-5">
							{#if profAnalyse.filter((p) => p.nom).length}
								<div class="h-72">
									<Bar
										data={{
											labels: profAnalyse.filter((p) => p.nom).map((p) => p.nom),
											datasets: [
												{
													label: 'Heures manquées',
													data: profAnalyse.filter((p) => p.nom).map((p) => p.heures),
													backgroundColor: 'rgba(245,158,11,0.6)'
												}
											]
										}}
										options={{
											responsive: true,
											maintainAspectRatio: false,
											scales: { y: { beginAtZero: true } }
										}}
									/>
								</div>
								<div class="overflow-x-auto">
									<Table.Root>
										<Table.Header>
											<Table.Row>
												<Table.Head>Enseignant</Table.Head>
												<Table.Head class="text-center">Évaluation</Table.Head>
												<Table.Head class="text-center">H. manquées</Table.Head>
												<Table.Head class="text-center">Absences décl.</Table.Head>
												<Table.Head class="text-center">Heures non complètes</Table.Head>
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{#each profAnalyse.filter((p) => p.nom) as p (p.id)}
												<Table.Row class={p.heures > 0 ? 'bg-destructive/5' : ''}>
													<Table.Cell class="font-medium">{p.nom}</Table.Cell>
													{@const ev = evaluationsProf[p.id]}
													<Table.Cell class="text-center">
														{#if ev}
															<span
																class="font-bold {classeNote(ev.note)}"
																title={`Assiduité ${ev.noteAssiduite?.toFixed(1) ?? '—'}/10 · Réussite élèves ${
																	ev.noteReussite?.toFixed(1) ?? '—'
																}/10 · ${ev.nbCours} cours · ${ev.nbEleves} élèves`}
															>
																{formatNote(ev.note)}<span
																	class="text-[10px] font-normal text-muted-foreground">/10</span
																>
															</span>
														{:else}
															<span class="text-xs text-muted-foreground">—</span>
														{/if}
													</Table.Cell>
													<Table.Cell
														class="text-center font-bold {p.heures > 0
															? 'text-destructive'
															: 'text-emerald-500'}">{formatFr(p.heures)}h</Table.Cell
													>
													<Table.Cell class="text-center">{p.absences}</Table.Cell>
													<Table.Cell class="text-center">{p.partiels}</Table.Cell>
												</Table.Row>
											{/each}
										</Table.Body>
									</Table.Root>
								</div>
							{:else}
								<p class="text-sm text-muted-foreground">
									Aucune absence d'enseignant declarée pour ces classes.
								</p>
							{/if}
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
			</CardUI>
		{:else if activeClasse}
			{@const ac = activeClasse}
			<!-- ==================== DÉTAIL D'UNE CLASSE ==================== -->
			<CardUI class="p-5">
				<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
					<div>
						<h2 class="text-lg font-semibold">
							{formatClasseNom(ac.classe.niveau, ac.classe.nom)}
						</h2>
						{#if ac.classe.titulaire}
							<p class="text-xs text-muted-foreground">Prof titulaire : {ac.classe.titulaire}</p>
						{/if}
					</div>
					<div class="flex flex-wrap gap-2 text-sm">
						<span class="inline-flex items-center gap-1.5 rounded-lg border bg-card/50 px-2.5 py-1"
							><span class="font-bold {moyColor(ac.moyenne)}">{formatFr(ac.moyenne)}</span>
							<span class="text-muted-foreground">/20 moy.</span></span
						>
						<span class="inline-flex items-center gap-1.5 rounded-lg border bg-card/50 px-2.5 py-1"
							><span class="font-bold text-emerald-600">{ac.taux}%</span>
							<span class="text-muted-foreground">réussite</span></span
						>
						<span class="inline-flex items-center gap-1.5 rounded-lg border bg-card/50 px-2.5 py-1"
							><span class="font-bold text-amber-500">{ac.abs}</span>
							<span class="text-muted-foreground">abs.</span></span
						>
						<span class="inline-flex items-center gap-1.5 rounded-lg border bg-card/50 px-2.5 py-1"
							><span class="font-bold text-orange-500">{ac.ret}</span>
							<span class="text-muted-foreground">ret.</span></span
						>
						<span class="inline-flex items-center gap-1.5 rounded-lg border bg-card/50 px-2.5 py-1"
							><span class="font-bold text-destructive">{ac.inc}</span>
							<span class="text-muted-foreground">inc.</span></span
						>
					</div>
				</div>

				<!-- Points forts / faibles de la classe -->
				<div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
					<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
						<p class="mb-2 text-sm font-semibold text-emerald-600">Points forts</p>
						{#if ac.forts.length}
							<ul class="space-y-1">
								{#each ac.forts as m (m.matiere.id)}
									<li class="flex items-center justify-between text-sm">
										<span>{m.matiere.nom}</span><span class="font-bold text-emerald-500"
											>{formatFr(m.moy)}/20</span
										>
									</li>
								{/each}
							</ul>
						{:else}<p class="text-xs text-muted-foreground">Pas de moyenne.</p>{/if}
					</div>
					<div class="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
						<p class="mb-2 text-sm font-semibold text-destructive">Points faibles</p>
						{#if ac.faiblesses.length}
							<ul class="space-y-1">
								{#each ac.faiblesses as m (m.matiere.id)}
									<li class="flex items-center justify-between text-sm">
										<span>{m.matiere.nom}</span><span class="font-bold text-destructive"
											>{formatFr(m.moy)}/20</span
										>
									</li>
								{/each}
							</ul>
						{:else}<p class="text-xs text-muted-foreground">Pas de moyenne.</p>{/if}
					</div>
				</div>
			</CardUI>

			<!-- Classement de la classe -->
			<CardUI class="p-5">
				<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
					<h3 class="font-semibold">Classement ({ac.nb} élèves)</h3>
					<div class="flex flex-wrap items-center gap-2">
						<div class="relative w-48">
							<Search
								class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
							/>
							<Input placeholder="Rechercher un élève..." bind:value={searchEleve} class="pl-8" />
						</div>
						<select
							class="rounded-md border border-sidebar-border bg-card px-2 py-1.5 text-sm"
							value={sortKey}
							onchange={(e) => (sortKey = e.currentTarget.value)}
						>
							<option value="moy">Moyenne générale</option>
							<option value="nom">Nom</option>
							<option value="abs">Absences</option>
							<option value="err">Erreurs</option>
							{#each matieres as m (m.id)}
								<option value={m.id}>{m.nom}</option>
							{/each}
						</select>
						<Button variant="outline" size="sm" onclick={() => requestSort(sortKey)}>
							{sortDir === 'desc' ? '↓ Décroissant' : '↑ Croissant'}
						</Button>
					</div>
				</div>
				<div class="overflow-x-auto">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-14">Rang</Table.Head>
								<Table.Head>
									<button
										type="button"
										class="inline-flex items-center gap-1 hover:text-foreground"
										onclick={() => requestSort('nom')}
									>
										Élève {#if sortKey === 'nom'}{sortDir === 'asc' ? '↑' : '↓'}{/if}
									</button>
								</Table.Head>
								<Table.Head class="text-center">
									<button
										type="button"
										class="inline-flex items-center gap-1 hover:text-foreground"
										onclick={() => requestSort('moy')}
									>
										Moy. gén. {#if sortKey === 'moy'}{sortDir === 'asc' ? '↑' : '↓'}{/if}
									</button>
								</Table.Head>
								{#if sortMatiere}
									<Table.Head class="text-center">Note {sortMatiere.nom}</Table.Head>
								{/if}
								<Table.Head class="text-center">
									<button
										type="button"
										class="inline-flex items-center gap-1 hover:text-foreground"
										onclick={() => requestSort('abs')}
									>
										Abs. {#if sortKey === 'abs'}{sortDir === 'asc' ? '↑' : '↓'}{/if}
									</button>
								</Table.Head>
								<Table.Head class="text-center">Ret.</Table.Head>
								<Table.Head class="text-center">
									<button
										type="button"
										class="inline-flex items-center gap-1 hover:text-foreground"
										onclick={() => requestSort('err')}
									>
										Err. {#if sortKey === 'err'}{sortDir === 'asc' ? '↑' : '↓'}{/if}
									</button>
								</Table.Head>
								<Table.Head class="text-center">Inc.</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each ac.classement.filter((r) => matchSearch(r.eleve)) as r (r.eleve.id)}
								<Table.Row
									class="cursor-pointer py-1 hover:bg-muted/40"
									onclick={() => openEleve(r.eleve.id)}
								>
									<Table.Cell class="font-bold">
										<span class="inline-flex items-center gap-1">
											{#if r.rang <= 3}
												<Medal class="size-3.5 text-amber-500" />
											{/if}
											{r.rang}
										</span>
									</Table.Cell>
									<Table.Cell class="py-1.5 font-medium">
										{r.eleve.nom}
										{r.eleve.prenom}
										{#if r.eleve.im}<span class="ml-1.5 text-[11px] text-muted-foreground"
												>{r.eleve.im}</span
											>{/if}
									</Table.Cell>
									<Table.Cell class="text-center font-bold {moyColor(r.moy)}"
										>{r.moy > 0 ? formatFr(r.moy) : '—'}</Table.Cell
									>
									{#if sortMatiere}
										<Table.Cell class="text-center font-bold text-primary">
											{(r.matieres.get(sortKey as string) || 0) > 0
												? formatFr(r.matieres.get(sortKey as string) || 0)
												: '—'}
										</Table.Cell>
									{/if}
									<Table.Cell class="text-center">{r.absences}</Table.Cell>
									<Table.Cell class="text-center">{r.retards}</Table.Cell>
									<Table.Cell
										class="text-center {r.erreurs > 0 ? 'font-bold text-destructive' : ''}"
										>{r.erreurs}</Table.Cell
									>
									<Table.Cell class="text-center">{r.incidents}</Table.Cell>
								</Table.Row>
							{:else}
								<Table.Row
									><Table.Cell
										colspan={sortMatiere ? 8 : 7}
										class="py-6 text-center text-muted-foreground">Aucun élève trouvé.</Table.Cell
									></Table.Row
								>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</CardUI>

			<!-- Matrice matière × examen de la classe (repliable) -->
			<CardUI class="p-0">
				<Collapsible.Root>
					<Collapsible.Trigger
						class="group flex w-full items-center justify-between gap-2 px-5 py-3.5 text-left"
					>
						<span class="flex items-center gap-2 font-semibold">
							<BarChart3 class="size-4 text-primary" /> Notes par matière et par examen
						</span>
						<ChevronDown
							class="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
						/>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<div class="px-5 pb-5">
							<label class="mb-2 flex w-fit items-center gap-2 text-xs text-muted-foreground">
								<input type="checkbox" bind:checked={showSousExamens} class="accent-primary" />
								Afficher les sous-examens
							</label>
							<div class="overflow-x-auto">
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head>Matière</Table.Head>
											{#each ac.matrice[0]?.parExamen ?? [] as pe (pe.examen.id)}
												<Table.Head class="text-center">{formatExamenNom(pe.examen)}</Table.Head>
												{#if showSousExamens}
													{#each pe.sous as s (s.sous.id)}
														<Table.Head class="text-center text-[11px] text-muted-foreground"
															>{s.sous.nom}</Table.Head
														>
													{/each}
												{/if}
											{/each}
											<Table.Head class="text-center">Moy.</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each ac.matrice as row (row.matiere.id)}
											<Table.Row>
												<Table.Cell class="font-medium">
													<span class="inline-flex items-center gap-2">
														{#if row.matiere.couleur}<span
																class="size-2.5 rounded-full"
																style="background-color: {row.matiere.couleur}"
															></span>{/if}
														{row.matiere.nom}
													</span>
												</Table.Cell>
												{#each row.parExamen as pe (pe.examen.id)}
													<Table.Cell class="text-center {pe.val === 0 ? 'opacity-40' : ''}"
														>{pe.val > 0 ? formatFr(pe.val) : '—'}</Table.Cell
													>
													{#if showSousExamens}
														{#each pe.sous as su (su.sous.id)}
															<Table.Cell
																class="text-center text-[11px] {su.val === 0 ? 'opacity-40' : ''}"
																>{su.val > 0 ? formatFr(su.val) : '—'}</Table.Cell
															>
														{/each}
													{/if}
												{/each}
												<Table.Cell class="text-center font-bold {moyColor(row.moy)}"
													>{formatFr(row.moy)}</Table.Cell
												>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							</div>
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
			</CardUI>
		{:else}
			<CardUI class="p-8 text-center text-muted-foreground">Sélectionnez une classe.</CardUI>
		{/if}
	</div>

	<Drawer.Root bind:open={drawerOpen} direction="right">
		<Drawer.Portal>
			<Drawer.Overlay class="fixed inset-0 z-[130] bg-black/40" />
			<Drawer.Content
				class="fixed inset-y-0 right-0 z-[131] flex w-full flex-col bg-background shadow-lg sm:max-w-md"
			>
				<div class="flex items-center justify-between border-b p-4">
					<Drawer.Title class="text-base font-semibold">Fiche élève</Drawer.Title>
					<Drawer.Close class="rounded-md p-1 hover:bg-muted">
						<X class="size-4" />
					</Drawer.Close>
				</div>
				<div class="flex-1 overflow-y-auto">
					<EleveFiche detail={eleveDetail} loading={eleveLoading} />
				</div>
			</Drawer.Content>
		</Drawer.Portal>
	</Drawer.Root>
</div>
