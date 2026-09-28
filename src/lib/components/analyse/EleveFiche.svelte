<script lang="ts">
	import { Line } from 'svelte-chartjs';
	import type { EleveDetail } from '$lib/server/analyseEleve';
	import { formatFr } from '$lib/utils/analyse';
	import { TrendingUp, TrendingDown, Minus, Info, UserX } from '@lucide/svelte';

	type Props = { detail: EleveDetail | null; loading: boolean };
	let { detail, loading }: Props = $props();

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		scales: { y: { min: 0, max: 20 } }
	};
</script>

{#if loading}
	<div class="flex h-full items-center justify-center p-8 text-muted-foreground">
		<span class="animate-pulse text-sm">Chargement de la fiche élève…</span>
	</div>
{:else if !detail}
	<div class="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
		<p class="text-sm">Aucune donnée disponible.</p>
	</div>
{:else}
	<div class="space-y-5 p-4">
		<!-- En-tête identité -->
		<div>
			<h2 class="text-lg font-bold">{detail.nom} {detail.prenom}</h2>
			<p class="text-xs text-muted-foreground">
				{#if detail.im}IM : {detail.im} ·
				{/if}
				{#if detail.sexe}{detail.sexe} ·
				{/if}
				{#if detail.dateNaissance}Né(e) le {detail.dateNaissance}{/if}
			</p>
		</div>

		<!-- Tendance globale -->
		<div
			class="flex items-center gap-2 rounded-lg border p-3 text-sm {detail.globalTendance ===
			'regression'
				? 'border-destructive/30 bg-destructive/5'
				: detail.globalTendance === 'progression'
					? 'border-emerald-500/30 bg-emerald-500/5'
					: 'border-sidebar-border bg-muted/30'}"
		>
			{#if detail.globalTendance === 'progression'}<TrendingUp class="size-4 text-emerald-500" />
			{:else if detail.globalTendance === 'regression'}<TrendingDown
					class="size-4 text-destructive"
				/>
			{:else}<Minus class="size-4 text-muted-foreground" />{/if}
			<span class="font-medium">Tendance globale :</span>
			<span class="capitalize">{detail.globalTendance}</span>
			<span class="ml-auto text-xs text-muted-foreground">pente {formatFr(detail.globalSlope)}</span
			>
		</div>

		{#if !detail.hasHistory}
			<div
				class="flex items-center gap-2 rounded-lg border border-sidebar-border bg-muted/30 p-3 text-sm text-muted-foreground"
			>
				<UserX class="size-4" />
				Aucun historique de notes disponible pour cet élève.
			</div>
		{/if}

		<!-- Historique par année scolaire -->
		{#if detail.annees.length}
			<div>
				<h3 class="mb-2 text-sm font-semibold">Historique par année scolaire</h3>
				<div class="space-y-1.5">
					{#each detail.annees as a (a.anneeId)}
						<div class="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
							<div>
								<span class="font-medium">{a.anneeNom}</span>
								{#if a.classeNom}<span class="text-muted-foreground"> · {a.classeNom}</span>{/if}
							</div>
							<div class="text-right">
								<span class="font-bold">{formatFr(a.moyenne)}/20</span>
								{#if a.resultat}<span class="ml-2 text-xs text-muted-foreground">{a.resultat}</span
									>{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Évolution par matière -->
		<h3 class="text-sm font-semibold">Évolution des notes par matière</h3>
		<div class="space-y-4">
			{#each detail.matieres as m (m.matiereId)}
				<div class="rounded-lg border p-3">
					<div class="mb-2 flex flex-wrap items-center gap-2">
						<span class="inline-flex items-center gap-2 text-sm font-medium">
							{#if m.couleur}<span
									class="size-2.5 rounded-full"
									style="background-color: {m.couleur}"
								></span>{/if}
							{m.nom}
						</span>
						<span
							class="rounded-full px-2 py-0.5 text-[11px] {m.tendance === 'regression'
								? 'bg-destructive/10 text-destructive'
								: m.tendance === 'progression'
									? 'bg-emerald-500/10 text-emerald-500'
									: 'bg-muted text-muted-foreground'}"
						>
							{m.tendance}
						</span>
						{#if m.badge === 'pedagogique'}
							<span class="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-500">
								<Info class="mr-1 inline size-3" />Cause probablement pédagogique
							</span>
						{:else if m.badge === 'individuelle'}
							<span class="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-500">
								<Info class="mr-1 inline size-3" />Propre à l'élève
							</span>
						{/if}
					</div>
					{#if m.series.length}
						<div class="h-40">
							<Line
								data={{
									labels: m.series.map((s) => s.label),
									datasets: [
										{
											label: m.nom,
											data: m.series.map((s) => s.valeur),
											borderColor: m.couleur || '#3b82f6',
											backgroundColor: 'rgba(59,130,246,0.1)',
											tension: 0.3,
											fill: true
										}
									]
								}}
								options={chartOptions}
							/>
						</div>
					{:else}
						<p class="text-xs text-muted-foreground">Aucune note pour cette matière.</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}
