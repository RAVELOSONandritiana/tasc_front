<script lang="ts">
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { TrendingUp, TrendingDown, BarChart3, Users, CalendarClock, AlertTriangle, Gavel, ShieldAlert, Star, Clock3 } from '@lucide/svelte';
	import { formatClasseNom, formatExamenNom } from '$lib/utils';
	import type { Cours, Examen } from '$lib/types/Materiel.type';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	type EleveAnalyse = {
		id: string;
		nom: string;
		prenom: string;
		sexe: string | null;
		im: string | null;
		situation: string;
		dateNaissance: string;
		notes: { id: string; valeur: number; coefficient: number; coursId: string; examenId: string | null; sousExamenId: string | null }[];
		absences: { id: string; date: string; justifie: boolean; motif: string | null }[];
		retards: { id: string; date: string; duree: string; justifie: boolean; motif: string | null }[];
	};

	const listeCours = $state<Cours[]>([...(data.listeCours || [])]);
	const listeExamens = $state<Examen[]>([...(data.listeExamens || [])]);
	const eleves = $state<EleveAnalyse[]>([...(data.eleves || [])]);
	const incidentsByEleve = $state<Record<string, { INFO: number; ERREUR: number; NOTE: number; ABSENT: number; total: number }>>(
		data.incidentsByEleve || {}
	);
	const edtSeances = $state<{ coursId: string; jour: string; heureDebut: string; heureFin: string; duree: number }[]>(
		data.edtSeances || []
	);
	const seanceCours = $state<
		{ id: string; coursId: string; professeurId: string | null; statut: string; dateDebut: string; dateFin: string | null }[]
	>(data.seanceCours || []);

	let searchEleve = $state('');

	// Examen selection (par défaut tous)
	let selectedExamens = $state<string[]>(listeExamens.map((e) => e.id));

	const selectedOrdered = $derived(listeExamens.filter((e) => selectedExamens.includes(e.id)));
	const selectedSet = $derived(new Set(selectedExamens));

	function toggleExamen(id: string) {
		if (selectedExamens.includes(id)) {
			if (selectedExamens.length > 1) selectedExamens = selectedExamens.filter((x) => x !== id);
		} else {
			selectedExamens = [...selectedExamens, id];
		}
	}

	const coursById = $derived(
		listeCours.reduce(
			(acc, c) => {
				acc[c.id] = c;
				return acc;
			},
			{} as Record<string, Cours>
		)
	);

	function getCoef(coursId: string): number {
		return coursById[coursId]?.coefficient || 0;
	}
	function estParticipant(coursId: string, eleveId: string): boolean {
		const p = coursById[coursId]?.participants || [];
		return p.length === 0 || p.includes(eleveId);
	}

	function round(v: number): number {
		return Math.round(v * 100) / 100;
	}
	function formatFr(v: number): string {
		return (Number.isInteger(v) ? v.toString() : v.toFixed(2)).replace('.', ',');
	}

	function dureeHeures(heureDebut: string, heureFin: string): number {
		const [dh, dm] = heureDebut.split(':').map(Number);
		const [fh, fm] = heureFin.split(':').map(Number);
		const diff = fh * 60 + (fm || 0) - (dh * 60 + (dm || 0));
		return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
	}

	// Volume horaire hebdomadaire par matière (emploi du temps)
	const heuresParCours = $derived.by(() => {
		const map = new Map<string, number>();
		for (const s of edtSeances) {
			map.set(s.coursId, (map.get(s.coursId) || 0) + (s.duree || 0));
		}
		return listeCours.map((c) => ({ cours: c, heures: map.get(c.id) || 0 }));
	});

	const totalHeuresSemaine = $derived(
		Math.round(heuresParCours.reduce((s, x) => s + x.heures, 0) * 100) / 100
	);

	function heuresSemaineEleve(eleveId: string): number {
		return Math.round(
			heuresParCours
				.filter((x) => estParticipant(x.cours.id, eleveId))
				.reduce((s, x) => s + x.heures, 0) * 100
		) / 100;
	}

	// Points forts / faiblesses de la classe (matières les mieux/mal réussies)
	const classeForts = $derived.by(() => {
		const avecMoy = moyParMatiere.filter((m) => m.moy > 0);
		const tri = [...avecMoy].sort((a, b) => a.moy - b.moy);
		return {
			faiblesses: tri.slice(0, 3),
			forts: [...tri].reverse().slice(0, 3)
		};
	});

	function pointFortEleve(eleve: EleveAnalyse): { nom: string; moy: number } | null {
		let best: { nom: string; moy: number } | null = null;
		for (const c of listeCours) {
			if (!estParticipant(c.id, eleve.id)) continue;
			const m = moyMatiere(eleve, c.id, selectedExamens);
			if (m > 0 && (!best || m > best.moy)) best = { nom: c.nom, moy: m };
		}
		return best;
	}

	// Distribution des incidents de la classe
	const incidentDistribution = $derived.by(() => {
		const acc = { INFO: 0, ERREUR: 0, NOTE: 0, ABSENT: 0, total: 0 };
		for (const id of Object.keys(incidentsByEleve)) {
			const v = incidentsByEleve[id];
			acc.INFO += v.INFO;
			acc.ERREUR += v.ERREUR;
			acc.NOTE += v.NOTE;
			acc.ABSENT += v.ABSENT;
			acc.total += v.total;
		}
		return acc;
	});

	const totalIncidents = $derived(incidentDistribution.total);

	// ---- Assiduité des enseignants ----
	const profAnalyse = $derived.by(() => {
		const profCours = new Map<string, { id: string; nom: string; coursIds: string[] }>();
		for (const c of listeCours) {
			const pid = c.professeurId || '';
			if (!pid) continue;
			if (!profCours.has(pid)) {
				profCours.set(pid, { id: pid, nom: c.professeur || 'Professeur', coursIds: [] });
			}
			profCours.get(pid)!.coursIds.push(c.id);
		}
		const profs = [...profCours.values()].map((p) => {
			const coursIds = new Set(p.coursIds);
			const seancesEDT = edtSeances.filter((s) => coursIds.has(s.coursId));
			const heuresPrevues = Math.round(seancesEDT.reduce((s, x) => s + (x.duree || 0), 0) * 100) / 100;
			const seancesCours = seanceCours.filter((s) => coursIds.has(s.coursId));
			const effectuees = seancesCours.filter((s) => s.statut === 'TERMINE');
			const enCours = seancesCours.filter((s) => s.statut === 'EN_COURS');
			let heuresEffectuees = 0;
			for (const s of effectuees) {
				if (s.dateFin) heuresEffectuees += dureeHeures(s.dateDebut, s.dateFin);
			}
			heuresEffectuees = Math.round(heuresEffectuees * 100) / 100;
			let semaines = 1;
			const dates = effectuees.map((s) => new Date(s.dateDebut).getTime()).filter((t) => !Number.isNaN(t));
			if (dates.length > 0) {
				const min = Math.min(...dates);
				const max = Math.max(...dates, Date.now());
				const jours = Math.max(1, Math.ceil((max - min) / (1000 * 3600 * 24)));
				semaines = Math.max(1, Math.round(jours / 7));
			}
			const heuresAttendues = Math.round(heuresPrevues * semaines * 100) / 100;
			const taux = heuresAttendues > 0 ? heuresEffectuees / heuresAttendues : 1;
			const manque = heuresAttendues - heuresEffectuees;
			const alert = heuresAttendues > 0 && (taux < 0.8 || enCours.length > 0);
			return {
				id: p.id,
				nom: p.nom,
				heuresPrevues,
				seancesPrevues: seancesEDT.length,
				seancesEffectuees: effectuees.length,
				seancesEnCours: enCours.length,
				heuresEffectuees,
				semaines,
				heuresAttendues,
				manque: Math.round(manque * 100) / 100,
				taux: Math.round(taux * 100),
				alert
			};
		});
		return profs.sort((a, b) => a.taux - b.taux);
	});

	function moyMatiere(eleve: EleveAnalyse, coursId: string, examenIds: string[]): number {
		const ns = eleve.notes.filter(
			(n) => n.coursId === coursId && n.examenId && examenIds.includes(n.examenId)
		);
		if (ns.length === 0) return 0;
		let tot = 0;
		let coef = 0;
		for (const n of ns) {
			const c = getCoef(n.coursId) || n.coefficient;
			tot += n.valeur * c;
			coef += c;
		}
		return coef > 0 ? round(tot / coef) : 0;
	}

	function moyGenerale(eleve: EleveAnalyse, examenIds: string[]): number {
		let tot = 0;
		let coef = 0;
		for (const cours of listeCours) {
			if (!estParticipant(cours.id, eleve.id)) continue;
			const m = moyMatiere(eleve, cours.id, examenIds);
			if (m > 0) {
				tot += m * getCoef(cours.id);
				coef += getCoef(cours.id);
			}
		}
		return coef > 0 ? round(tot / coef) : 0;
	}

	function moyClasseMatiere(coursId: string, examenIds: string[]): number {
		let sum = 0;
		let n = 0;
		for (const e of eleves) {
			if (!estParticipant(coursId, e.id)) continue;
			const m = moyMatiere(e, coursId, examenIds);
			if (m > 0) {
				sum += m;
				n++;
			}
		}
		return n > 0 ? round(sum / n) : 0;
	}

	function moyClasseExamen(examenId: string): number {
		let sum = 0;
		let n = 0;
		for (const e of eleves) {
			const m = moyGenerale(e, [examenId]);
			if (m > 0) {
				sum += m;
				n++;
			}
		}
		return n > 0 ? round(sum / n) : 0;
	}

	// Moyenne annuelle par élève (tous les examens sélectionnés)
	const moyParEleve = $derived(
		eleves.map((e) => ({
			eleve: e,
			moy: selectedOrdered.length ? moyGenerale(e, selectedExamens) : 0
		}))
	);

	const classeAvgAnnuelle = $derived(
		moyParEleve.length
			? round(moyParEleve.reduce((s, x) => s + (x.moy > 0 ? x.moy : 0), 0) / moyParEleve.length)
			: 0
	);

	const tauxReussite = $derived(
		moyParEleve.length
			? Math.round((moyParEleve.filter((x) => x.moy >= 10).length / moyParEleve.length) * 100)
			: 0
	);

	const totalAbsences = $derived(eleves.reduce((s, e) => s + e.absences.length, 0));
	const totalJustifiees = $derived(
		eleves.reduce((s, e) => s + e.absences.filter((a) => a.justifie).length, 0)
	);
	const totalRetards = $derived(eleves.reduce((s, e) => s + e.retards.length, 0));

	// Évolution : moyenne de la classe par examen
	const evolutionClasse = $derived(
		selectedOrdered.map((ex) => ({ examen: ex, moy: moyClasseExamen(ex.id) }))
	);

	// Meilleur élève (moyenne) par examen
	function topElevesParExamen(examenId: string, limit = 3) {
		return [...eleves]
			.map((e) => ({ eleve: e, moy: moyGenerale(e, [examenId]) }))
			.filter((x) => x.moy > 0)
			.sort((a, b) => b.moy - a.moy)
			.slice(0, limit);
	}

	// Évolution par élève (% entre premier et dernier examen sélectionné)
	function evolutionEleve(e: EleveAnalyse): number {
		if (selectedOrdered.length < 2) return 0;
		const first = moyGenerale(e, [selectedOrdered[0].id]);
		const last = moyGenerale(e, [selectedOrdered[selectedOrdered.length - 1].id]);
		if (first <= 0) return last > 0 ? 100 : 0;
		return round(((last - first) / first) * 100);
	}

	// Classement (rang) par moyenne annuelle
	const classement = $derived(
		[...moyParEleve]
			.map((x, i) => ({ ...x, rang: 0 }))
			.sort((a, b) => b.moy - a.moy)
			.map((x, i) => ({ ...x, rang: i + 1 }))
	);

	const rangParEleveId = $derived(new Map(classement.map((x) => [x.eleve.id, x.rang])));

	// Distribution des notes (tous examens sélectionnés)
	const notesDistribution = $derived.by(() => {
		const buckets = [
			{ range: '0-2', min: 0, max: 2, count: 0 },
			{ range: '2-4', min: 2, max: 4, count: 0 },
			{ range: '4-6', min: 4, max: 6, count: 0 },
			{ range: '6-8', min: 6, max: 8, count: 0 },
			{ range: '8-10', min: 8, max: 10, count: 0 },
			{ range: '10-12', min: 10, max: 12, count: 0 },
			{ range: '12-14', min: 12, max: 14, count: 0 },
			{ range: '14-16', min: 14, max: 16, count: 0 },
			{ range: '16-18', min: 16, max: 18, count: 0 },
			{ range: '18-20', min: 18, max: 20, count: 0 }
		];
		for (const e of eleves) {
			for (const n of e.notes) {
				if (n.examenId && selectedSet.has(n.examenId)) {
					for (const b of buckets) {
						if (n.valeur >= b.min && n.valeur < (b.max === 20 ? 20.0001 : b.max)) b.count++;
					}
				}
			}
		}
		return buckets;
	});

	// Moyenne par matière (classe, tous examens sélectionnés)
	const moyParMatiere = $derived(
		listeCours.map((c) => ({
			cours: c,
			moy: selectedOrdered.length ? moyClasseMatiere(c.id, selectedExamens) : 0
		}))
	);

	// Absences par mois
	const absencesParMois = $derived.by(() => {
		const map = new Map<string, { total: number; justifie: number }>();
		for (const e of eleves) {
			for (const a of e.absences) {
				const mois = a.date.slice(0, 7);
				if (!map.has(mois)) map.set(mois, { total: 0, justifie: 0 });
				const v = map.get(mois)!;
				v.total++;
				if (a.justifie) v.justifie++;
			}
		}
		return [...map.entries()]
			.map(([mois, v]) => ({ mois, ...v }))
			.sort((a, b) => a.mois.localeCompare(b.mois));
	});

	// Tableau matières x examens (triable par moyenne globale)
	let matiereSortDir = $state<'asc' | 'desc'>('desc');
	const matiereRows = $derived(
		moyParMatiere
			.map((m) => {
				const parExamen = selectedOrdered.map((ex) => ({
					examen: ex,
					moy: moyClasseMatiere(m.cours.id, [ex.id])
				}));
				const globale =
					parExamen.reduce((s, x) => s + (x.moy > 0 ? x.moy : 0), 0) /
					(parExamen.filter((x) => x.moy > 0).length || 1);
				return { ...m, parExamen, globale: round(globale) };
			})
			.sort((a, b) => (matiereSortDir === 'desc' ? b.globale - a.globale : a.globale - b.globale))
	);

	// Tableau classement (triable)
	type SortKey = 'nom' | 'moy' | 'rang' | 'evolution' | 'absences' | 'retards' | 'incidents' | 'heures';
	let sortKey = $state<SortKey>('moy');
	let sortDir = $state<'asc' | 'desc'>('desc');

	const tableRows = $derived.by(() => {
		const rows = classement.map((x) => ({
			eleve: x.eleve,
			moy: x.moy,
			rang: x.rang,
			evolution: evolutionEleve(x.eleve),
			absences: x.eleve.absences.length,
			justifiees: x.eleve.absences.filter((a) => a.justifie).length,
			retards: x.eleve.retards.length,
			incidents: incidentsByEleve[x.eleve.id]?.total || 0,
			heures: heuresSemaineEleve(x.eleve.id),
			situation: x.eleve.situation
		}));
		const filtered = rows.filter(
			(r) =>
				`${r.eleve.nom} ${r.eleve.prenom}`.toLowerCase().includes(searchEleve.toLowerCase()) ||
				(r.eleve.im || '').toLowerCase().includes(searchEleve.toLowerCase())
		);
		const dir = sortDir === 'asc' ? 1 : -1;
		filtered.sort((a, b) => {
			let av: number | string;
			let bv: number | string;
			if (sortKey === 'nom') {
				av = `${a.eleve.nom} ${a.eleve.prenom}`;
				bv = `${b.eleve.nom} ${b.eleve.prenom}`;
				return (av as string).localeCompare(bv as string, 'fr') * dir;
			}
			av = (a as any)[sortKey] as number;
			bv = (b as any)[sortKey] as number;
			return ((av as number) - (bv as number)) * dir;
		});
		return filtered;
	});

	function setSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = key === 'nom' ? 'asc' : 'desc';
		}
	}

	// Top 5 élèves pour le graphique d'évolution individuelle
	const top5 = $derived([...classement].slice(0, 5).map((x) => x.eleve));

	const palette = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

	// ---- Helpers graphiques SVG ----
	function linePath(points: { x: number; y: number }[]): string {
		if (!points.length) return '';
		return points
			.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
			.join(' ');
	}

	const lineChartVM = {
		W: 640,
		H: 280,
		padL: 42,
		padR: 18,
		padT: 18,
		padB: 46,
		minY: 0,
		maxY: 20
	};
	function buildLineSeries(
		labels: string[],
		series: { name: string; color: string; values: number[] }[]
	) {
		const { W, H, padL, padR, padT, padB, minY, maxY } = lineChartVM;
		const plotW = W - padL - padR;
		const plotH = H - padT - padB;
		const xFor = (i: number) =>
			labels.length <= 1 ? padL + plotW / 2 : padL + (plotW * i) / (labels.length - 1);
		const yFor = (v: number) => padT + plotH * (1 - (v - minY) / (maxY - minY));
		return series.map((s) => ({
			...s,
			points: s.values.map((v, i) => ({ x: xFor(i), y: yFor(v), v }))
		}));
	}

	function buildBars(labels: string[], values: number[], colors?: string[]) {
		const W = 640;
		const H = 280;
		const padL = 42;
		const padR = 18;
		const padT = 18;
		const padB = 46;
		const plotW = W - padL - padR;
		const plotH = H - padT - padB;
		const maxY = Math.max(1, ...values);
		const n = labels.length || 1;
		const slot = plotW / n;
		const barW = Math.min(60, slot * 0.6);
		return labels.map((lab, i) => {
			const h = (values[i] / maxY) * plotH;
			return {
				label: lab,
				value: values[i],
				x: padL + slot * i + (slot - barW) / 2,
				y: padT + plotH - h,
				h,
				color: colors ? colors[i % colors.length] : '#3b82f6'
			};
		});
	}

	const evolutionSeries = $derived(
		buildLineSeries(
			selectedOrdered.map((e) => formatExamenNom(e)),
			[
				{
					name: 'Moyenne classe',
					color: '#3b82f6',
					values: evolutionClasse.map((x) => x.moy)
				},
				{
					name: 'Meilleur élève',
					color: '#10b981',
					values: selectedOrdered.map((ex) => {
						const t = topElevesParExamen(ex.id, 1);
						return t.length ? t[0].moy : 0;
					})
				}
			]
		)
	);

	const matiereBars = $derived(
		buildBars(
			moyParMatiere.map((m) => m.cours.nom),
			moyParMatiere.map((m) => m.moy)
		)
	);

	const distBars = $derived(
		buildBars(
			notesDistribution.map((b) => b.range),
			notesDistribution.map((b) => b.count)
		)
	);

	const absencesBars = $derived(
		buildBars(
			absencesParMois.map((a) => a.mois),
			absencesParMois.map((a) => a.total)
		)
	);

	const top5Series = $derived(
		buildLineSeries(
			selectedOrdered.map((e) => formatExamenNom(e)),
			top5.map((e, i) => ({
				name: `${e.nom} ${e.prenom}`,
				color: palette[i % palette.length],
				values: selectedOrdered.map((ex) => moyGenerale(e, [ex.id]))
			}))
		)
	);
</script>

<div class="flex min-h-0 flex-1 flex-col bg-sidebar text-sidebar-foreground">
	<div class="flex-1 overflow-y-auto p-4 space-y-6">
		<div class="flex flex-col gap-2">
			<h1 class="text-2xl font-bold">Analyse de la classe</h1>
			<p class="text-sm text-muted-foreground">
				{data.classe ? formatClasseNom(data.classe.niveau, data.classe.nom) : ''}
				{data.classe?.anneeScolaire ? ` · ${data.classe.anneeScolaire.nom}` : ''}
				— vue complète : performances, absences, retards, incidents, points forts, volume
				horaire et assiduité des enseignants.
			</p>
		</div>

		{#if listeExamens.length === 0}
			<CardUI class="p-8 text-center">
				<p class="text-muted-foreground">Aucun examen n'a encore été créé pour cette classe.</p>
			</CardUI>
		{:else}
			<!-- Sélection des examens -->
			<CardUI class="p-4">
				<div class="mb-2 flex items-center gap-2">
					<CalendarClock class="size-4 text-primary" />
					<span class="text-sm font-semibold">Examens analysés</span>
				</div>
				<div class="flex flex-wrap gap-2">
					{#each listeExamens as ex (ex.id)}
						<button
							type="button"
							onclick={() => toggleExamen(ex.id)}
							class="rounded-full border px-3 py-1 text-xs transition-colors {selectedExamens.includes(ex.id)
								? 'border-primary bg-primary/15 text-primary'
								: 'border-sidebar-border text-muted-foreground hover:bg-muted/30'}"
						>
							{formatExamenNom(ex)}
						</button>
					{/each}
				</div>
			</CardUI>

			<!-- KPIs -->
			<div class="grid grid-cols-2 gap-3 lg:grid-cols-6">
				<CardUI class="p-4">
					<div class="flex items-center gap-2 text-muted-foreground">
						<Users class="size-4" /><span class="text-xs">Élèves</span>
					</div>
					<p class="mt-1 text-2xl font-bold">{eleves.length}</p>
				</CardUI>
				<CardUI class="p-4">
					<div class="flex items-center gap-2 text-muted-foreground">
						<BarChart3 class="size-4" /><span class="text-xs">Moy. classe</span>
					</div>
					<p class="mt-1 text-2xl font-bold">{formatFr(classeAvgAnnuelle)}/20</p>
				</CardUI>
				<CardUI class="p-4">
					<div class="flex items-center gap-2 text-muted-foreground">
						<TrendingUp class="size-4 text-emerald-500" /><span class="text-xs">Réussite ≥10</span>
					</div>
					<p class="mt-1 text-2xl font-bold">{tauxReussite}%</p>
				</CardUI>
				<CardUI class="p-4">
					<div class="flex items-center gap-2 text-muted-foreground">
						<AlertTriangle class="size-4 text-amber-500" /><span class="text-xs">Absences</span>
					</div>
					<p class="mt-1 text-2xl font-bold">{totalAbsences}</p>
					<p class="text-[11px] text-muted-foreground">{totalJustifiees} justifiées</p>
				</CardUI>
				<CardUI class="p-4">
					<div class="flex items-center gap-2 text-muted-foreground">
						<CalendarClock class="size-4 text-orange-500" /><span class="text-xs">Retards</span>
					</div>
					<p class="mt-1 text-2xl font-bold">{totalRetards}</p>
				</CardUI>
				<CardUI class="p-4">
					<div class="flex items-center gap-2 text-muted-foreground">
						<ShieldAlert class="size-4 text-destructive" /><span class="text-xs">Incidents</span>
					</div>
					<p class="mt-1 text-2xl font-bold">{totalIncidents}</p>
				</CardUI>
			</div>

			<!-- Incidents de la classe -->
			<CardUI class="p-5">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="font-semibold">Incidents & comportements</h2>
					<span class="text-sm text-muted-foreground">{totalIncidents} au total</span>
				</div>
				{#if totalIncidents > 0}
					<div class="flex flex-wrap gap-3">
						{#each [{ k: 'NOTE', label: 'Notes positives', c: 'text-emerald-500', bg: 'bg-emerald-500/15' }, { k: 'INFO', label: 'Infos', c: 'text-sky-500', bg: 'bg-sky-500/15' }, { k: 'ABSENT', label: 'Absences signalées', c: 'text-orange-500', bg: 'bg-orange-500/15' }, { k: 'ERREUR', label: 'Erreurs / fautes', c: 'text-destructive', bg: 'bg-destructive/15' }] as t (t.k)}
							<div class="flex min-w-32 flex-1 items-center gap-3 rounded-lg border border-sidebar-border p-3 {t.bg}">
								<div class="text-2xl font-bold {t.c}">{incidentDistribution[t.k as keyof typeof incidentDistribution]}</div>
								<div class="text-xs text-muted-foreground">{t.label}</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">Aucun incident enregistré pour cette classe cette année.</p>
				{/if}
			</CardUI>

			<!-- Points forts / faiblesses de la classe -->
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<CardUI class="p-5">
					<h2 class="mb-3 flex items-center gap-2 font-semibold">
						<Star class="size-4 text-emerald-500" /> Points forts de la classe
					</h2>
					{#if classeForts.forts.length}
						<ul class="space-y-2">
							{#each classeForts.forts as m (m.cours.id)}
								<li class="flex items-center justify-between rounded-md border border-sidebar-border p-2">
									<span class="text-sm font-medium">{m.cours.nom}</span>
									<span class="font-bold text-emerald-500">{formatFr(m.moy)}/20</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-sm text-muted-foreground">Pas encore de moyenne par matière.</p>
					{/if}
				</CardUI>
				<CardUI class="p-5">
					<h2 class="mb-3 flex items-center gap-2 font-semibold">
						<ShieldAlert class="size-4 text-destructive" /> Points faibles de la classe
					</h2>
					{#if classeForts.faiblesses.length}
						<ul class="space-y-2">
							{#each classeForts.faiblesses as m (m.cours.id)}
								<li class="flex items-center justify-between rounded-md border border-sidebar-border p-2">
									<span class="text-sm font-medium">{m.cours.nom}</span>
									<span class="font-bold text-destructive">{formatFr(m.moy)}/20</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-sm text-muted-foreground">Pas encore de moyenne par matière.</p>
					{/if}
				</CardUI>
			</div>

			<!-- Volume horaire hebdomadaire -->
			<CardUI class="p-5">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="flex items-center gap-2 font-semibold">
						<Clock3 class="size-4 text-primary" /> Volume horaire hebdomadaire
					</h2>
					<span class="text-sm text-muted-foreground">Total : {formatFr(totalHeuresSemaine)} h / semaine</span>
				</div>
				{#if heuresParCours.some((h) => h.heures > 0)}
					<svg viewBox="0 0 640 280" class="h-auto w-full">
						{#each heuresParCours.filter((h) => h.heures > 0) as b, i (b.cours.id)}
							{@const maxY = Math.max(...heuresParCours.map((x) => x.heures), 1)}
							{@const W = 640}
							{@const H = 280}
							{@const padL = 42}
							{@const padR = 18}
							{@const padT = 18}
							{@const padB = 46}
							{@const plotW = W - padL - padR}
							{@const plotH = H - padT - padB}
							{@const n = heuresParCours.filter((x) => x.heures > 0).length}
							{@const slot = plotW / n}
							{@const barW = Math.min(54, slot * 0.6)}
							{@const h = (b.heures / maxY) * plotH}
							{@const x = padL + slot * i + (slot - barW) / 2}
							{@const y = padT + plotH - h}
							<rect x={x} y={y} width={barW} height={Math.max(h, 1)} fill="#8b5cf6" rx="3" opacity="0.85" />
							<text x={x + barW / 2} y={y - 5} text-anchor="middle" class="fill-foreground text-[10px] font-semibold">{formatFr(b.heures)}h</text>
							<text x={x + barW / 2} y={H - padB + 16} text-anchor="middle" class="fill-muted-foreground text-[10px]">{b.cours.nom}</text>
						{/each}
					</svg>
				{:else}
					<p class="text-sm text-muted-foreground">Aucun emploi du temps défini pour cette classe.</p>
				{/if}
			</CardUI>

			<!-- Assiduité des enseignants -->
			<CardUI class="p-5">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="flex items-center gap-2 font-semibold">
						<Gavel class="size-4 text-amber-500" /> Assiduité des enseignants
					</h2>
					<span class="text-sm text-muted-foreground">Heures prévues / réalisées</span>
				</div>
				{#if profAnalyse.length}
					<div class="overflow-x-auto">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Enseignant</Table.Head>
									<Table.Head class="text-center">H./sem. prévues</Table.Head>
									<Table.Head class="text-center">Séances faites</Table.Head>
									<Table.Head class="text-center">H. réalisées</Table.Head>
									<Table.Head class="text-center">Taux</Table.Head>
									<Table.Head class="text-center">Statut</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each profAnalyse as p (p.id)}
									<Table.Row class={p.alert ? 'bg-destructive/5' : ''}>
										<Table.Cell class="font-medium">{p.nom}</Table.Cell>
										<Table.Cell class="text-center">{formatFr(p.heuresPrevues)}h</Table.Cell>
										<Table.Cell class="text-center">
											{p.seancesEffectuees}{p.seancesEnCours > 0 ? ` (+${p.seancesEnCours} en cours)` : ''}
											<span class="text-[11px] text-muted-foreground"> / {p.seancesPrevues}</span>
										</Table.Cell>
										<Table.Cell class="text-center">
											{formatFr(p.heuresEffectuees)}h
											{#if p.manque > 0}<span class="text-[11px] text-destructive"> (−{formatFr(p.manque)}h)</span>{/if}
										</Table.Cell>
										<Table.Cell class="text-center">
											<span class="font-bold {p.taux < 80 ? 'text-destructive' : 'text-emerald-500'}">{p.taux}%</span>
										</Table.Cell>
										<Table.Cell class="text-center">
											{#if p.alert}
												<span class="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">À surveiller</span>
											{:else}
												<span class="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-500">Assidu</span>
											{/if}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">Aucun enseignant attribué à cette classe.</p>
				{/if}
			</CardUI>

			<!-- Évolution de la classe -->
			<CardUI class="p-5">
				<h2 class="mb-3 font-semibold">Évolution de la moyenne de la classe par examen</h2>
				{#if evolutionSeries[0]?.points.length}
					<svg viewBox="0 0 640 280" class="h-auto w-full">
						{#each [0, 5, 10, 15, 20] as grid}
							{@const y = lineChartVM.padT + (lineChartVM.H - lineChartVM.padT - lineChartVM.padB) * (1 - grid / 20)}
							<line x1={lineChartVM.padL} y1={y} x2={640 - lineChartVM.padR} y2={y} stroke="currentColor" class="text-sidebar-border" stroke-width="1" />
							<text x={lineChartVM.padL - 6} y={y + 4} text-anchor="end" class="fill-muted-foreground text-[10px]">{grid}</text>
						{/each}
						{#each evolutionSeries as s (s.name)}
							<path d={linePath(s.points)} fill="none" stroke={s.color} stroke-width="2.5" />
							{#each s.points as p (p.x)}
								<circle cx={p.x} cy={p.y} r="3" fill={s.color} />
							{/each}
						{/each}
						{#each selectedOrdered as ex, i (ex.id)}
							{@const x = evolutionSeries[0].points[i]?.x}
							{#if x !== undefined}
								<text x={x} y={280 - lineChartVM.padB + 16} text-anchor="middle" class="fill-muted-foreground text-[10px]">{formatExamenNom(ex)}</text>
							{/if}
						{/each}
					</svg>
					<div class="mt-2 flex gap-4">
						{#each evolutionSeries as s (s.name)}
							<div class="flex items-center gap-2 text-xs">
								<span class="h-2.5 w-2.5 rounded-full" style="background-color: {s.color}"></span>
								<span class="text-muted-foreground">{s.name}</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">Aucune donnée de note disponible.</p>
				{/if}
			</CardUI>

			<!-- Deux graphiques : matières + distribution -->
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<CardUI class="p-5">
					<h2 class="mb-3 font-semibold">Moyenne par matière (classe)</h2>
					{#if matiereBars.length}
						<svg viewBox="0 0 640 280" class="h-auto w-full">
							{#each [0, 5, 10, 15, 20] as grid}
								{@const y = 18 + (280 - 18 - 46) * (1 - grid / 20)}
								<line x1="42" y1={y} x2="622" y2={y} stroke="currentColor" class="text-sidebar-border" stroke-width="1" />
								<text x="36" y={y + 4} text-anchor="end" class="fill-muted-foreground text-[10px]">{grid}</text>
							{/each}
							{#each matiereBars as b (b.label)}
								<rect x={b.x} y={b.y} width={b.h === 0 ? 0 : Math.max(b.h, 1)} height={b.h} fill={b.color} rx="3" opacity="0.85" />
								<text x={b.x + 15} y={b.y - 5} text-anchor="middle" class="fill-foreground text-[10px] font-semibold">{b.value > 0 ? formatFr(b.value) : ''}</text>
								<text x={b.x + 15} y={280 - 46 + 16} text-anchor="middle" class="fill-muted-foreground text-[10px]">{b.label}</text>
							{/each}
						</svg>
					{:else}
						<p class="text-sm text-muted-foreground">Aucune donnée.</p>
					{/if}
				</CardUI>

				<CardUI class="p-5">
					<h2 class="mb-3 font-semibold">Distribution des notes</h2>
					{#if distBars.some((b) => b.value > 0)}
						<svg viewBox="0 0 640 280" class="h-auto w-full">
							{#each distBars as b (b.label)}
								<rect x={b.x} y={b.y} width={b.h === 0 ? 0 : Math.max(b.h, 1)} height={b.h} fill="#3b82f6" rx="3" opacity="0.85" />
								<text x={b.x + 15} y={b.y - 5} text-anchor="middle" class="fill-foreground text-[10px] font-semibold">{b.value}</text>
								<text x={b.x + 15} y={280 - 46 + 16} text-anchor="middle" class="fill-muted-foreground text-[10px]">{b.label}</text>
							{/each}
						</svg>
					{:else}
						<p class="text-sm text-muted-foreground">Aucune note saisie.</p>
					{/if}
				</CardUI>
			</div>

			<!-- Tableau matières x examens -->
			<CardUI class="p-5">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="font-semibold">Moyennes par matière et par examen</h2>
					<Button variant="outline" size="sm" onclick={() => (matiereSortDir = matiereSortDir === 'desc' ? 'asc' : 'desc')}>
						Trier par moyenne {matiereSortDir === 'desc' ? '↓' : '↑'}
					</Button>
				</div>
				<div class="overflow-x-auto">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Matière</Table.Head>
								{#each selectedOrdered as ex (ex.id)}
									<Table.Head class="text-center">{formatExamenNom(ex)}</Table.Head>
								{/each}
								<Table.Head class="text-center">Moyenne</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each matiereRows as row (row.cours.id)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.cours.nom}</Table.Cell>
									{#each row.parExamen as pe (pe.examen.id)}
										<Table.Cell class="text-center {pe.moy === 0 ? 'opacity-40' : ''}">
											{pe.moy > 0 ? formatFr(pe.moy) : '—'}
										</Table.Cell>
									{/each}
									<Table.Cell class="text-center font-bold">{formatFr(row.globale)}</Table.Cell>
								</Table.Row>
							{:else}
								<Table.Row>
									<Table.Cell colspan={selectedOrdered.length + 2} class="py-6 text-center text-muted-foreground">
										Aucune matière.
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</CardUI>

			<!-- Meilleur élève par examen -->
			<CardUI class="p-5">
				<h2 class="mb-3 font-semibold">Meilleur(s) élève(s) par examen</h2>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each selectedOrdered as ex (ex.id)}
						{@const tops = topElevesParExamen(ex.id, 3)}
						<div class="rounded-lg border border-sidebar-border p-3">
							<p class="mb-2 text-sm font-semibold">{formatExamenNom(ex)}</p>
							{#if tops.length === 0}
								<p class="text-xs text-muted-foreground">Aucune note.</p>
							{:else}
								<ol class="space-y-1">
									{#each tops as t, i (t.eleve.id)}
										<li class="flex items-center justify-between text-sm">
											<span class="flex items-center gap-2">
												<span class="flex size-5 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">{i + 1}</span>
												{t.eleve.nom} {t.eleve.prenom}
											</span>
											<span class="font-bold">{formatFr(t.moy)}</span>
										</li>
									{/each}
								</ol>
							{/if}
						</div>
					{/each}
				</div>
			</CardUI>

			<!-- Évolution individuelle top 5 -->
			<CardUI class="p-5">
				<h2 class="mb-3 font-semibold">Évolution des 5 meilleurs élèves par examen</h2>
				{#if top5Series[0]?.points.length}
					<svg viewBox="0 0 640 280" class="h-auto w-full">
						{#each [0, 5, 10, 15, 20] as grid}
							{@const y = lineChartVM.padT + (lineChartVM.H - lineChartVM.padT - lineChartVM.padB) * (1 - grid / 20)}
							<line x1={lineChartVM.padL} y1={y} x2={640 - lineChartVM.padR} y2={y} stroke="currentColor" class="text-sidebar-border" stroke-width="1" />
							<text x={lineChartVM.padL - 6} y={y + 4} text-anchor="end" class="fill-muted-foreground text-[10px]">{grid}</text>
						{/each}
						{#each top5Series as s (s.name)}
							<path d={linePath(s.points)} fill="none" stroke={s.color} stroke-width="2" />
							{#each s.points as p (p.x)}
								<circle cx={p.x} cy={p.y} r="2.5" fill={s.color} />
							{/each}
						{/each}
						{#each selectedOrdered as ex, i (ex.id)}
							{@const x = top5Series[0].points[i]?.x}
							{#if x !== undefined}
								<text x={x} y={280 - lineChartVM.padB + 16} text-anchor="middle" class="fill-muted-foreground text-[10px]">{formatExamenNom(ex)}</text>
							{/if}
						{/each}
					</svg>
					<div class="mt-2 flex flex-wrap gap-3">
						{#each top5Series as s (s.name)}
							<div class="flex items-center gap-2 text-xs">
								<span class="h-2.5 w-2.5 rounded-full" style="background-color: {s.color}"></span>
								<span class="text-muted-foreground">{s.name}</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">Aucune donnée.</p>
				{/if}
			</CardUI>

			<!-- Absences -->
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<CardUI class="p-5">
					<h2 class="mb-3 font-semibold">Absences par mois</h2>
					{#if absencesBars.length}
						<svg viewBox="0 0 640 280" class="h-auto w-full">
							{#each absencesBars as b (b.label)}
								<rect x={b.x} y={b.y} width={b.h === 0 ? 0 : Math.max(b.h, 1)} height={b.h} fill="#f59e0b" rx="3" opacity="0.85" />
								<text x={b.x + 15} y={b.y - 5} text-anchor="middle" class="fill-foreground text-[10px] font-semibold">{b.value}</text>
								<text x={b.x + 15} y={280 - 46 + 16} text-anchor="middle" class="fill-muted-foreground text-[10px]">{b.label}</text>
							{/each}
						</svg>
					{:else}
						<p class="text-sm text-muted-foreground">Aucune absence enregistrée.</p>
					{/if}
				</CardUI>

				<CardUI class="p-5">
					<h2 class="mb-3 font-semibold">Récapitulatif des absences</h2>
					<div class="space-y-2">
						<div class="flex items-center justify-between rounded-md border border-sidebar-border p-3">
							<span class="text-sm">Total absences</span>
							<span class="text-lg font-bold">{totalAbsences}</span>
						</div>
						<div class="flex items-center justify-between rounded-md border border-sidebar-border p-3">
							<span class="text-sm">Justifiées</span>
							<span class="text-lg font-bold text-emerald-500">{totalJustifiees}</span>
						</div>
						<div class="flex items-center justify-between rounded-md border border-sidebar-border p-3">
							<span class="text-sm">Non justifiées</span>
							<span class="text-lg font-bold text-destructive">{totalAbsences - totalJustifiees}</span>
						</div>
						<div class="flex items-center justify-between rounded-md border border-sidebar-border p-3">
							<span class="text-sm">Total retards</span>
							<span class="text-lg font-bold text-orange-500">{totalRetards}</span>
						</div>
					</div>
				</CardUI>
			</div>

			<!-- Tableau classement triable -->
			<CardUI class="p-5">
				<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
					<h2 class="font-semibold">Classement des élèves</h2>
					<div class="w-48">
						<Input placeholder="Rechercher un élève..." bind:value={searchEleve} />
					</div>
				</div>
				<div class="overflow-x-auto">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>
									<button class="flex items-center gap-1" onclick={() => setSort('nom')}>
										Élève {sortKey === 'nom' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
									</button>
								</Table.Head>
								<Table.Head class="text-center">
									<button class="flex items-center justify-center gap-1" onclick={() => setSort('moy')}>
										Moyenne {sortKey === 'moy' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
									</button>
								</Table.Head>
								<Table.Head class="text-center">
									<button class="flex items-center justify-center gap-1" onclick={() => setSort('rang')}>
										Rang {sortKey === 'rang' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
									</button>
								</Table.Head>
								<Table.Head class="text-center">
									<button class="flex items-center justify-center gap-1" onclick={() => setSort('evolution')}>
										Évolution {sortKey === 'evolution' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
									</button>
								</Table.Head>
								<Table.Head class="text-center">
									<button class="flex items-center justify-center gap-1" onclick={() => setSort('absences')}>
										Absences {sortKey === 'absences' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
									</button>
								</Table.Head>
							<Table.Head class="text-center">
								<button class="flex items-center justify-center gap-1" onclick={() => setSort('retards')}>
									Retards {sortKey === 'retards' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
								</button>
							</Table.Head>
							<Table.Head class="text-center">
								<button class="flex items-center justify-center gap-1" onclick={() => setSort('incidents')}>
									Incidents {sortKey === 'incidents' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
								</button>
							</Table.Head>
							<Table.Head class="text-center">
								<button class="flex items-center justify-center gap-1" onclick={() => setSort('heures')}>
									H./sem. {sortKey === 'heures' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
								</button>
							</Table.Head>
							<Table.Head class="text-center">Point fort</Table.Head>
							<Table.Head class="text-center">Situation</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each tableRows as r (r.eleve.id)}
							<Table.Row>
								<Table.Cell class="font-medium">
									{r.eleve.nom} {r.eleve.prenom}
									{#if r.eleve.im}<span class="block text-[11px] text-muted-foreground">{r.eleve.im}</span>{/if}
								</Table.Cell>
								<Table.Cell class="text-center font-bold">{r.moy > 0 ? formatFr(r.moy) : '—'}</Table.Cell>
								<Table.Cell class="text-center">{r.rang}</Table.Cell>
								<Table.Cell class="text-center">
									{#if selectedOrdered.length >= 2}
										<span class="inline-flex items-center gap-1 {r.evolution >= 0 ? 'text-emerald-500' : 'text-destructive'}">
											{#if r.evolution >= 0}<TrendingUp class="size-3.5" />{:else}<TrendingDown class="size-3.5" />{/if}
											{Math.abs(r.evolution)}%
										</span>
									{:else}
										—
									{/if}
								</Table.Cell>
								<Table.Cell class="text-center">
									{r.absences}
									<span class="text-[11px] text-muted-foreground">({r.justifiees})</span>
								</Table.Cell>
								<Table.Cell class="text-center">{r.retards}</Table.Cell>
								<Table.Cell class="text-center">
									<span class="font-bold {r.incidents > 0 ? 'text-destructive' : 'text-emerald-500'}">{r.incidents}</span>
								</Table.Cell>
								<Table.Cell class="text-center">{formatFr(r.heures)}h</Table.Cell>
								<Table.Cell class="text-center">
									{@const pf = pointFortEleve(r.eleve)}
									{#if pf}
										<span class="text-xs font-semibold text-emerald-600">{pf.nom} ({formatFr(pf.moy)})</span>
									{:else}
										<span class="text-xs text-muted-foreground">—</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-center">
									<span class="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{r.situation}</span>
								</Table.Cell>
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell colspan={11} class="py-6 text-center text-muted-foreground">
									Aucun élève.
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
					</Table.Root>
				</div>
				<p class="mt-2 text-xs text-muted-foreground">
					L'évolution est calculée en % entre le premier et le dernier examen sélectionné.
					Cliquez sur un en-tête pour trier.
				</p>
			</CardUI>
		{/if}
	</div>
</div>
