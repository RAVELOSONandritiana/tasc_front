<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import { BarChart, LineChart, PieChart, AreaChart, Axis } from 'layerchart';
	import {
		GraduationCap,
		ClipboardList,
		UserSquare2,
		UsersRound,
		AlertTriangle,
		Building2,
		TrendingUp,
		TrendingDown,
		Minus,
		School,
		Users
	} from '@lucide/svelte/icons';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let anneeA = $state(data.currentYear);
	let anneeB = $state(data.annees[data.annees.length - 2] ?? data.annees[0]);

	const dataA = $derived(data.dataParAnnee[anneeA] || data.dataParAnnee[data.currentYear]);
	const dataB = $derived(data.dataParAnnee[anneeB] || data.dataParAnnee[data.annees[0]]);

	const elevesParNiveau = $derived(
		dataA.elevesParClasse.map((item) => {
			const obj: Record<string, string | number> = { niveau: item.niveau };
			obj['ref'] = item.count;
			const bItem = dataB.elevesParClasse.find((b) => b.niveau === item.niveau);
			if (bItem) obj['comp'] = bItem.count;
			return obj;
		})
	);

	const incidentsParMoisData = $derived(
		dataA.incidentsParMois.map((item) => ({
			mois: item.mois,
			incidents: item.count
		}))
	);

	const rolesData = $derived(dataA.roles);
	const chartHeight = 260;

	function getEvolution(a: number, b: number) {
		const diff = a - b;
		const pct = b > 0 ? (diff / b) * 100 : 0;
		return { diff, pct, isPositive: diff > 0, isNeutral: diff === 0 };
	}

	const evolutionEleves = $derived(getEvolution(dataA.eleves, dataB.eleves));
	const evolutionIncidents = $derived(getEvolution(dataA.incidents, dataB.incidents));
	const evolutionClasses = $derived(getEvolution(dataA.classes, dataB.classes));
	const evolutionEnseignants = $derived(getEvolution(dataA.enseignants, dataB.enseignants));
	const evolutionSurveillants = $derived(getEvolution(dataA.surveillants, dataB.surveillants));
	const evolutionPersonnel = $derived(getEvolution(dataA.personnel, dataB.personnel));
	const evolutionSalles = $derived(getEvolution(dataA.salles, dataB.salles));

	const kpis = $derived([
		{ label: 'Élèves', value: dataA.eleves, icon: GraduationCap, evolution: evolutionEleves, color: 'text-blue-500', bg: 'bg-blue-500/10' },
		{ label: 'Classes', value: dataA.classes, icon: ClipboardList, evolution: evolutionClasses, color: 'text-violet-500', bg: 'bg-violet-500/10' },
		{ label: 'Enseignants', value: dataA.enseignants, icon: GraduationCap, evolution: evolutionEnseignants, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
		{ label: 'Surveillants', value: dataA.surveillants, icon: UserSquare2, evolution: evolutionSurveillants, color: 'text-amber-500', bg: 'bg-amber-500/10' },
		{ label: 'Personnel', value: dataA.personnel, icon: UsersRound, evolution: evolutionPersonnel, color: 'text-rose-500', bg: 'bg-rose-500/10' },
		{ label: 'Incidents', value: dataA.incidents, icon: AlertTriangle, evolution: evolutionIncidents, color: 'text-orange-500', bg: 'bg-orange-500/10' },
		{ label: 'Salles', value: dataA.salles, icon: Building2, evolution: evolutionSalles, color: 'text-cyan-500', bg: 'bg-cyan-500/10' }
	]);

	const ratioElevesClasse = $derived((dataA.eleves / (dataA.classes || 1)).toFixed(1));
	const ratioElevesClasseB = $derived((dataB.eleves / (dataB.classes || 1)).toFixed(1));
	const incidentsParEleve = $derived((dataA.incidents / (dataA.eleves || 1)).toFixed(2));
	const incidentsParEleveB = $derived((dataB.incidents / (dataB.eleves || 1)).toFixed(2));
</script>

<main class="bg-background p-4 md:p-6 text-foreground">
	<div class="mx-auto max-w-7xl space-y-6">
		<!-- Header -->
		<div class="animate-slide-down flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-3">
				<div class="flex size-12 items-center justify-center rounded-xl bg-primary/10">
					<School class="size-6 text-primary" />
				</div>
				<div>
					<h1 class="text-2xl font-bold tracking-tight">Tableau de bord</h1>
					<p class="text-sm text-muted-foreground">Vue d'ensemble de votre établissement</p>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<Label class="text-xs font-medium text-muted-foreground">Référence</Label>
					<select bind:value={anneeA} class="h-9 w-36 rounded-md border border-input bg-background px-3 py-1 text-sm font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						{#each data.annees as a}
							<option value={a}>{a}</option>
						{/each}
					</select>
				</div>
				<div class="flex items-center gap-2">
					<Label class="text-xs font-medium text-muted-foreground">Comparaison</Label>
					<select bind:value={anneeB} class="h-9 w-36 rounded-md border border-input bg-background px-3 py-1 text-sm font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						{#each data.annees.filter((a) => a !== anneeA) as a}
							<option value={a}>{a}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		<!-- KPI Cards -->
		<div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
			{#each kpis as kpi, i (kpi.label)}
				<Card class="animate-slide-up opacity-0 p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5" style="animation-delay: {i * 50}ms">
					<div class="flex items-center justify-between">
						<div class="flex size-9 items-center justify-center rounded-lg {kpi.bg}">
							<kpi.icon class="size-4 {kpi.color}" />
						</div>
						{#if kpi.evolution.isNeutral}
							<Minus class="size-3.5 text-muted-foreground" />
						{:else if kpi.evolution.isPositive}
							<TrendingUp class="size-3.5 text-emerald-500" />
						{:else}
							<TrendingDown class="size-3.5 text-destructive" />
						{/if}
					</div>
					<div class="mt-3">
						<p class="text-2xl font-bold tracking-tight">{kpi.value}</p>
						<p class="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
					</div>
					<div class="mt-2 flex items-center gap-1">
						{#if !kpi.evolution.isNeutral}
							<span class="text-xs font-medium {kpi.evolution.isPositive ? 'text-emerald-500' : 'text-destructive'}">
								{kpi.evolution.isPositive ? '+' : ''}{kpi.evolution.diff}
							</span>
							<span class="text-xs text-muted-foreground">
								({kpi.evolution.pct > 0 ? '+' : ''}{kpi.evolution.pct.toFixed(1)}%)
							</span>
						{:else}
							<span class="text-xs text-muted-foreground">Pas de changement</span>
						{/if}
					</div>
				</Card>
			{/each}
		</div>

		<!-- Charts Row 1 -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<Card class="animate-slide-up opacity-0 p-5 transition-all duration-200 hover:shadow-md" style="animation-delay: 150ms">
				<div class="mb-4 flex items-center justify-between">
					<div>
						<h3 class="font-semibold">Élèves par niveau</h3>
						<p class="text-xs text-muted-foreground">Comparaison {anneeA} vs {anneeB}</p>
					</div>
					<Badge variant="outline" class="text-xs">{anneeA}</Badge>
				</div>
				<BarChart
					data={elevesParNiveau}
					x="niveau"
					series={[
						{ key: 'ref', color: 'var(--chart-1)', label: anneeA },
						{ key: 'comp', color: 'var(--chart-2)', label: anneeB }
					]}
					seriesLayout="group"
					height={chartHeight}
				/>
			</Card>

			<Card class="animate-slide-up opacity-0 p-5 transition-all duration-200 hover:shadow-md" style="animation-delay: 200ms">
				<div class="mb-4 flex items-center justify-between">
					<div>
						<h3 class="font-semibold">Répartition des rôles</h3>
						<p class="text-xs text-muted-foreground">Distribution du personnel et élèves</p>
					</div>
					<Badge variant="outline" class="text-xs">{anneeA}</Badge>
				</div>
				<PieChart data={rolesData} x="role" y="count" height={chartHeight}>
					<Axis placement="angle" />
					<Axis placement="radius" />
				</PieChart>
			</Card>
		</div>

		<!-- Charts Row 2 -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<Card class="animate-slide-up opacity-0 p-5 transition-all duration-200 hover:shadow-md" style="animation-delay: 250ms">
				<div class="mb-4 flex items-center justify-between">
					<div>
						<h3 class="font-semibold">Incidents par mois</h3>
						<p class="text-xs text-muted-foreground">Évolution mensuelle — {anneeA}</p>
					</div>
					<Badge variant="secondary" class="text-xs">{dataA.incidents} total</Badge>
				</div>
				<AreaChart data={incidentsParMoisData} x="mois" y="incidents" height={chartHeight}>
					<Axis placement="bottom" />
					<Axis placement="left" />
				</AreaChart>
			</Card>

			<Card class="animate-slide-up opacity-0 p-5 transition-all duration-200 hover:shadow-md" style="animation-delay: 300ms">
				<div class="mb-4 flex items-center justify-between">
					<div>
						<h3 class="font-semibold">Tendance des incidents</h3>
						<p class="text-xs text-muted-foreground">Courbe d'évolution sur l'année</p>
					</div>
					<Badge variant="destructive" class="text-xs">{dataA.incidents} incidents</Badge>
				</div>
				<LineChart data={incidentsParMoisData} x="mois" y="incidents" height={chartHeight}>
					<Axis placement="bottom" />
					<Axis placement="left" />
				</LineChart>
			</Card>
		</div>

		<!-- KPIs Comparaison -->
		<Card class="animate-slide-up opacity-0 p-5 transition-all duration-200 hover:shadow-md" style="animation-delay: 350ms">
			<div class="mb-4">
				<h3 class="font-semibold">Indicateurs clés de performance</h3>
				<p class="text-xs text-muted-foreground">Comparaison {anneeA} vs {anneeB}</p>
			</div>
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				<div class="rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-sm">
					<p class="text-xs text-muted-foreground">Évolution élèves</p>
					<p class="mt-1 text-2xl font-bold {evolutionEleves.isPositive ? 'text-emerald-500' : 'text-destructive'}">
						{evolutionEleves.isPositive ? '+' : ''}{evolutionEleves.diff}
					</p>
					<div class="mt-1 flex items-center gap-1">
						<span class="text-xs text-muted-foreground">
							{evolutionEleves.pct > 0 ? '+' : ''}{evolutionEleves.pct.toFixed(1)}%
						</span>
						<span class="text-xs text-muted-foreground">vs {anneeB}</span>
					</div>
				</div>
				<div class="rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-sm">
					<p class="text-xs text-muted-foreground">Évolution incidents</p>
					<p class="mt-1 text-2xl font-bold {evolutionIncidents.isPositive ? 'text-destructive' : 'text-emerald-500'}">
						{evolutionIncidents.isPositive ? '+' : ''}{evolutionIncidents.diff}
					</p>
					<div class="mt-1 flex items-center gap-1">
						<span class="text-xs text-muted-foreground">
							{evolutionIncidents.pct > 0 ? '+' : ''}{evolutionIncidents.pct.toFixed(1)}%
						</span>
						<span class="text-xs text-muted-foreground">vs {anneeB}</span>
					</div>
				</div>
				<div class="rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-sm">
					<p class="text-xs text-muted-foreground">Ratio élèves/classe</p>
					<p class="mt-1 text-2xl font-bold text-primary">{ratioElevesClasse}</p>
					<div class="mt-1 flex items-center gap-1">
						<span class="text-xs text-muted-foreground">vs {ratioElevesClasseB}</span>
						<span class="text-xs text-muted-foreground">({anneeB})</span>
					</div>
				</div>
				<div class="rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-sm">
					<p class="text-xs text-muted-foreground">Incidents par élève</p>
					<p class="mt-1 text-2xl font-bold text-warning">{incidentsParEleve}</p>
					<div class="mt-1 flex items-center gap-1">
						<span class="text-xs text-muted-foreground">vs {incidentsParEleveB}</span>
						<span class="text-xs text-muted-foreground">({anneeB})</span>
					</div>
				</div>
			</div>
		</Card>
	</div>
</main>
