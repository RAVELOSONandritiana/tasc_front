<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import * as Avatar from '$lib/components/ui/avatar';
	import {
		Users,
		GraduationCap,
		School,
		AlertCircle,
		Bell,
		BookOpen,
		BarChart3,
		PieChart,
		TrendingUp,
		Clock,
		UserX,
		Activity,
		Check
	} from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	const stats = $derived(data.stats);
	const classes = $derived(data.classes);
	const chartData = $derived(data.chartData);
	let startDate = $state(data.rangeStart);
	let endDate = $state(data.rangeEnd);

	function applyRange() {
		const params = new URLSearchParams();
		if (startDate) params.set('start', startDate);
		if (endDate) params.set('end', endDate);
		goto(`?${params.toString()}`, { invalidateAll: true, keepFocus: true, noScroll: true });
	}

	$effect(() => {
		startDate = data.rangeStart;
		endDate = data.rangeEnd;
	});

	const incidentsByType = $derived(chartData?.incidentsByType || []);
	const usersByRole = $derived(chartData?.usersByRole || []);
	const attendanceData = $derived(chartData?.attendanceData || []);
	const delaysByClass = $derived(chartData?.delaysByClass || []);
	const incidentsTrend = $derived(chartData?.incidentsTrend || []);
	const teacherAbsences = $derived(chartData?.teacherAbsences || 0);
	const classSizes = $derived(chartData?.classSizes || []);
	const additionalStats = $derived(data.additionalStats || {});
	const absenceJustification = $derived(chartData?.absenceJustification || []);
	const notesDistribution = $derived(chartData?.notesDistribution || []);
	const avgNotesByClass = $derived(chartData?.avgNotesByClass || []);
	const incidentsByClass = $derived(chartData?.incidentsByClass || []);
	const evolution = $derived(chartData?.evolution || []);

	const maxIncidentCount = $derived(Math.max(...incidentsByType.map((d) => d.count), 1));
	const totalUsers = $derived(usersByRole.reduce((sum, d) => sum + d.count, 0));
	const maxClassSize = $derived(Math.max(...classSizes.map((d) => d.count), 1));
	const maxDelays = $derived(Math.max(...delaysByClass.map((d) => d.count), 1));
	const maxTrend = $derived(Math.max(...incidentsTrend.map((d) => d.count), 1));
	const maxNotesDist = $derived(Math.max(...notesDistribution.map((d) => d.count), 1));
	const maxAvg = $derived(Math.max(...avgNotesByClass.map((d) => d.avg), 1));
	const maxIncByClass = $derived(Math.max(...incidentsByClass.map((d) => d.count), 1));
	const maxAbsJust = $derived(Math.max(...absenceJustification.map((d) => d.count), 1));
	const maxEvol = $derived(
		Math.max(
			...evolution.map((d) => Math.max(d.absences, d.retards, d.incidents)),
			1
		)
	);

	const classBarData = $derived(
		classSizes.map((item, i) => {
			const barHeight = Math.max((item.count / maxClassSize) * 115, 2);
			const gap = 460 / classSizes.length;
			const barW = Math.min(gap * 0.7, 60);
			const x = 40 + i * gap + (gap - barW) / 2;
			const y = 180 - barHeight;
			return { item, barHeight, x, y, barW, color: classColors[i] };
		})
	);

	const incidentBarData = $derived(
		incidentsByType.map((item, i) => {
			const barHeight = Math.max((item.count / maxIncidentCount) * 115, 2);
			const gap = 320 / incidentsByType.length;
			const barW = Math.min(gap * 0.7, 50);
			const x = 40 + i * gap + (gap - barW) / 2;
			const y = 180 - barHeight;
			return { item, barHeight, x, y, barW, color: incidentColors[i] };
		})
	);

	const delayBarData = $derived(
		delaysByClass.map((item, i) => {
			const barHeight = Math.max((item.count / maxDelays) * 115, 2);
			const gap = 320 / delaysByClass.length;
			const barW = Math.min(gap * 0.7, 50);
			const x = 40 + i * gap + (gap - barW) / 2;
			const y = 180 - barHeight;
			return { item, barHeight, x, y, barW, color: delayColors[i] };
		})
	);

	const trendPoints = $derived(
		incidentsTrend.map((d, i) => {
			const stepX = 360 / Math.max(incidentsTrend.length - 1, 1);
			const x = 30 + i * stepX;
			const y = 30 + 160 - (d.count / maxTrend) * 140;
			return { x, y, date: d.date, count: d.count, showLabel: d.showLabel };
		})
	);

	const trendPath = $derived(
		trendPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
	);

	const trendArea = $derived(
		`${trendPath} L ${trendPoints[trendPoints.length - 1]?.x ?? 0} ${190} L ${trendPoints[0]?.x ?? 0} ${190} Z`
	);

	const pieColors = ['#3b82f6', '#10b981', '#f59e0b'];
	const donutColors = ['#10b981', '#ef4444'];
	const incidentColors = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];
	const delayColors = ['#f59e0b', '#f97316', '#ef4444'];
	const classColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

	const notesDistBarData = $derived(
		notesDistribution.map((item, i) => {
			const barHeight = Math.max((item.count / maxNotesDist) * 115, 2);
			const gap = 320 / notesDistribution.length;
			const barW = Math.min(gap * 0.7, 50);
			const x = 40 + i * gap + (gap - barW) / 2;
			const y = 180 - barHeight;
			return { item, barHeight, x, y, barW };
		})
	);

	const avgNotesBarData = $derived(
		avgNotesByClass.map((item, i) => {
			const barHeight = Math.max((item.avg / 20) * 115, 2);
			const gap = 460 / Math.max(avgNotesByClass.length, 1);
			const barW = Math.min(gap * 0.7, 50);
			const x = 40 + i * gap + (gap - barW) / 2;
			const y = 180 - barHeight;
			return { item, barHeight, x, y, barW, color: item.avg < 10 ? '#ef4444' : item.avg < 12 ? '#f59e0b' : '#10b981' };
		})
	);

	const incByClassBarData = $derived(
		incidentsByClass.map((item, i) => {
			const barHeight = Math.max((item.count / maxIncByClass) * 115, 2);
			const gap = 460 / Math.max(incidentsByClass.length, 1);
			const barW = Math.min(gap * 0.7, 50);
			const x = 40 + i * gap + (gap - barW) / 2;
			const y = 180 - barHeight;
			return { item, barHeight, x, y, barW, color: classColors[i % classColors.length] };
		})
	);

	function buildLine(series: 'absences' | 'retards' | 'incidents') {
		return evolution.map((d, i) => {
			const stepX = 360 / Math.max(evolution.length - 1, 1);
			const x = 30 + i * stepX;
			const y = 30 + 160 - (d[series] / maxEvol) * 140;
			return { x, y, date: d.date, count: d[series], showLabel: d.showLabel };
		});
	}

	const absLine = $derived(buildLine('absences'));
	const retLine = $derived(buildLine('retards'));
	const incLine = $derived(buildLine('incidents'));

	const absPath = $derived(absLine.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '));
	const retPath = $derived(retLine.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '));
	const incPath = $derived(incLine.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '));
</script>

<div class="min-h-screen bg-background text-foreground">
	<div class="sticky top-0 z-20 border-b border-sidebar-border bg-background/80 backdrop-blur-sm">
		<div class="p-4 md:p-6">
			<div class="animate-slide-down flex items-center gap-3">
				<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
					<School class="size-5 text-primary" />
				</div>
				<div>
					<h1 class="text-xl font-bold tracking-tight">Tableau de bord</h1>
					<p class="text-xs text-muted-foreground">Vue d'ensemble de l'établissement</p>
				</div>
			</div>
		</div>
	</div>

	<div class="p-4 md:p-6 space-y-6">
		<div class="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-sidebar-border bg-muted/30 p-4">
			<div>
				<p class="text-sm font-medium">Période d'analyse</p>
				<p class="text-xs text-muted-foreground">
					Données du {startDate} au {endDate}
				</p>
			</div>
			<div class="flex flex-wrap items-end gap-2">
				<label class="flex flex-col text-xs text-muted-foreground">
					Du
					<input
						type="date"
						bind:value={startDate}
						min={data.anneeStart}
						max={endDate || undefined}
						onchange={applyRange}
						class="mt-1 rounded-md border border-sidebar-border bg-background px-2 py-1 text-xs text-foreground"
					/>
				</label>
				<label class="flex flex-col text-xs text-muted-foreground">
					Au
					<input
						type="date"
						bind:value={endDate}
						min={startDate || undefined}
						max={data.todayISO}
						onchange={applyRange}
						class="mt-1 rounded-md border border-sidebar-border bg-background px-2 py-1 text-xs text-foreground"
					/>
				</label>
				<button
					type="button"
					onclick={() => {
						startDate = data.anneeStart;
						endDate = data.todayISO;
						applyRange();
					}}
					class="mt-1 rounded-md border border-sidebar-border bg-background px-3 py-1 text-xs text-foreground hover:bg-muted transition-colors"
				>
					Réinitialiser
				</button>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<Card class="animate-slide-up opacity-0 p-5 hover:shadow-md transition-shadow">
				<div class="flex items-center gap-3">
					<div class="flex size-12 items-center justify-center rounded-lg bg-blue-500/10">
						<Users class="size-6 text-blue-500" />
					</div>
					<div>
						<p class="text-2xl font-bold">{stats.eleves}</p>
						<p class="text-xs text-muted-foreground">Élèves</p>
					</div>
				</div>
			</Card>

			<Card class="animate-slide-up opacity-0 p-5 hover:shadow-md transition-shadow">
				<div class="flex items-center gap-3">
					<div class="flex size-12 items-center justify-center rounded-lg bg-emerald-500/10">
						<GraduationCap class="size-6 text-emerald-500" />
					</div>
					<div>
						<p class="text-2xl font-bold">{stats.professeurs}</p>
						<p class="text-xs text-muted-foreground">Enseignants</p>
					</div>
				</div>
			</Card>

			<Card class="animate-slide-up opacity-0 p-5 hover:shadow-md transition-shadow">
				<div class="flex items-center gap-3">
					<div class="flex size-12 items-center justify-center rounded-lg bg-amber-500/10">
						<School class="size-6 text-amber-500" />
					</div>
					<div>
						<p class="text-2xl font-bold">{stats.classes}</p>
						<p class="text-xs text-muted-foreground">Classes</p>
					</div>
				</div>
			</Card>

			<Card class="animate-slide-up opacity-0 p-5 hover:shadow-md transition-shadow">
				<div class="flex items-center gap-3">
					<div class="flex size-12 items-center justify-center rounded-lg bg-purple-500/10">
						<Bell class="size-6 text-purple-500" />
					</div>
					<div>
						<p class="text-2xl font-bold">{stats.incidents}</p>
						<p class="text-xs text-muted-foreground">Incidents</p>
					</div>
				</div>
			</Card>
		</div>

		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<Card class="animate-slide-up opacity-0 p-5 hover:shadow-md transition-shadow">
				<div class="flex items-center gap-3">
					<div class="flex size-12 items-center justify-center rounded-lg bg-red-500/10">
						<UserX class="size-6 text-red-500" />
					</div>
					<div>
						<p class="text-2xl font-bold">{additionalStats.totalAbsences ?? 0}</p>
						<p class="text-xs text-muted-foreground">Absences (période)</p>
					</div>
				</div>
			</Card>

			<Card class="animate-slide-up opacity-0 p-5 hover:shadow-md transition-shadow">
				<div class="flex items-center gap-3">
					<div class="flex size-12 items-center justify-center rounded-lg bg-amber-500/10">
						<Clock class="size-6 text-amber-500" />
					</div>
					<div>
						<p class="text-2xl font-bold">{additionalStats.totalRetards ?? 0}</p>
						<p class="text-xs text-muted-foreground">Retards (période)</p>
					</div>
				</div>
			</Card>

			<Card class="animate-slide-up opacity-0 p-5 hover:shadow-md transition-shadow">
				<div class="flex items-center gap-3">
					<div class="flex size-12 items-center justify-center rounded-lg bg-blue-500/10">
						<BookOpen class="size-6 text-blue-500" />
					</div>
					<div>
						<p class="text-2xl font-bold">{additionalStats.avgNotesGeneral ?? 0}</p>
						<p class="text-xs text-muted-foreground">Moyenne générale (/20)</p>
					</div>
				</div>
			</Card>

		<Card class="animate-slide-up opacity-0 p-5 transition-shadow hover:shadow-md">
			<div class="flex items-center gap-3">
				<div class="flex size-12 items-center justify-center rounded-lg bg-orange-500/10">
					<AlertCircle class="size-6 text-orange-500" />
				</div>
				<div>
					<p class="text-2xl font-bold">{additionalStats.unjustifiedAbsences ?? 0}</p>
					<p class="text-xs text-muted-foreground">Absences non justifiées</p>
				</div>
			</div>
		</Card>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<Card class="animate-slide-up opacity-0 p-5 lg:col-span-2">
				<div class="flex items-center gap-2 mb-4">
					<BarChart3 class="size-5 text-primary" />
					<h2 class="font-semibold">Élèves par classe</h2>
				</div>
				{#if classSizes.length === 0}
					<p class="text-sm text-muted-foreground">Aucune donnée</p>
				{:else}
					<div class="h-64 w-full">
						<svg viewBox="0 0 500 260" class="h-full w-full">
							<text x="250" y="15" text-anchor="middle" class="fill-foreground text-sm font-semibold">
								Nombre d'élèves par classe
							</text>
							{#each classBarData as { item, barHeight, x, y, barW, color }}
								<rect
									x={x}
									y={y}
									width={barW}
									height={barHeight}
									fill={color}
									rx="4"
									opacity="0.8"
									class="hover:opacity-100 transition-opacity"
								/>
								<text x={x + barW / 2} y={y - 8} text-anchor="middle" class="fill-foreground text-xs font-semibold">
									{item.count}
								</text>
								<text x={x + barW / 2} y="220" text-anchor="middle" class="fill-muted-foreground text-xs">
									{item.className}
								</text>
							{/each}
						</svg>
					</div>
				{/if}
			</Card>

			<Card class="animate-slide-up opacity-0 p-5">
				<div class="flex items-center gap-2 mb-4">
					<PieChart class="size-5 text-primary" />
					<h2 class="font-semibold">Présence</h2>
				</div>
			{#if attendanceData.length === 0}
				<p class="text-sm text-muted-foreground">Aucune donnée</p>
			{:else}
				{@const total = attendanceData.reduce((sum, d) => sum + d.count, 0)}
				{@const radius = 70}
				{@const cx = 100}
				{@const cy = 110}
				{@const circumference = 2 * Math.PI * radius}
				<div class="h-64 w-full">
					<svg viewBox="0 0 200 220" class="h-full w-full">
						{#each attendanceData as item, i}
							{@const percent = total > 0 ? item.count / total : 0}
							{@const dashArray = `${percent * circumference} ${circumference}`}
							{@const dashOffset = -(attendanceData.slice(0, i).reduce((sum, prev) => sum + (total > 0 ? prev.count / total : 0), 0)) * circumference}
							{@const labelAngle = (attendanceData.slice(0, i).reduce((sum, prev) => sum + (total > 0 ? prev.count / total : 0), 0) + percent / 2) * 2 * Math.PI - Math.PI / 2}
				{@const labelX = cx + (radius + 30) * Math.cos(labelAngle)}
				{@const labelY = cy + (radius + 30) * Math.sin(labelAngle)}
				<circle
					cx={cx}
					cy={cy}
					r={radius}
					fill="transparent"
					stroke={donutColors[i % donutColors.length]}
					stroke-width="35"
					stroke-dasharray={dashArray}
					stroke-dashoffset={dashOffset}
					class="hover:opacity-80 transition-opacity"
				/>
				<text x={labelX} y={labelY} text-anchor="middle" class="fill-foreground text-[10px] font-medium">
					{item.label}: {item.count}
				</text>
			{/each}
			<circle cx={cx} cy={cy} r={radius - 15} fill="var(--color-background)" />
			<text x={cx} y={cy - 2} text-anchor="middle" class="fill-foreground text-lg font-bold">
				{total}
			</text>
			<text x={cx} y={cy + 16} text-anchor="middle" class="fill-muted-foreground text-[10px]">
				total
			</text>
					</svg>
				</div>
			{/if}
			</Card>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<Card class="animate-slide-up opacity-0 p-5">
				<div class="flex items-center gap-2 mb-4">
					<AlertCircle class="size-5 text-primary" />
					<h2 class="font-semibold">Incidents par type</h2>
				</div>
				{#if incidentsByType.length === 0}
					<p class="text-sm text-muted-foreground">Aucun incident</p>
				{:else}
					<div class="h-64 w-full">
						<svg viewBox="0 0 400 260" class="h-full w-full">
							<text x="200" y="15" text-anchor="middle" class="fill-foreground text-sm font-semibold">
								Distribution des incidents
							</text>
							{#each incidentBarData as { item, barHeight, x, y, barW, color }}
								<rect
									x={x}
									y={y}
									width={barW}
									height={barHeight}
									fill={color}
									rx="4"
									opacity="0.8"
									class="hover:opacity-100 transition-opacity"
								/>
								<text x={x + barW / 2} y={y - 8} text-anchor="middle" class="fill-foreground text-xs font-semibold">
									{item.count}
								</text>
								<text x={x + barW / 2} y="220" text-anchor="middle" class="fill-muted-foreground text-xs">
									{item.type}
								</text>
							{/each}
						</svg>
					</div>
				{/if}
			</Card>

			<Card class="animate-slide-up opacity-0 p-5">
				<div class="flex items-center gap-2 mb-4">
					<TrendingUp class="size-5 text-primary" />
					<h2 class="font-semibold">Tendance des incidents</h2>
				</div>
				{#if incidentsTrend.length === 0}
					<p class="text-sm text-muted-foreground">Aucune donnée</p>
				{:else}
					<div class="h-64 w-full">
						<svg viewBox="0 0 400 260" class="h-full w-full">
							<text x="200" y="15" text-anchor="middle" class="fill-foreground text-sm font-semibold">
								Évolution sur la période sélectionnée
							</text>
							<path d={trendArea} fill="rgb(59 130 246 / 0.1)" stroke="none" />
							<path d={trendPath} fill="none" stroke="rgb(59 130 246 / 0.8)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
							{#each trendPoints as p}
								<circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="white" stroke-width="2" />
								{#if p.showLabel}
									<text x={p.x} y="235" text-anchor="middle" class="fill-muted-foreground text-xs">
										{p.date}
									</text>
								{/if}
							{/each}
						</svg>
					</div>
				{/if}
			</Card>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<Card class="animate-slide-up opacity-0 p-5">
				<div class="flex items-center gap-2 mb-4">
					<Clock class="size-5 text-primary" />
					<h2 class="font-semibold">Retards par classe</h2>
				</div>
				{#if delaysByClass.length === 0}
					<p class="text-sm text-muted-foreground">Aucun retard enregistré</p>
				{:else}
					<div class="h-64 w-full">
						<svg viewBox="0 0 400 260" class="h-full w-full">
							<text x="200" y="15" text-anchor="middle" class="fill-foreground text-sm font-semibold">
								Nombre de retards
							</text>
							{#each delayBarData as { item, barHeight, x, y, barW, color }}
								<rect
									x={x}
									y={y}
									width={barW}
									height={barHeight}
									fill={color}
									rx="4"
									opacity="0.8"
									class="hover:opacity-100 transition-opacity"
								/>
								<text x={x + barW / 2} y={y - 8} text-anchor="middle" class="fill-foreground text-xs font-semibold">
									{item.count}
								</text>
								<text x={x + barW / 2} y="220" text-anchor="middle" class="fill-muted-foreground text-xs">
									{item.className}
								</text>
							{/each}
						</svg>
					</div>
				{/if}
			</Card>

			<Card class="animate-slide-up opacity-0 p-5">
				<div class="flex items-center gap-2 mb-4">
					<UserX class="size-5 text-primary" />
					<h2 class="font-semibold">Absences (période)</h2>
				</div>
				<div class="h-64 w-full flex items-center justify-center">
					<div class="text-center">
						<p class="text-5xl font-bold text-red-500">{teacherAbsences}</p>
						<p class="text-sm text-muted-foreground mt-2">
							{teacherAbsences === 1 ? 'absence enregistrée' : 'absences enregistrées'}
						</p>
						<div class="mt-4 flex items-center justify-center gap-2">
							<div class="h-2 w-2 rounded-full bg-red-500"></div>
							<span class="text-xs text-muted-foreground">du {data.rangeStart} au {data.rangeEnd}</span>
						</div>
					</div>
				</div>
			</Card>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<Card class="animate-slide-up opacity-0 p-5">
				<div class="flex items-center gap-2 mb-4">
					<PieChart class="size-5 text-primary" />
					<h2 class="font-semibold">Répartition des absences</h2>
				</div>
				{#if absenceJustification.length === 0}
					<p class="text-sm text-muted-foreground">Aucune donnée</p>
				{:else}
					{@const total = absenceJustification.reduce((sum, d) => sum + d.count, 0)}
					{@const radius = 70}
					{@const cx = 100}
					{@const cy = 110}
					{@const circumference = 2 * Math.PI * radius}
					<div class="h-64 w-full">
						<svg viewBox="0 0 200 220" class="h-full w-full">
							{#each absenceJustification as item, i}
								{@const percent = total > 0 ? item.count / total : 0}
								{@const dashArray = `${percent * circumference} ${circumference}`}
								{@const dashOffset = -(absenceJustification.slice(0, i).reduce((sum, prev) => sum + (total > 0 ? prev.count / total : 0), 0)) * circumference}
								{@const labelAngle = (absenceJustification.slice(0, i).reduce((sum, prev) => sum + (total > 0 ? prev.count / total : 0), 0) + percent / 2) * 2 * Math.PI - Math.PI / 2}
								{@const labelX = cx + (radius + 30) * Math.cos(labelAngle)}
								{@const labelY = cy + (radius + 30) * Math.sin(labelAngle)}
								<circle
									cx={cx}
									cy={cy}
									r={radius}
									fill="transparent"
									stroke={item.color}
									stroke-width="35"
									stroke-dasharray={dashArray}
									stroke-dashoffset={dashOffset}
									class="hover:opacity-80 transition-opacity"
								/>
								<text x={labelX} y={labelY} text-anchor="middle" class="fill-foreground text-[10px] font-medium">
									{item.label}: {item.count}
								</text>
							{/each}
							<circle cx={cx} cy={cy} r={radius - 15} fill="var(--color-background)" />
							<text x={cx} y={cy - 2} text-anchor="middle" class="fill-foreground text-lg font-bold">
								{total}
							</text>
							<text x={cx} y={cy + 16} text-anchor="middle" class="fill-muted-foreground text-[10px]">
								total
							</text>
						</svg>
					</div>
				{/if}
			</Card>

			<Card class="animate-slide-up opacity-0 p-5">
				<div class="flex items-center gap-2 mb-4">
					<BarChart3 class="size-5 text-primary" />
					<h2 class="font-semibold">Distribution des notes</h2>
				</div>
				{#if notesDistribution.length === 0}
					<p class="text-sm text-muted-foreground">Aucune donnée</p>
				{:else}
					<div class="h-64 w-full">
						<svg viewBox="0 0 400 260" class="h-full w-full">
							<text x="200" y="15" text-anchor="middle" class="fill-foreground text-sm font-semibold">
								Répartition sur 20
							</text>
							{#each notesDistBarData as { item, barHeight, x, y, barW }}
								<rect x={x} y={y} width={barW} height={barHeight} fill="#3b82f6" rx="4" opacity="0.8" class="hover:opacity-100 transition-opacity" />
								<text x={x + barW / 2} y={y - 8} text-anchor="middle" class="fill-foreground text-xs font-semibold">{item.count}</text>
								<text x={x + barW / 2} y="220" text-anchor="middle" class="fill-muted-foreground text-xs">{item.range}</text>
							{/each}
						</svg>
					</div>
				{/if}
			</Card>

			<Card class="animate-slide-up opacity-0 p-5">
				<div class="flex items-center gap-2 mb-4">
					<BookOpen class="size-5 text-primary" />
					<h2 class="font-semibold">Notes moyennes par classe</h2>
				</div>
				{#if avgNotesByClass.length === 0}
					<p class="text-sm text-muted-foreground">Aucune note</p>
				{:else}
					<div class="h-64 w-full overflow-x-auto">
						<svg viewBox="0 0 500 260" class="h-full w-full min-w-[360px]">
							<text x="250" y="15" text-anchor="middle" class="fill-foreground text-sm font-semibold">
								Moyenne (/20)
							</text>
							{#each avgNotesBarData as { item, barHeight, x, y, barW, color }}
								<rect x={x} y={y} width={barW} height={barHeight} fill={color} rx="4" opacity="0.8" class="hover:opacity-100 transition-opacity" />
								<text x={x + barW / 2} y={y - 8} text-anchor="middle" class="fill-foreground text-xs font-semibold">{item.avg}</text>
								<text x={x + barW / 2} y="220" text-anchor="middle" class="fill-muted-foreground text-xs">{item.className}</text>
							{/each}
						</svg>
					</div>
				{/if}
			</Card>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<Card class="animate-slide-up opacity-0 p-5">
				<div class="flex items-center gap-2 mb-4">
					<AlertCircle class="size-5 text-primary" />
					<h2 class="font-semibold">Incidents par classe</h2>
				</div>
				{#if incidentsByClass.length === 0}
					<p class="text-sm text-muted-foreground">Aucun incident</p>
				{:else}
					<div class="h-64 w-full overflow-x-auto">
						<svg viewBox="0 0 500 260" class="h-full w-full min-w-[360px]">
							<text x="250" y="15" text-anchor="middle" class="fill-foreground text-sm font-semibold">
								Nombre d'incidents
							</text>
							{#each incByClassBarData as { item, barHeight, x, y, barW, color }}
								<rect x={x} y={y} width={barW} height={barHeight} fill={color} rx="4" opacity="0.8" class="hover:opacity-100 transition-opacity" />
								<text x={x + barW / 2} y={y - 8} text-anchor="middle" class="fill-foreground text-xs font-semibold">{item.count}</text>
								<text x={x + barW / 2} y="220" text-anchor="middle" class="fill-muted-foreground text-xs">{item.className}</text>
							{/each}
						</svg>
					</div>
				{/if}
			</Card>

			<Card class="animate-slide-up opacity-0 p-5">
				<div class="flex items-center gap-2 mb-4">
					<TrendingUp class="size-5 text-primary" />
					<h2 class="font-semibold">Évolution absences & retards</h2>
				</div>
				{#if evolution.length === 0}
					<p class="text-sm text-muted-foreground">Aucune donnée</p>
				{:else}
					<div class="h-64 w-full">
						<svg viewBox="0 0 400 260" class="h-full w-full">
							<text x="200" y="15" text-anchor="middle" class="fill-foreground text-sm font-semibold">
								Sur la période sélectionnée
							</text>
							<path d={incPath} fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.6" />
							<path d={absPath} fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
							<path d={retPath} fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
							{#each absLine as p}
								<circle cx={p.x} cy={p.y} r="3" fill="#ef4444" stroke="white" stroke-width="1.5" />
								{#if p.showLabel}
									<text x={p.x} y="235" text-anchor="middle" class="fill-muted-foreground text-xs">{p.date}</text>
								{/if}
							{/each}
						</svg>
					</div>
					<div class="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
						<span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-red-500"></span>Absences</span>
						<span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-amber-500"></span>Retards</span>
						<span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-blue-500"></span>Incidents</span>
					</div>
				{/if}
			</Card>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<Card class="animate-slide-up opacity-0 p-5">
				<div class="flex items-center gap-2 mb-4">
					<Activity class="size-5 text-primary" />
					<h2 class="font-semibold">Incidents récents</h2>
				</div>
				{#if stats.recentIncidents.length === 0}
					<p class="text-sm text-muted-foreground">Aucun incident récent</p>
				{:else}
					<div class="space-y-3 max-h-80 overflow-y-auto">
						{#each stats.recentIncidents as incident (incident.id)}
							<div class="flex items-start gap-3 p-3 rounded-lg border border-sidebar-border hover:bg-muted/50 transition-colors">
								<div class="size-8 rounded-full bg-muted/50 flex items-center justify-center">
									<Badge variant="outline" class="text-xs">
										{incident.type === 'note' ? 'N' : incident.type === 'erreur' ? 'E' : incident.type === 'info' ? 'I' : 'A'}
									</Badge>
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium truncate">{incident.elevePrenom} {incident.eleveNom}</p>
									<p class="text-xs text-muted-foreground truncate">{incident.message}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card>

			<Card class="animate-slide-up opacity-0 p-5">
				<div class="flex items-center gap-2 mb-4">
					<Bell class="size-5 text-primary" />
					<h2 class="font-semibold">Notifications</h2>
				</div>
				{#if stats.recentNotifications.length === 0}
					<p class="text-sm text-muted-foreground">Aucune notification</p>
				{:else}
					<div class="space-y-3 max-h-80 overflow-y-auto">
						{#each stats.recentNotifications as notif (notif.id)}
							<div class="flex items-start gap-3 p-3 rounded-lg border border-sidebar-border hover:bg-muted/50 transition-colors">
								<div class="size-8 rounded-full bg-muted/50 flex items-center justify-center">
									<Bell class="size-4 text-muted-foreground" />
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium">{notif.title}</p>
									<p class="text-xs text-muted-foreground">{notif.description}</p>
									<p class="text-xs text-muted-foreground mt-1">{notif.time}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card>
		</div>
	</div>
</div>
