<script lang="ts">
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { Input } from '$lib/components/ui/input';
	import {
		Users,
		BarChart3,
		TrendingUp,
		TrendingDown,
		AlertTriangle,
		Star,
		Clock3,
		UserX,
		Gavel,
		ShieldAlert,
		Filter,
		Layers
	} from '@lucide/svelte';
	import { formatClasseNom, formatExamenNom } from '$lib/utils';
	import { goto } from '$app/navigation';
	import {
		type AnalyseNote,
		type AnalyseCoursLite,
		type AnalyseEleveBase,
		moyenneMatiere,
		moyenneGenerale,
		moyenneClasseMatiere,
		estParticipant,
		formatFr,
		round
	} from '$lib/utils/analyse';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	type ClasseInfo = {
		id: string;
		nom: string | null;
		niveau: number;
		serie: string | null;
		titulaireId: string | null;
		titulaire: string | null;
	};
	type CoursSel = AnalyseCoursLite & { classeId: string };
	type ExamenSel = { id: string; nom: string; date: string; classeId: string; periode?: string; sousExamens: { id: string; nom: string; examenId: string }[] };
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
		{ id: string; classeId: string; coursId: string; jour: string; heureDebut: string; heureFin: string; duree: number }[]
	>(data.edtSeances || []);
	const eleves = $derived<EleveSel[]>(data.eleves || []);
	const absencesProf = $derived<
		{ id: string; professeurId: string; professeurNom: string; coursId: string | null; coursNom: string; classeId: string | null; date: string; heures: number; justifie: boolean }[]
	>(data.absencesProf || []);
	const pointages = $derived<
		{ id: string; coursId: string; professeurId: string | null; heuresPrevues: number | null; heuresEffectuees: number; manque: number }[]
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
	const selectedSet = $derived(new Set(selectedExamens));
	const selectedOrdered = $derived(listeExamens.filter((e) => selectedExamens.includes(e.id)));

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
		const cours = listeCours.find((c) => c.classeId === eleve.classeId && c.matiereId === matiereId);
		if (!cours) return 0;
		return moyenneMatiere(eleve.notes, coursById, cours.id, selectedExamens);
	}
	function moyClasseMatiereParClasse(classeId: string, matiereId: string): number | null {
		const cours = listeCours.find((c) => c.classeId === classeId && c.matiereId === matiereId);
		if (!cours) return null;
		const els = eleves.filter((e) => e.classeId === classeId);
		return moyenneClasseMatiere(els, coursById, cours.id, selectedExamens);
	}
	function moyGlobaleMatiere(matiereId: string): number {
		const els = eleves.filter((e) => listeCours.some((c) => c.classeId === e.classeId && c.matiereId === matiereId));
		if (!els.length) return 0;
		let sum = 0;
		let n = 0;
		for (const e of els) {
			const v = moyEleveMatiere(e, matiereId);
			if (v > 0) {
				sum += v;
				n++;
			}
		}
		return n ? round(sum / n) : 0;
	}

	function moyGeneraleEleve(eleve: EleveSel): number {
		return moyenneGenerale(eleve, coursByClasse.get(eleve.classeId ?? '') || [], coursById, selectedExamens);
	}

	// ---- Classement des élèves ----
	type SortKey = 'nom' | 'moy' | string; // string = matiereId
	let sortKey = $state<SortKey>('moy');
	let sortDir = $state<'asc' | 'desc'>('desc');
	let searchEleve = $state('');

	const classement = $derived.by(() => {
		const rows = eleves.map((e) => ({
			eleve: e,
			moy: moyGeneraleEleve(e),
			absences: e.absences.length,
			retards: e.retards.length,
			incidents: e.incidents.length,
			erreurs: e.incidents.filter((i) => i.type === 'ERREUR').length,
			matieres: new Map(matieres.map((m) => [m.id, moyEleveMatiere(e, m.id)]))
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
			if (sortKey === 'moy') {
				av = a.moy;
				bv = b.moy;
			} else {
				av = a.matieres.get(sortKey as string) || 0;
				bv = b.matieres.get(sortKey as string) || 0;
			}
			return ((av as number) - (bv as number)) * dir;
		});
		return filtered.map((x, i) => ({ ...x, rang: i + 1 }));
	});

	function setSort(key: SortKey) {
		sortKey = key;
	}
	function toggleDir() {
		sortDir = sortDir === 'asc' ? 'desc' : 'asc';
	}
	// Matière utilisée pour le tri (si le tri se fait par matière).
	const sortMatiere = $derived(matieres.find((m) => m.id === sortKey) ?? null);

	// ---- Indicateurs ----
	const nbEleves = $derived(eleves.length);
	const moyGeneraleClasse = $derived(
		nbEleves ? round(classement.reduce((s, x) => s + (x.moy > 0 ? x.moy : 0), 0) / nbEleves) : 0
	);
	const tauxReussite = $derived(
		nbEleves ? Math.round((classement.filter((x) => x.moy >= 10).length / nbEleves) * 100) : 0
	);
	const totalAbsences = $derived(eleves.reduce((s, e) => s + e.absences.length, 0));
	const totalRetards = $derived(eleves.reduce((s, e) => s + e.retards.length, 0));
	const totalIncidents = $derived(eleves.reduce((s, e) => s + e.incidents.length, 0));

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
				classe: formatClasseNom(c.classeId ? classes.find((cl) => cl.id === c.classeId)?.niveau : null, classes.find((cl) => cl.id === c.classeId)?.nom),
				classeId: c.classeId
			}));
			const coefMoy =
				coursMat.reduce((s, c) => s + c.coefficient, 0) / Math.max(1, coursMat.length);
			return { matiere: m, heures: round(heures), coef: round(coefMoy), profs, nbClasses: coursMat.length };
		});
	});

	// ---- Points forts / faibles (moyenne globale par matière) ----
	const classeForts = $derived.by(() => {
		const avecMoy = matiereHeures
			.map((mh) => ({ matiere: mh.matiere, moy: moyGlobaleMatiere(mh.matiere.id) }))
			.filter((m) => m.moy > 0);
		const tri = [...avecMoy].sort((a, b) => a.moy - b.moy);
		return { faiblesses: tri.slice(0, 3), forts: [...tri].reverse().slice(0, 3) };
	});

	// ---- Matrice matière × examen (moyenne de classe) ----
	let showSousExamens = $state(false);
	const matrice = $derived.by(() => {
		return matieres.map((m) => {
			const parExamen = selectedOrdered.map((ex) => {
				const cours = listeCours.find((c) => c.classeId === ex.classeId && c.matiereId === m.id);
				const val = cours ? moyenneClasseMatiere(eleves.filter((e) => e.classeId === ex.classeId), coursById, cours.id, [ex.id]) : 0;
				const sous = (ex.sousExamens || []).map((s) => {
					const v = cours
						? (() => {
								const els = eleves.filter((e) => e.classeId === ex.classeId);
								let sum = 0;
								let n = 0;
								for (const e of els) {
									const ns = e.notes.filter((nn) => nn.coursId === cours.id && nn.sousExamenId === s.id);
									if (ns.length) {
										const moy = round(ns.reduce((t, nn) => t + nn.valeur, 0) / ns.length);
										sum += moy;
										n++;
									}
								}
								return n ? round(sum / n) : 0;
							})()
						: 0;
					return { sous: s, val: v };
				});
				return { examen: ex, val, sous };
			});
			return { matiere: m, parExamen };
		});
	});

	// ---- Évolution de la moyenne globale par examen ----
	const evolutionClasse = $derived(
		selectedOrdered.map((ex) => {
			let sum = 0;
			let n = 0;
			for (const e of eleves) {
				const m = moyGeneraleEleve2(e, [ex.id]);
				if (m > 0) {
					sum += m;
					n++;
				}
			}
			return { examen: ex, moy: n ? round(sum / n) : 0 };
		})
	);
	function moyGeneraleEleve2(eleve: EleveSel, examenIds: string[]): number {
		return moyenneGenerale(eleve, coursByClasse.get(eleve.classeId ?? '') || [], coursById, examenIds);
	}

	// ---- Sélection des matières pour le graphe de comparaison (un seul graphe) ----
	let matieresComparees = $state<string[] | null>(null);
	const matieresCompareesList = $derived(matieresComparees ?? matieres.map((m) => m.id));
	function toggleMatiereCompare(id: string) {
		const courant = matieresCompareesList;
		if (courant.includes(id)) {
			if (courant.length > 1) matieresComparees = courant.filter((x) => x !== id);
		} else {
			matieresComparees = [...courant, id];
		}
	}

	// ---- Comparaison des classes (un seul graphe, matières choisies) ----
	type CompBar = { x: number; y: number; h: number; barW: number; val: number; color: string; classeId: string };
	const compGraph = $derived.by<{
		ms: { id: string; nom: string; couleur?: string | null }[];
		cls: ClasseInfo[];
		bars: CompBar[];
		slot: number;
		plotH: number;
		padT: number;
		padB: number;
		padL: number;
		padR: number;
		chartW: number;
		H: number;
	}>(() => {
		const ms = matieres.filter((m) => matieresCompareesList.includes(m.id));
		const cls = classes.filter((c) => selectedIds.includes(c.id));
		const nG = ms.length || 1;
		const nS = cls.length || 1;
		const slot = (BAR.chartW - BAR.padL - BAR.padR) / nG;
		const innerPad = slot * 0.12;
		const barW = Math.min(BAR.barMax, (slot - innerPad * 2) / nS);
		const totalBarsW = barW * nS;
		const plotH = BAR.H - BAR.padT - BAR.padB;
		const bars: CompBar[] = [];
		ms.forEach((m, gi) => {
			cls.forEach((c, bi) => {
				const val = moyClasseMatiereParClasse(c.id, m.id);
				if (val === null) return;
				const x = BAR.padL + slot * gi + (slot - totalBarsW) / 2 + bi * barW;
				const h = (val / 20) * plotH;
				bars.push({ x, y: BAR.padT + plotH - h, h, barW, val, color: palette[bi % palette.length], classeId: c.id });
			});
		});
		return {
			ms,
			cls,
			bars,
			slot,
			plotH,
			padT: BAR.padT,
			padB: BAR.padB,
			padL: BAR.padL,
			padR: BAR.padR,
			chartW: BAR.chartW,
			H: BAR.H
		};
	});

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
		classement: {
			eleve: EleveSel;
			moy: number;
			rang: number;
			absences: number;
			retards: number;
			incidents: number;
			erreurs: number;
			matieres: Map<string, number>;
		}[];
		matrice: {
			matiere: { id: string; nom: string; couleur?: string | null };
			parExamen: { examen: ExamenSel; val: number; sous: { sous: { id: string; nom: string }; val: number }[] }[];
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

				const rows = els.map((e) => ({
					eleve: e,
					moy: moyenneGenerale(e, coursC, coursById, selectedExamens),
					absences: e.absences.length,
					retards: e.retards.length,
					incidents: e.incidents.length,
					erreurs: e.incidents.filter((i) => i.type === 'ERREUR').length,
					matieres: new Map(matieres.map((m) => [m.id, moyEleveMatiere(e, m.id)]))
				}));
				rows.sort((a, b) => {
					let av: number | string;
					let bv: number | string;
					if (sortKey === 'nom') {
						av = `${a.eleve.nom} ${a.eleve.prenom}`;
						bv = `${b.eleve.nom} ${b.eleve.prenom}`;
						return (av as string).localeCompare(bv as string, 'fr') * dir;
					}
					if (sortKey === 'moy') {
						av = a.moy;
						bv = b.moy;
					} else {
						av = a.matieres.get(sortKey as string) || 0;
						bv = b.matieres.get(sortKey as string) || 0;
					}
					return ((av as number) - (bv as number)) * dir;
				});
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
								const ns = e.notes.filter((nn) => nn.coursId === cours!.id && nn.sousExamenId === s.id);
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
						return { matiere: m, moy: cm ? moyenneClasseMatiere(els, coursById, cm.id, selectedExamens) : 0 };
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

				return { classe: c, nb: els.length, moyenne, taux, abs, ret, inc, forts, faiblesses, classement, matrice };
			});
	});

	// ---- Assiduité des enseignants (heures manquées) ----
	const profAnalyse = $derived.by(() => {
		const map = new Map<string, { id: string; nom: string; heures: number; absences: number; partiels: number }>();
		for (const a of absencesProf) {
			if (!map.has(a.professeurId)) map.set(a.professeurId, { id: a.professeurId, nom: a.professeurNom, heures: 0, absences: 0, partiels: 0 });
			const p = map.get(a.professeurId)!;
			p.heures += a.heures;
			p.absences++;
		}
		for (const p of pointages) {
			if (p.manque > 0 && p.professeurId) {
				if (!map.has(p.professeurId)) map.set(p.professeurId, { id: p.professeurId, nom: '', heures: 0, absences: 0, partiels: 0 });
				const pr = map.get(p.professeurId)!;
				pr.heures += p.manque;
				pr.partiels++;
			}
		}
		return [...map.values()].map((p) => ({ ...p, heures: round(p.heures) })).sort((a, b) => b.heures - a.heures);
	});

	// ---- Graphiques SVG ----
	function linePath(points: { x: number; y: number }[]): string {
		if (!points.length) return '';
		return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
	}
	const lineChartVM = { W: 640, H: 280, padL: 42, padR: 18, padT: 18, padB: 46, minY: 0, maxY: 20 };
	function buildLineSeries(labels: string[], series: { name: string; color: string; values: number[] }[]) {
		const { W, H, padL, padR, padT, padB, minY, maxY } = lineChartVM;
		const plotW = W - padL - padR;
		const plotH = H - padT - padB;
		const xFor = (i: number) => (labels.length <= 1 ? padL + plotW / 2 : padL + (plotW * i) / (labels.length - 1));
		const yFor = (v: number) => padT + plotH * (1 - (v - minY) / (maxY - minY));
		return series.map((s) => ({ ...s, points: s.values.map((v, i) => ({ x: xFor(i), y: yFor(v), v })) }));
	}
	const evolutionSeries = $derived(
		buildLineSeries(
			selectedOrdered.map((e) => formatExamenNom(e)),
			[{ name: 'Moyenne (classes sélectionnées)', color: '#3b82f6', values: evolutionClasse.map((x) => x.moy) }]
		)
	);

	const BAR = { padL: 46, padR: 18, padT: 18, padB: 90, H: 320, chartW: 720, barMax: 40 };
	function buildBars(labels: string[], values: number[], opts?: { maxY?: number; barW?: number; colors?: string[] }) {
		const { padL, padR, padT, padB, H, chartW, barMax } = BAR;
		const plotW = chartW - padL - padR;
		const plotH = H - padT - padB;
		const n = labels.length || 1;
		const slot = plotW / n;
		const barW = Math.min(opts?.barW ?? barMax, slot * 0.8);
		const maxY = opts?.maxY ?? Math.max(1, ...values);
		const bars = labels.map((lab, i) => {
			const h = (values[i] / maxY) * plotH;
			const x = padL + slot * i + (slot - barW) / 2;
			const cx = x + barW / 2;
			return { label: lab, value: values[i], x, y: padT + plotH - h, h, barW, cx, baseY: H - padB + 14, color: opts?.colors ? opts.colors[i % opts.colors.length] : '#3b82f6' };
		});
		return { chartW, H, padL, padR, padT, padB, plotW, plotH, bars };
	}
	const palette = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#f97316', '#0ea5e9'];

	const profBars = $derived(
		buildBars(
			profAnalyse.filter((p) => p.nom).map((p) => p.nom),
			profAnalyse.filter((p) => p.nom).map((p) => p.heures),
			{ colors: profAnalyse.filter((p) => p.nom).map(() => '#f59e0b') }
		)
	);

	function formatDateFr(iso: string): string {
		const [a, m, j] = iso.split('-');
		return j && m && a ? `${j}/${m}/${a}` : iso;
	}
</script>

<div class="flex min-h-0 flex-1 flex-col bg-sidebar text-sidebar-foreground">
	<div class="flex-1 overflow-y-auto p-4 space-y-6">
		<div class="flex flex-col gap-2">
			<h1 class="text-2xl font-bold">Analyse par niveau</h1>
			<p class="text-sm text-muted-foreground">
				Sélectionnez une ou plusieurs classes pour analyser leurs performances croisées : volume
				horaire, professeurs titulaires, notes par matière et par examen, classement et repérage
				des difficultés (élèves comme enseignants).
			</p>
		</div>

		<!-- Sélecteur de classes -->
		<CardUI class="p-4">
			<div class="mb-2 flex items-center justify-between gap-2">
				<div class="flex items-center gap-2">
					<Layers class="size-4 text-primary" />
					<span class="text-sm font-semibold">Classes analysées</span>
					<span class="text-xs text-muted-foreground">({selectedIds.length}/{classes.length})</span>
				</div>
				<div class="flex gap-2">
					<Button variant="outline" size="sm" onclick={() => setClasses(classes.map((c) => c.id))}>Toutes</Button>
					<Button variant="outline" size="sm" onclick={() => setClasses([])}>Aucune</Button>
				</div>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each classes as c (c.id)}
					<button
						type="button"
						onclick={() => toggleClasse(c.id)}
						class="rounded-full border px-3 py-1 text-xs transition-colors {selectedIds.includes(c.id)
							? 'border-primary bg-primary/15 text-primary'
							: 'border-sidebar-border text-muted-foreground hover:bg-muted/30'}"
					>
						{formatClasseNom(c.niveau, c.nom)}
						{#if c.titulaire}<span class="opacity-60">· {c.titulaire}</span>{/if}
					</button>
				{/each}
			</div>
		</CardUI>

		{#if selectedIds.length === 0}
			<CardUI class="p-8 text-center text-muted-foreground">Sélectionnez au moins une classe pour afficher l'analyse.</CardUI>
		{:else}
			<!-- Sélection des examens -->
			<CardUI class="p-4">
				<div class="mb-2 flex items-center gap-2">
					<Filter class="size-4 text-primary" />
					<span class="text-sm font-semibold">Examens pris en compte</span>
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
					<div class="flex items-center gap-2 text-muted-foreground"><Users class="size-4" /><span class="text-xs">Classes</span></div>
					<p class="mt-1 text-2xl font-bold">{selectedIds.length}</p>
				</CardUI>
				<CardUI class="p-4">
					<div class="flex items-center gap-2 text-muted-foreground"><Users class="size-4" /><span class="text-xs">Élèves</span></div>
					<p class="mt-1 text-2xl font-bold">{nbEleves}</p>
				</CardUI>
				<CardUI class="p-4">
					<div class="flex items-center gap-2 text-muted-foreground"><BarChart3 class="size-4" /><span class="text-xs">Moy. gén.</span></div>
					<p class="mt-1 text-2xl font-bold">{formatFr(moyGeneraleClasse)}/20</p>
				</CardUI>
				<CardUI class="p-4">
					<div class="flex items-center gap-2 text-muted-foreground"><TrendingUp class="size-4 text-emerald-500" /><span class="text-xs">Réussite ≥10</span></div>
					<p class="mt-1 text-2xl font-bold">{tauxReussite}%</p>
				</CardUI>
				<CardUI class="p-4">
					<div class="flex items-center gap-2 text-muted-foreground"><AlertTriangle class="size-4 text-amber-500" /><span class="text-xs">Absences</span></div>
					<p class="mt-1 text-2xl font-bold">{totalAbsences}</p>
				</CardUI>
				<CardUI class="p-4">
					<div class="flex items-center gap-2 text-muted-foreground"><ShieldAlert class="size-4 text-destructive" /><span class="text-xs">Incidents</span></div>
					<p class="mt-1 text-2xl font-bold">{totalIncidents}</p>
				</CardUI>
			</div>

			<!-- Volume horaire + professeur titulaire -->
			<CardUI class="p-5">
				<h2 class="mb-3 flex items-center gap-2 font-semibold"><Clock3 class="size-4 text-primary" /> Volume horaire et professeurs titulaires</h2>
				<div class="overflow-x-auto">
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
											{#if mh.matiere.couleur}<span class="size-2.5 rounded-full" style="background-color: {mh.matiere.couleur}"></span>{/if}
											{mh.matiere.nom}
										</span>
									</Table.Cell>
									<Table.Cell class="text-center font-bold">{formatFr(mh.heures)}h</Table.Cell>
									<Table.Cell class="text-center">{formatFr(mh.coef)}</Table.Cell>
									<Table.Cell class="text-center">{mh.nbClasses}</Table.Cell>
									<Table.Cell>
										<div class="flex flex-wrap gap-1.5">
											{#each mh.profs as p (p.classeId + p.nom)}
												<span class="rounded-full bg-muted/60 px-2 py-0.5 text-[11px]">{p.nom}<span class="text-muted-foreground"> · {p.classe}</span></span>
											{/each}
										</div>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</CardUI>

			<!-- Évolution de la moyenne globale -->
			<CardUI class="p-5">
				<h2 class="mb-3 font-semibold">Évolution de la moyenne globale par examen</h2>
				{#if evolutionSeries[0]?.points.length}
					<svg viewBox="0 0 640 280" class="h-72 w-full">
						{#each [0, 5, 10, 15, 20] as grid}
							{@const y = lineChartVM.padT + (lineChartVM.H - lineChartVM.padT - lineChartVM.padB) * (1 - grid / 20)}
							<line x1={lineChartVM.padL} y1={y} x2={640 - lineChartVM.padR} y2={y} stroke="currentColor" class="text-sidebar-border" stroke-width="1" />
							<text x={lineChartVM.padL - 6} y={y + 4} text-anchor="end" class="fill-muted-foreground text-[10px]">{grid}</text>
						{/each}
						{#each evolutionSeries as s (s.name)}
							<path d={linePath(s.points)} fill="none" stroke={s.color} stroke-width="2.5" />
							{#each s.points as p (p.x)}<circle cx={p.x} cy={p.y} r="3" fill={s.color} />{/each}
						{/each}
						{#each selectedOrdered as ex, i (ex.id)}
							{@const x = evolutionSeries[0].points[i]?.x}
							{#if x !== undefined}
								<text x={x} y={280 - lineChartVM.padB + 16} text-anchor="middle" class="fill-muted-foreground text-[10px]">{formatExamenNom(ex)}</text>
							{/if}
						{/each}
					</svg>
				{:else}
					<p class="text-sm text-muted-foreground">Aucune donnée.</p>
				{/if}
			</CardUI>

			<!-- Comparaison des classes (un seul graphe, matières choisies) -->
			<CardUI class="p-5">
				<div class="mb-2 flex flex-wrap items-center justify-between gap-2">
					<h2 class="font-semibold">Comparaison des classes (moyenne par matière)</h2>
					<span class="text-xs text-muted-foreground">
						Choisissez les matières à afficher — tout tient dans un seul graphe.
					</span>
				</div>
				<div class="mb-3 flex flex-wrap gap-2">
					{#each matieres as m (m.id)}
						<button
							type="button"
							onclick={() => toggleMatiereCompare(m.id)}
							class="rounded-full border px-3 py-1 text-xs transition-colors {matieresCompareesList.includes(m.id)
								? 'border-primary bg-primary/15 text-primary'
								: 'border-sidebar-border text-muted-foreground hover:bg-muted/30'}"
						>
							{m.nom}
						</button>
					{/each}
				</div>
				{#if compGraph.bars.length}
					<div class="overflow-x-auto">
						<svg viewBox="0 0 {compGraph.chartW} {compGraph.H}" class="mx-auto block h-auto w-full">
							{#each [0, 5, 10, 15, 20] as grid}
								{@const y = compGraph.padT + compGraph.plotH * (1 - grid / 20)}
								<line x1={compGraph.padL} y1={y} x2={compGraph.chartW - compGraph.padR} y2={y} stroke="currentColor" class="text-sidebar-border" stroke-width="1" />
								<text x={compGraph.padL - 6} y={y + 4} text-anchor="end" class="fill-muted-foreground text-[10px]">{grid}</text>
							{/each}
							{#each compGraph.bars as b (b.x + b.classeId)}
								<rect x={b.x} y={b.y} width={b.barW} height={Math.max(b.h, 1)} fill={b.color} rx="3" opacity="0.85" />
								<text x={b.x + b.barW / 2} y={b.y - 4} text-anchor="middle" class="fill-foreground text-[9px] font-semibold">{formatFr(b.val)}</text>
							{/each}
							{#each compGraph.ms as m, gi (m.id)}
								{@const cx = compGraph.padL + compGraph.slot * gi + compGraph.slot / 2}
								<text transform="rotate(-35 {cx} {compGraph.H - compGraph.padB + 14})" x={cx} y={compGraph.H - compGraph.padB + 14} text-anchor="end" class="fill-muted-foreground text-[10px]">{m.nom}</text>
							{/each}
						</svg>
					</div>
					<div class="mt-2 flex flex-wrap gap-3">
						{#each compGraph.cls as c, i (c.id)}
							<div class="flex items-center gap-2 text-xs">
								<span class="h-2.5 w-2.5 rounded-full" style="background-color: {palette[i % palette.length]}"></span>
								<span class="text-muted-foreground">{formatClasseNom(c.niveau, c.nom)}</span>
								{#if c.titulaire}<span class="text-muted-foreground opacity-70">· {c.titulaire}</span>{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">Aucune note disponible pour la sélection.</p>
				{/if}
			</CardUI>

			<!-- Assiduité des enseignants -->
			<CardUI class="p-5">
				<div class="mb-3 flex items-center gap-2">
					<Gavel class="size-4 text-amber-500" />
					<h2 class="font-semibold">Assiduité des enseignants (heures manquées)</h2>
				</div>
				{#if profAnalyse.filter((p) => p.nom).length}
					<div class="mb-4 overflow-x-auto">
						<svg viewBox="0 0 {profBars.chartW} {profBars.H}" class="mx-auto block h-auto w-full">
							{#each [0, 5, 10, 15, 20] as grid}
								{@const y = profBars.padT + profBars.plotH * (1 - grid / Math.max(1, ...profBars.bars.map((b) => b.value)))}
								<line x1={profBars.padL} y1={y} x2={profBars.chartW - profBars.padR} y2={y} stroke="currentColor" class="text-sidebar-border" stroke-width="1" />
								<text x={profBars.padL - 6} y={y + 4} text-anchor="end" class="fill-muted-foreground text-[10px]">{grid}</text>
							{/each}
							{#each profBars.bars as b (b.label)}
								<rect x={b.x} y={b.y} width={b.barW} height={b.h} fill={b.color} rx="3" opacity="0.85" />
								<text x={b.cx} y={b.y - 5} text-anchor="middle" class="fill-foreground text-[10px] font-semibold">{formatFr(b.value)}h</text>
								<text transform="rotate(-35 {b.cx} {b.baseY})" x={b.cx} y={b.baseY} text-anchor="end" class="fill-muted-foreground text-[10px]">{b.label}</text>
							{/each}
						</svg>
					</div>
					<div class="overflow-x-auto">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Enseignant</Table.Head>
									<Table.Head class="text-center">H. manquées</Table.Head>
									<Table.Head class="text-center">Absences décl.</Table.Head>
									<Table.Head class="text-center">Heures non complètes</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each profAnalyse.filter((p) => p.nom) as p (p.id)}
									<Table.Row class={p.heures > 0 ? 'bg-destructive/5' : ''}>
										<Table.Cell class="font-medium">{p.nom}</Table.Cell>
										<Table.Cell class="text-center font-bold {p.heures > 0 ? 'text-destructive' : 'text-emerald-500'}">{formatFr(p.heures)}h</Table.Cell>
										<Table.Cell class="text-center">{p.absences}</Table.Cell>
										<Table.Cell class="text-center">{p.partiels}</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">Aucune absence d'enseignant declarée pour ces classes.</p>
				{/if}
			</CardUI>

			<!-- Contrôles de tri (appliqués à chaque classe) -->
			<CardUI class="p-4">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h2 class="font-semibold">Analyse détaillée par classe</h2>
					<div class="flex flex-wrap items-center gap-2">
						<div class="w-44">
							<Input placeholder="Rechercher un élève..." bind:value={searchEleve} />
						</div>
						<select
							class="rounded-md border border-sidebar-border bg-card px-2 py-1.5 text-sm"
							value={sortKey}
							onchange={(e) => setSort(e.currentTarget.value)}
						>
							<option value="moy">Moyenne générale</option>
							<option value="nom">Nom</option>
							{#each matieres as m (m.id)}
								<option value={m.id}>{m.nom}</option>
							{/each}
						</select>
						<Button variant="outline" size="sm" onclick={toggleDir}>
							{sortDir === 'desc' ? 'Décroissant ↓' : 'Croissant ↑'}
						</Button>
					</div>
				</div>
			</CardUI>

			{#each analysesParClasse as ac (ac.classe.id)}
				<CardUI class="p-5">
					<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
						<div>
							<h2 class="font-semibold">{formatClasseNom(ac.classe.niveau, ac.classe.nom)}</h2>
							{#if ac.classe.titulaire}
								<p class="text-xs text-muted-foreground">Prof titulaire : {ac.classe.titulaire}</p>
							{/if}
						</div>
						<div class="flex flex-wrap gap-4 text-sm">
							<span><span class="font-bold">{formatFr(ac.moyenne)}</span>/20 moy.</span>
							<span><span class="font-bold">{ac.taux}%</span> réussite</span>
							<span><span class="font-bold text-amber-500">{ac.abs}</span> abs.</span>
							<span><span class="font-bold text-orange-500">{ac.ret}</span> ret.</span>
							<span><span class="font-bold text-destructive">{ac.inc}</span> inc.</span>
						</div>
					</div>

					<!-- Points forts / faibles de la classe -->
					<div class="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
						<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
							<p class="mb-2 text-sm font-semibold text-emerald-600">Points forts</p>
							{#if ac.forts.length}
								<ul class="space-y-1">
									{#each ac.forts as m (m.matiere.id)}
										<li class="flex items-center justify-between text-sm"><span>{m.matiere.nom}</span><span class="font-bold text-emerald-500">{formatFr(m.moy)}/20</span></li>
									{/each}
								</ul>
							{:else}<p class="text-xs text-muted-foreground">Pas de moyenne.</p>{/if}
						</div>
						<div class="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
							<p class="mb-2 text-sm font-semibold text-destructive">Points faibles</p>
							{#if ac.faiblesses.length}
								<ul class="space-y-1">
									{#each ac.faiblesses as m (m.matiere.id)}
										<li class="flex items-center justify-between text-sm"><span>{m.matiere.nom}</span><span class="font-bold text-destructive">{formatFr(m.moy)}/20</span></li>
									{/each}
								</ul>
							{:else}<p class="text-xs text-muted-foreground">Pas de moyenne.</p>{/if}
						</div>
					</div>

					<!-- Classement de la classe -->
					<h3 class="mb-2 text-sm font-semibold">Classement ({ac.nb} élèves)</h3>
					<div class="mb-4 overflow-x-auto">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Rang</Table.Head>
									<Table.Head>Élève</Table.Head>
									<Table.Head class="text-center">Moy. gén.</Table.Head>
									{#if sortMatiere}
										<Table.Head class="text-center">Note {sortMatiere.nom}</Table.Head>
									{/if}
									<Table.Head class="text-center">Absences</Table.Head>
									<Table.Head class="text-center">Retards</Table.Head>
									<Table.Head class="text-center">Erreurs</Table.Head>
									<Table.Head class="text-center">Incidents</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each ac.classement as r (r.eleve.id)}
									<Table.Row class="cursor-pointer hover:bg-muted/40" onclick={() => goto(`/analyse/eleve/${r.eleve.id}`)}>
										<Table.Cell class="font-bold">{r.rang}</Table.Cell>
										<Table.Cell class="font-medium">
											{r.eleve.nom} {r.eleve.prenom}
											{#if r.eleve.im}<span class="block text-[11px] text-muted-foreground">{r.eleve.im}</span>{/if}
										</Table.Cell>
										<Table.Cell class="text-center font-bold">{r.moy > 0 ? formatFr(r.moy) : '—'}</Table.Cell>
										{#if sortMatiere}
											<Table.Cell class="text-center font-bold text-primary">
												{((r.matieres.get(sortKey as string) || 0) > 0) ? formatFr(r.matieres.get(sortKey as string) || 0) : '—'}
											</Table.Cell>
										{/if}
										<Table.Cell class="text-center">{r.absences}</Table.Cell>
										<Table.Cell class="text-center">{r.retards}</Table.Cell>
										<Table.Cell class="text-center {r.erreurs > 0 ? 'text-destructive' : ''}">{r.erreurs}</Table.Cell>
										<Table.Cell class="text-center">{r.incidents}</Table.Cell>
									</Table.Row>
								{:else}
									<Table.Row><Table.Cell colspan={sortMatiere ? 8 : 7} class="py-6 text-center text-muted-foreground">Aucun élève.</Table.Cell></Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>

					<!-- Matrice matière × examen de la classe -->
					<h3 class="mb-2 text-sm font-semibold">Notes par matière et par examen</h3>
					<div class="overflow-x-auto">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Matière</Table.Head>
									{#each ac.matrice[0]?.parExamen ?? [] as pe, i (pe.examen.id)}
										<Table.Head class="text-center">{formatExamenNom(pe.examen)}</Table.Head>
										{#if showSousExamens}
											{#each pe.sous as s (s.sous.id)}
												<Table.Head class="text-center text-[11px] text-muted-foreground">{s.sous.nom}</Table.Head>
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
												{#if row.matiere.couleur}<span class="size-2.5 rounded-full" style="background-color: {row.matiere.couleur}"></span>{/if}
												{row.matiere.nom}
											</span>
										</Table.Cell>
										{#each row.parExamen as pe (pe.examen.id)}
											<Table.Cell class="text-center {pe.val === 0 ? 'opacity-40' : ''}">{pe.val > 0 ? formatFr(pe.val) : '—'}</Table.Cell>
											{#if showSousExamens}
												{#each pe.sous as su (su.sous.id)}
													<Table.Cell class="text-center text-[11px] {su.val === 0 ? 'opacity-40' : ''}">{su.val > 0 ? formatFr(su.val) : '—'}</Table.Cell>
												{/each}
											{/if}
										{/each}
										<Table.Cell class="text-center font-bold">{formatFr(row.moy)}</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				</CardUI>
			{/each}
		{/if}
	</div>
</div>
