<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Avatar from '$lib/components/ui/avatar';
	import { ArrowLeft, Check, X, Clock, Play, Square, Users, ChevronRight, ChevronDown } from '@lucide/svelte/icons';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	type Statut = 'PRESENT' | 'ABSENT' | 'RETARD';

	let presences = $state<Record<string, Statut>>({});
	let enCours = $state(false);
	let expandedSeance = $state<string | null>(null);

	$effect(() => {
		if (data.seance) {
			const map = data.presencesMap || {};
			const init: Record<string, Statut> = {};
			data.eleves.forEach((e) => {
				init[e.id] = map[e.id] || 'PRESENT';
			});
			presences = init;
		}
	});

	const presents = $derived(data.eleves.filter((e) => presences[e.id] === 'PRESENT').length);
	const retards = $derived(data.eleves.filter((e) => presences[e.id] === 'RETARD').length);
	const absents = $derived(data.eleves.filter((e) => presences[e.id] === 'ABSENT').length);

	async function demarrer() {
		enCours = true;
		const fd = new FormData();
		try {
			await fetch(
				`/classe/${data.classeId}/cours/${data.coursId}/presence?/startSeance`,
				{ method: 'POST', body: fd }
			);
			await invalidateAll();
		} finally {
			enCours = false;
		}
	}

	async function mark(eleveId: string, statut: Statut) {
		if (!data.seance) return;
		presences[eleveId] = statut;
		const fd = new FormData();
		fd.append('seanceId', data.seance.id);
		fd.append('eleveId', eleveId);
		fd.append('statut', statut);
		await fetch(`/classe/${data.classeId}/cours/${data.coursId}/presence?/markPresence`, {
			method: 'POST',
			body: fd
		});
	}

	async function stop() {
		const fd = new FormData();
		await fetch(`/classe/${data.classeId}/cours/${data.coursId}/presence?/stopSeance`, {
			method: 'POST',
			body: fd
		});
		goto(`/classe/${data.classeId}/cours`);
	}

	function statutClasse(s: Statut | undefined) {
		if (s === 'PRESENT') return 'bg-emerald-500/15 border-emerald-500/40';
		if (s === 'RETARD') return 'bg-amber-500/15 border-amber-500/40';
		if (s === 'ABSENT') return 'bg-red-500/15 border-red-500/40';
		return 'bg-muted/30 border-transparent';
	}
</script>

<div class="min-h-full bg-sidebar text-sidebar-foreground">
	<header
		class="flex h-16 items-center justify-between gap-4 border-b border-sidebar-border bg-card/80 px-4 backdrop-blur-sm"
	>
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" onclick={() => goto(`/classe/${data.classeId}/cours`)}>
				<ArrowLeft class="size-4" />
			</Button>
			<div>
				<h1 class="text-lg font-semibold">{data.coursNom}</h1>
				<p class="text-xs text-muted-foreground">
					{data.salleNom} • {data.heureDebut} - {data.heureFin}
				</p>
			</div>
		</div>
		{#if data.seance}
			<span class="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-500">
				<span class="size-2 rounded-full bg-emerald-500 animate-pulse"></span> En cours
			</span>
		{/if}
	</header>

	{#if !data.seance}
		<div class="flex flex-1 items-center justify-center p-4">
			<div class="w-full max-w-md space-y-6 rounded-2xl border border-sidebar-border bg-card/60 p-8 text-center">
				<div class="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
					<Play class="size-7 text-primary" />
				</div>
				<div>
					<h2 class="text-xl font-bold">{data.coursNom}</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Prof. {data.professeur} • {data.eleves.length} élève(s)
					</p>
				</div>
		<p class="text-sm text-muted-foreground">
			Démarrez la séance pour faire l'appel et suivre la présence des élèves en temps réel.
		</p>
		{#if !data.canStart}
			<p class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
				Seul le professeur titulaire de ce cours peut le démarrer.
			</p>
		{/if}
		<Button class="w-full" onclick={demarrer} disabled={enCours || !data.canStart}>
			<Play class="mr-2 size-4" />
			{enCours ? 'Démarrage…' : 'Démarrer le cours'}
		</Button>
			</div>
		</div>
	{:else}
		<div class="space-y-4 p-4">
			<div class="grid grid-cols-3 gap-3">
				<button
					type="button"
					class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center transition-colors hover:bg-emerald-500/20"
				>
					<p class="text-2xl font-bold text-emerald-500">{presents}</p>
					<p class="text-xs text-muted-foreground">Présents</p>
				</button>
				<button
					type="button"
					class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center transition-colors hover:bg-amber-500/20"
				>
					<p class="text-2xl font-bold text-amber-500">{retards}</p>
					<p class="text-xs text-muted-foreground">Retards</p>
				</button>
				<button
					type="button"
					class="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center transition-colors hover:bg-red-500/20"
				>
					<p class="text-2xl font-bold text-red-500">{absents}</p>
					<p class="text-xs text-muted-foreground">Absents</p>
				</button>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each data.eleves as eleve (eleve.id)}
					{@const statut = presences[eleve.id] || 'PRESENT'}
					<div
						class="flex flex-col gap-3 rounded-2xl border-2 p-4 transition-all {statutClasse(statut)}"
					>
						<div class="flex items-center gap-4">
							<Avatar.Root class="size-20 shrink-0 ring-2 ring-background">
								<Avatar.Image
									src={eleve.imageUrl || eleve.photoUrl || ''}
									alt={`${eleve.prenom} ${eleve.nom}`}
									class="object-cover"
								/>
								<Avatar.Fallback class="text-xl font-bold">
									{eleve.prenom[0]}{eleve.nom[0]}
								</Avatar.Fallback>
							</Avatar.Root>
							<div class="min-w-0 flex-1">
								<p class="truncate text-base font-semibold">{eleve.prenom} {eleve.nom}</p>
								<p class="text-xs text-muted-foreground">
									{eleve.dateNaissance
										? new Date(eleve.dateNaissance).toLocaleDateString('fr-FR')
										: ''}
								</p>
								<span
									class="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium {statut ===
									'PRESENT'
										? 'bg-emerald-500/15 text-emerald-600'
										: statut === 'RETARD'
											? 'bg-amber-500/15 text-amber-600'
											: 'bg-red-500/15 text-red-600'}"
								>
									{#if statut === 'PRESENT'}
										<Check class="size-3" /> Présent
									{:else if statut === 'RETARD'}
										<Clock class="size-3" /> Retard
									{:else}
										<X class="size-3" /> Absent
									{/if}
								</span>
							</div>
						</div>
						<div class="grid grid-cols-3 gap-2">
							<button
								type="button"
								class="flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-semibold transition-all {statut ===
								'PRESENT'
									? 'bg-emerald-500 text-white shadow-sm'
									: 'bg-muted text-muted-foreground hover:bg-emerald-500/20 hover:text-emerald-600'}"
								onclick={() => mark(eleve.id, 'PRESENT')}
							>
								<Check class="size-5" />
								Présent
							</button>
							<button
								type="button"
								class="flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-semibold transition-all {statut ===
								'RETARD'
									? 'bg-amber-500 text-white shadow-sm'
									: 'bg-muted text-muted-foreground hover:bg-amber-500/20 hover:text-amber-600'}"
								onclick={() => mark(eleve.id, 'RETARD')}
							>
								<Clock class="size-5" />
								Retard
							</button>
							<button
								type="button"
								class="flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-semibold transition-all {statut ===
								'ABSENT'
									? 'bg-red-500 text-white shadow-sm'
									: 'bg-muted text-muted-foreground hover:bg-red-500/20 hover:text-red-600'}"
								onclick={() => mark(eleve.id, 'ABSENT')}
							>
								<X class="size-5" />
								Absent
							</button>
						</div>
					</div>
				{/each}
			</div>

			<div class="sticky bottom-0 flex justify-end border-t border-sidebar-border bg-sidebar/95 py-3 backdrop-blur">
				<Button variant="destructive" onclick={stop}>
					<Square class="mr-2 size-4" />
					Terminer le cours
				</Button>
			</div>
		</div>
	{/if}

	{#if data.historique.length > 0}
		<div class="border-t border-sidebar-border p-4">
			<h2 class="mb-3 flex items-center gap-2 font-semibold">
				<Users class="size-4 text-primary" /> Historique des séances
			</h2>
			<div class="space-y-2">
				{#each data.historique as s (s.id)}
					{@const expanded = expandedSeance === s.id}
					<div class="overflow-hidden rounded-lg border border-sidebar-border">
						<button
							type="button"
							class="flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left transition-colors hover:bg-muted/50"
							onclick={() => (expandedSeance = expanded ? null : s.id)}
						>
							<div>
								<p class="text-sm font-medium">
									{new Date(s.dateDebut).toLocaleString('fr-FR', {
										day: 'numeric',
										month: 'short',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</p>
								<p class="text-xs text-muted-foreground">Prof. {s.professeur}</p>
							</div>
							<div class="flex items-center gap-3 text-xs">
								<span class="text-emerald-500">{s.presents} prés.</span>
								<span class="text-amber-500">{s.retards} ret.</span>
								<span class="text-red-500">{s.absents} abs.</span>
								<span class="text-muted-foreground">/ {s.total}</span>
								{#if expanded}
									<ChevronDown class="size-4 text-muted-foreground" />
								{:else}
									<ChevronRight class="size-4 text-muted-foreground" />
								{/if}
							</div>
						</button>
						{#if expanded}
							<div class="grid gap-3 border-t border-sidebar-border bg-muted/20 p-3 sm:grid-cols-2">
								<div>
									<p class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-500">
										<X class="size-3.5" /> Absents ({s.absentsList.length})
									</p>
									{#if s.absentsList.length === 0}
										<p class="text-xs text-muted-foreground">Aucun absent</p>
									{:else}
										<ul class="space-y-0.5">
											{#each s.absentsList as nom (nom)}
												<li class="text-xs text-foreground/90">{nom}</li>
											{/each}
										</ul>
									{/if}
								</div>
								<div>
									<p class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-500">
										<Clock class="size-3.5" /> Retards ({s.retardsList.length})
									</p>
									{#if s.retardsList.length === 0}
										<p class="text-xs text-muted-foreground">Aucun retard</p>
									{:else}
										<ul class="space-y-0.5">
											{#each s.retardsList as nom (nom)}
												<li class="text-xs text-foreground/90">{nom}</li>
											{/each}
										</ul>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
