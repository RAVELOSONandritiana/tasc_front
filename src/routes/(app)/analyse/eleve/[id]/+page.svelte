<script lang="ts">
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { ArrowLeft, Star, ShieldAlert, AlertTriangle, UserX, CalendarClock, TrendingUp, BarChart3 } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { formatClasseNom } from '$lib/utils';
	import { formatFr, round } from '$lib/utils/analyse';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	type NoteD = {
		id: string;
		valeur: number;
		coefficient: number;
		date: string;
		matiereId: string;
		matiereNom: string;
		matiereCouleur: string | null;
		examenId: string | null;
		examenNom: string | null;
		examenPeriode: string | null;
		examenDate: string | null;
		classeId: string | null;
		sousExamenId: string | null;
		sousExamenNom: string | null;
	};
	const notes = $derived<NoteD[]>(data.notes || []);
	const absences = $derived(data.absences || []);
	const retards = $derived(data.retards || []);
	const incidents = $derived(data.incidents || []);

	// Matières suivies (toutes, tous niveaux confondus)
	const matieres = $derived.by(() => {
		const m = new Map<string, { id: string; nom: string; couleur: string | null }>();
		for (const n of notes) {
			if (!m.has(n.matiereId)) m.set(n.matiereId, { id: n.matiereId, nom: n.matiereNom, couleur: n.matiereCouleur });
		}
		return [...m.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
	});

	function moyenneMatiere(matiereId: string): number {
		const ns = notes.filter((n) => n.matiereId === matiereId);
		if (!ns.length) return 0;
		let tot = 0;
		let coef = 0;
		for (const n of ns) {
			tot += n.valeur * n.coefficient;
			coef += n.coefficient;
		}
		return coef ? round(tot / coef) : 0;
	}
	const moyenneGenerale = $derived.by(() => {
		if (!notes.length) return 0;
		let tot = 0;
		let coef = 0;
		for (const n of notes) {
			tot += n.valeur * n.coefficient;
			coef += n.coefficient;
		}
		return coef ? round(tot / coef) : 0;
	});

	const matiereMoyennes = $derived(matieres.map((m) => ({ ...m, moy: moyenneMatiere(m.id) })));
	const pointFort = $derived([...matiereMoyennes].filter((m) => m.moy > 0).sort((a, b) => b.moy - a.moy)[0] || null);
	const pointFaible = $derived([...matiereMoyennes].filter((m) => m.moy > 0).sort((a, b) => a.moy - b.moy)[0] || null);

	// Incidents par type
	const incidentStats = $derived.by(() => {
		const acc = { INFO: 0, ERREUR: 0, NOTE: 0, ABSENT: 0 };
		for (const i of incidents) {
			if (i.type in acc) (acc as any)[i.type]++;
		}
		return acc;
	});
	const nbJustifiees = $derived(absences.filter((a) => a.justifie).length);

	// ---- Évolution par matière (toutes les notes, tous niveaux) ----
	let matiereChoisie = $state<string | null>(null);
	const matiereSelectionnee = $derived(
		matiereChoisie ?? (matieres.length ? matieres[0].id : null)
	);
	const evolutionNotes = $derived.by(() => {
		if (!matiereSelectionnee) return [];
		return notes
			.filter((n) => n.matiereId === matiereSelectionnee)
			.slice()
			.sort((a, b) => (a.examenDate || a.date).localeCompare(b.examenDate || b.date));
	});

	function linePath(points: { x: number; y: number }[]): string {
		if (!points.length) return '';
		return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
	}
	const lineChartVM = { W: 640, H: 300, padL: 42, padR: 18, padT: 18, padB: 60, minY: 0, maxY: 20 };
	const evolutionSeries = $derived.by(() => {
		const labels = evolutionNotes.map((n) => n.examenNom || n.sousExamenNom || n.examenDate || '');
		const values = evolutionNotes.map((n) => n.valeur);
		const { W, H, padL, padR, padT, padB, minY, maxY } = lineChartVM;
		const plotW = W - padL - padR;
		const plotH = H - padT - padB;
		const xFor = (i: number) => (labels.length <= 1 ? padL + plotW / 2 : padL + (plotW * i) / (labels.length - 1));
		const yFor = (v: number) => padT + plotH * (1 - (v - minY) / (maxY - minY));
		const points = values.map((v, i) => ({ x: xFor(i), y: yFor(v), v, label: labels[i], date: evolutionNotes[i].examenDate }));
		return { labels, values, points };
	});

	const BAR = { padL: 46, padR: 18, padT: 18, padB: 80, H: 300, chartW: 720, barMax: 40 };
	function buildBars(labels: string[], values: number[], colors?: string[]) {
		const { padL, padR, padT, padB, H, chartW, barMax } = BAR;
		const plotW = chartW - padL - padR;
		const plotH = H - padT - padB;
		const n = labels.length || 1;
		const slot = plotW / n;
		const barW = Math.min(barMax, slot * 0.8);
		const maxY = Math.max(1, ...values);
		const bars = labels.map((lab, i) => {
			const h = (values[i] / maxY) * plotH;
			const x = padL + slot * i + (slot - barW) / 2;
			const cx = x + barW / 2;
			return { label: lab, value: values[i], x, y: padT + plotH - h, h, barW, cx, baseY: H - padB + 14, color: colors ? colors[i % colors.length] : '#3b82f6' };
		});
		return { chartW, H, padL, padR, padT, padB, plotW, plotH, bars };
	}
	const palette = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#f97316', '#0ea5e9'];
	const matiereBars = $derived(
		buildBars(
			matiereMoyennes.map((m) => m.nom),
			matiereMoyennes.map((m) => m.moy),
			matiereMoyennes.map((m) => m.couleur || palette[0])
		)
	);

	function formatDateFr(iso: string): string {
		const [a, m, j] = iso.split('-');
		return j && m && a ? `${j}/${m}/${a}` : iso;
	}
	const typeBadge: Record<string, { c: string; bg: string; label: string }> = {
		NOTE: { c: 'text-emerald-500', bg: 'bg-emerald-500/15', label: 'Note positive' },
		INFO: { c: 'text-sky-500', bg: 'bg-sky-500/15', label: 'Info' },
		ABSENT: { c: 'text-orange-500', bg: 'bg-orange-500/15', label: 'Absence signalée' },
		ERREUR: { c: 'text-destructive', bg: 'bg-destructive/15', label: "Erreur / faute" }
	};
</script>

<div class="flex min-h-0 flex-1 flex-col bg-sidebar text-sidebar-foreground">
	<div class="flex-1 overflow-y-auto p-4 space-y-6">
		<div class="flex items-center gap-3">
			<Button variant="outline" size="sm" onclick={() => goto('/analyse')}><ArrowLeft class="mr-2 size-4" /> Retour</Button>
			<div>
				<h1 class="text-2xl font-bold">{data.eleve.nom} {data.eleve.prenom}</h1>
				<p class="text-sm text-muted-foreground">
					Analyse détaillée du parcours
					{#if data.eleve.im}· IM {data.eleve.im}{/if}
					· Situation {data.eleve.situation}
				</p>
			</div>
		</div>

		<!-- Parcours / classes successives -->
		<CardUI class="p-4">
			<h2 class="mb-2 text-sm font-semibold">Parcours dans l'établissement</h2>
			<div class="flex flex-wrap gap-2">
				{#each data.inscriptions as ins (ins.id)}
					<div class="rounded-lg border border-sidebar-border px-3 py-1.5 text-sm">
						<span class="font-medium">{formatClasseNom(ins.classeNiveau, ins.classeNom)}</span>
						<span class="text-muted-foreground"> · {ins.anneeNom}</span>
						{#if ins.actif}<span class="ml-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-500">actuel</span>{/if}
					</div>
				{/each}
			</div>
		</CardUI>

		<!-- KPIs -->
		<div class="grid grid-cols-2 gap-3 lg:grid-cols-6">
			<CardUI class="p-4">
				<div class="flex items-center gap-2 text-muted-foreground"><BarChart3 class="size-4" /><span class="text-xs">Moy. gén.</span></div>
				<p class="mt-1 text-2xl font-bold">{formatFr(moyenneGenerale)}/20</p>
			</CardUI>
			<CardUI class="p-4">
				<div class="flex items-center gap-2 text-muted-foreground"><Star class="size-4 text-emerald-500" /><span class="text-xs">Point fort</span></div>
				<p class="mt-1 text-sm font-bold text-emerald-500">{pointFort ? pointFort.nom : '—'}</p>
			</CardUI>
			<CardUI class="p-4">
				<div class="flex items-center gap-2 text-muted-foreground"><ShieldAlert class="size-4 text-destructive" /><span class="text-xs">Point faible</span></div>
				<p class="mt-1 text-sm font-bold text-destructive">{pointFaible ? pointFaible.nom : '—'}</p>
			</CardUI>
			<CardUI class="p-4">
				<div class="flex items-center gap-2 text-muted-foreground"><UserX class="size-4 text-amber-500" /><span class="text-xs">Absences</span></div>
				<p class="mt-1 text-2xl font-bold">{absences.length}</p>
				<p class="text-[11px] text-muted-foreground">{nbJustifiees} justifiées</p>
			</CardUI>
			<CardUI class="p-4">
				<div class="flex items-center gap-2 text-muted-foreground"><CalendarClock class="size-4 text-orange-500" /><span class="text-xs">Retards</span></div>
				<p class="mt-1 text-2xl font-bold">{retards.length}</p>
			</CardUI>
			<CardUI class="p-4">
				<div class="flex items-center gap-2 text-muted-foreground"><AlertTriangle class="size-4 text-destructive" /><span class="text-xs">Erreurs</span></div>
				<p class="mt-1 text-2xl font-bold text-destructive">{incidentStats.ERREUR}</p>
			</CardUI>
		</div>

		<!-- Moyenne par matière -->
		<CardUI class="p-5">
			<h2 class="mb-3 font-semibold">Moyenne par matière (tout le parcours)</h2>
			{#if matiereBars.bars.some((b) => b.value > 0)}
				<div class="overflow-x-auto">
					<svg viewBox="0 0 {matiereBars.chartW} {matiereBars.H}" class="mx-auto block h-auto w-full">
						{#each [0, 5, 10, 15, 20] as grid}
							{@const y = matiereBars.padT + matiereBars.plotH * (1 - grid / 20)}
							<line x1={matiereBars.padL} y1={y} x2={matiereBars.chartW - matiereBars.padR} y2={y} stroke="currentColor" class="text-sidebar-border" stroke-width="1" />
							<text x={matiereBars.padL - 6} y={y + 4} text-anchor="end" class="fill-muted-foreground text-[10px]">{grid}</text>
						{/each}
						{#each matiereBars.bars as b (b.label)}
							<rect x={b.x} y={b.y} width={b.barW} height={b.h} fill={b.color} rx="3" opacity="0.85" />
							{#if b.value > 0}<text x={b.cx} y={b.y - 5} text-anchor="middle" class="fill-foreground text-[10px] font-semibold">{formatFr(b.value)}</text>{/if}
							<text transform="rotate(-35 {b.cx} {b.baseY})" x={b.cx} y={b.baseY} text-anchor="end" class="fill-muted-foreground text-[10px]">{b.label}</text>
						{/each}
					</svg>
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">Aucune note enregistrée.</p>
			{/if}
		</CardUI>

		<!-- Évolution par matière (sélectionnable) -->
		<CardUI class="p-5">
			<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
				<h2 class="flex items-center gap-2 font-semibold"><TrendingUp class="size-4 text-primary" /> Évolution des notes par matière</h2>
				<select
					class="rounded-md border border-sidebar-border bg-card px-2 py-1.5 text-sm"
					value={matiereSelectionnee ?? ''}
					onchange={(e) => (matiereChoisie = e.currentTarget.value || null)}
				>
					{#each matieres as m (m.id)}
						<option value={m.id}>{m.nom}</option>
					{/each}
				</select>
			</div>
			<p class="mb-2 text-xs text-muted-foreground">
				Toutes les notes de la matière sélectionnée, peu importent le niveau ou l'année, afin de
				visualiser la progression réelle de l'élève.
			</p>
			{#if evolutionSeries.points.length}
				<svg viewBox="0 0 640 300" class="h-72 w-full">
					{#each [0, 5, 10, 15, 20] as grid}
						{@const y = lineChartVM.padT + (lineChartVM.H - lineChartVM.padT - lineChartVM.padB) * (1 - grid / 20)}
						<line x1={lineChartVM.padL} y1={y} x2={640 - lineChartVM.padR} y2={y} stroke="currentColor" class="text-sidebar-border" stroke-width="1" />
						<text x={lineChartVM.padL - 6} y={y + 4} text-anchor="end" class="fill-muted-foreground text-[10px]">{grid}</text>
					{/each}
					<path d={linePath(evolutionSeries.points)} fill="none" stroke="#3b82f6" stroke-width="2.5" />
					{#each evolutionSeries.points as p (p.date + p.label)}
						<circle cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" />
					{/each}
					{#each evolutionSeries.points as p, i (p.date + p.label)}
						{#if i % Math.ceil(evolutionSeries.points.length / 8) === 0 || evolutionSeries.points.length <= 8}
							<text x={p.x} y={300 - lineChartVM.padB + 16} text-anchor="middle" class="fill-muted-foreground text-[9px]">{p.label}</text>
						{/if}
					{/each}
				</svg>
				{#if evolutionSeries.values.length}
					<p class="mt-2 text-xs text-muted-foreground">
						Min {formatFr(Math.min(...evolutionSeries.values))} · Max {formatFr(Math.max(...evolutionSeries.values))} ·
						Progression {evolutionSeries.values.length > 1
							? formatFr(round(((evolutionSeries.values[evolutionSeries.values.length - 1] - evolutionSeries.values[0]) / Math.max(0.1, evolutionSeries.values[0])) * 100)) + '%'
							: '—'}
					</p>
				{/if}
			{:else}
				<p class="text-sm text-muted-foreground">Aucune note pour cette matière.</p>
			{/if}
		</CardUI>

		<!-- Erreurs / incidents -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<CardUI class="p-5">
				<h2 class="mb-3 font-semibold">Erreurs et incidents</h2>
				<div class="mb-3 flex flex-wrap gap-2">
					{#each [{ k: 'ERREUR', label: 'Erreurs' }, { k: 'NOTE', label: 'Notes +' }, { k: 'INFO', label: 'Infos' }, { k: 'ABSENT', label: 'Absences sig.' }] as t (t.k)}
						<div class="flex items-center gap-2 rounded-lg border border-sidebar-border p-2 {typeBadge[t.k].bg}">
							<span class="text-lg font-bold {typeBadge[t.k].c}">{(incidentStats as any)[t.k]}</span>
							<span class="text-xs text-muted-foreground">{t.label}</span>
						</div>
					{/each}
				</div>
				<div class="max-h-72 space-y-2 overflow-y-auto">
					{#each incidents as inc (inc.id)}
						<div class="rounded-md border border-sidebar-border p-2 text-sm">
							<div class="flex items-center gap-2">
								<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold {typeBadge[inc.type]?.bg} {typeBadge[inc.type]?.c}">{typeBadge[inc.type]?.label}</span>
								<span class="text-xs text-muted-foreground">{formatDateFr(inc.date)}</span>
							</div>
							<p class="mt-1">{inc.message}</p>
						</div>
					{:else}
						<p class="text-sm text-muted-foreground">Aucun incident enregistré.</p>
					{/each}
				</div>
			</CardUI>

			<CardUI class="p-5">
				<h2 class="mb-3 font-semibold">Absences et retards</h2>
				<div class="space-y-3">
					<div>
						<p class="mb-1 text-sm font-medium">Absences ({absences.length})</p>
						<div class="max-h-32 space-y-1 overflow-y-auto">
							{#each absences as a (a.id)}
								<div class="flex items-center justify-between rounded-md border border-sidebar-border px-2 py-1 text-sm">
									<span>{formatDateFr(a.date)}</span>
									<span class="text-[11px] {a.justifie ? 'text-emerald-500' : 'text-destructive'}">{a.justifie ? 'Justifiée' : 'Non justifiée'}</span>
								</div>
							{:else}
								<p class="text-xs text-muted-foreground">Aucune absence.</p>
							{/each}
						</div>
					</div>
					<div>
						<p class="mb-1 text-sm font-medium">Retards ({retards.length})</p>
						<div class="max-h-32 space-y-1 overflow-y-auto">
							{#each retards as r (r.id)}
								<div class="flex items-center justify-between rounded-md border border-sidebar-border px-2 py-1 text-sm">
									<span>{formatDateFr(r.date)} <span class="text-muted-foreground">· {r.duree}</span></span>
									<span class="text-[11px] {r.justifie ? 'text-emerald-500' : 'text-destructive'}">{r.justifie ? 'Justifié' : 'Non justifié'}</span>
								</div>
							{:else}
								<p class="text-xs text-muted-foreground">Aucun retard.</p>
							{/each}
						</div>
					</div>
				</div>
			</CardUI>
		</div>

		<!-- Toutes les notes -->
		<CardUI class="p-5">
			<h2 class="mb-3 font-semibold">Toutes les notes (par matière et examen)</h2>
			<div class="overflow-x-auto">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Matière</Table.Head>
							<Table.Head>Examen</Table.Head>
							<Table.Head>Sous-examen</Table.Head>
							<Table.Head class="text-center">Note</Table.Head>
							<Table.Head class="text-center">Coef.</Table.Head>
							<Table.Head>Date</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each [...notes].sort((a, b) => (b.examenDate || b.date).localeCompare(a.examenDate || a.date)) as n (n.id)}
							<Table.Row>
								<Table.Cell class="font-medium">
									<span class="inline-flex items-center gap-2">
										{#if n.matiereCouleur}<span class="size-2.5 rounded-full" style="background-color: {n.matiereCouleur}"></span>{/if}
										{n.matiereNom}
									</span>
								</Table.Cell>
								<Table.Cell>{n.examenNom || '—'}{n.examenPeriode ? ` (${n.examenPeriode})` : ''}</Table.Cell>
								<Table.Cell class="text-muted-foreground">{n.sousExamenNom || '—'}</Table.Cell>
								<Table.Cell class="text-center font-bold {n.valeur < 10 ? 'text-destructive' : 'text-emerald-500'}">{formatFr(n.valeur)}</Table.Cell>
								<Table.Cell class="text-center">{n.coefficient}</Table.Cell>
								<Table.Cell class="text-muted-foreground">{n.examenDate ? formatDateFr(n.examenDate) : ''}</Table.Cell>
							</Table.Row>
						{:else}
							<Table.Row><Table.Cell colspan={6} class="py-6 text-center text-muted-foreground">Aucune note.</Table.Cell></Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</CardUI>
	</div>
</div>
