<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Avatar from '$lib/components/ui/avatar';
	import { ArrowLeft, Check, X, Clock, Play, Square, Users } from '@lucide/svelte/icons';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	type Statut = 'PRESENT' | 'ABSENT' | 'RETARD';

	let presences = $state<Record<string, Statut>>({});
	let enCours = $state(false);

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
				<Button class="w-full" onclick={demarrer} disabled={enCours}>
					<Play class="mr-2 size-4" />
					{enCours ? 'Démarrage…' : 'Démarrer le cours'}
				</Button>
			</div>
		</div>
	{:else}
		<div class="space-y-4 p-4">
			<div class="grid grid-cols-3 gap-3">
				<div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
					<p class="text-2xl font-bold text-emerald-500">{presents}</p>
					<p class="text-xs text-muted-foreground">Présents</p>
				</div>
				<div class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
					<p class="text-2xl font-bold text-amber-500">{retards}</p>
					<p class="text-xs text-muted-foreground">Retards</p>
				</div>
				<div class="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center">
					<p class="text-2xl font-bold text-red-500">{absents}</p>
					<p class="text-xs text-muted-foreground">Absents</p>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.eleves as eleve (eleve.id)}
					{@const statut = presences[eleve.id] || 'PRESENT'}
					<div class="flex flex-col gap-3 rounded-xl border p-3 {statutClasse(statut)}">
						<div class="flex items-center gap-3">
							<Avatar.Root class="size-12 shrink-0">
								<Avatar.Image
									src={eleve.imageUrl || eleve.photoUrl || ''}
									alt={`${eleve.prenom} ${eleve.nom}`}
								/>
								<Avatar.Fallback class="text-sm font-bold">
									{eleve.prenom[0]}{eleve.nom[0]}
								</Avatar.Fallback>
							</Avatar.Root>
							<div class="min-w-0">
								<p class="truncate font-medium">{eleve.prenom} {eleve.nom}</p>
								<p class="text-xs text-muted-foreground">
									{eleve.dateNaissance
										? new Date(eleve.dateNaissance).toLocaleDateString('fr-FR')
										: ''}
								</p>
							</div>
						</div>
						<div class="grid grid-cols-3 gap-1.5">
							<button
								type="button"
								class="rounded-md px-2 py-1.5 text-xs font-medium transition-all {statut ===
								'PRESENT'
									? 'bg-emerald-500 text-white'
									: 'bg-muted text-muted-foreground hover:bg-emerald-500/20'}"
								onclick={() => mark(eleve.id, 'PRESENT')}
							>
								<Check class="mx-auto size-4" />
							</button>
							<button
								type="button"
								class="rounded-md px-2 py-1.5 text-xs font-medium transition-all {statut ===
								'RETARD'
									? 'bg-amber-500 text-white'
									: 'bg-muted text-muted-foreground hover:bg-amber-500/20'}"
								onclick={() => mark(eleve.id, 'RETARD')}
							>
								<Clock class="mx-auto size-4" />
							</button>
							<button
								type="button"
								class="rounded-md px-2 py-1.5 text-xs font-medium transition-all {statut ===
								'ABSENT'
									? 'bg-red-500 text-white'
									: 'bg-muted text-muted-foreground hover:bg-red-500/20'}"
								onclick={() => mark(eleve.id, 'ABSENT')}
							>
								<X class="mx-auto size-4" />
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
					<div class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sidebar-border p-3">
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
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
