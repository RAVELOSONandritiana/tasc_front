<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Avatar from '$lib/components/ui/avatar';
	import { ArrowLeft, Check, X, Clock, Users, CalendarClock, AlertTriangle } from '@lucide/svelte/icons';
	import { goto, invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';
	import { formatAge } from '$lib/utils';

	const { data }: PageProps = $props();

	type Statut = 'PRESENT' | 'RETARD' | 'ABSENT';
	type EleveP = {
		id: string;
		nom: string;
		prenom: string;
		dateNaissance: string;
		photoUrl?: string | null;
		imageUrl?: string | null;
	};

	let statuts = $state<Record<string, Statut>>({});
	let heuresEffectuees = $state<string>('');
	let causeIncomplet = $state<string>('');
	let datePointage = $state<string>(new Date().toISOString().split('T')[0]);
	let submitting = $state(false);
	let erreur = $state<string | null>(null);
	let alertes = $state<string[]>([]);
	let success = $state(false);

	// Initialise tout le monde à "présent" au chargement.
	$effect(() => {
		const init: Record<string, Statut> = {};
		data.eleves.forEach((e: EleveP) => (init[e.id] = 'PRESENT'));
		statuts = init;
	});

	const presents = $derived(data.eleves.filter((e) => statuts[e.id] === 'PRESENT').length);
	const retards = $derived(data.eleves.filter((e) => statuts[e.id] === 'RETARD').length);
	const absents = $derived(data.eleves.filter((e) => statuts[e.id] === 'ABSENT').length);

	function statutClasse(s: Statut | undefined) {
		if (s === 'PRESENT') return 'bg-emerald-500/15 border-emerald-500/40';
		if (s === 'RETARD') return 'bg-amber-500/15 border-amber-500/40';
		if (s === 'ABSENT') return 'bg-red-500/15 border-red-500/40';
		return 'bg-muted/30 border-transparent';
	}

	async function enregistrer() {
		if (!data.canEdit) return;
		submitting = true;
		erreur = null;
		alertes = [];
		success = false;
		const fd = new FormData();
		fd.append('date', datePointage);
		fd.append('heuresEffectuees', heuresEffectuees);
		fd.append('causeIncomplet', causeIncomplet);
		for (const e of data.eleves) {
			const s = statuts[e.id] || 'PRESENT';
			if (s === 'ABSENT') fd.append('absentIds', e.id);
			else if (s === 'RETARD') fd.append('retardIds', e.id);
		}
		try {
			const res = await fetch(
				`/classe/${data.classeId}/cours/${data.coursId}/presence?/enregistrer`,
				{ method: 'POST', body: fd }
			);
			const result = await res.json().catch(() => null);
			if (!res.ok || result?.error) {
				erreur = result?.error || 'Échec de l’enregistrement';
				return;
			}
			alertes = result?.data?.alertes || [];
			success = true;
			await invalidateAll();
		} catch (e) {
			erreur = 'Erreur réseau';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex flex-1 flex-col bg-sidebar text-sidebar-foreground">
	<header class="flex h-16 items-center justify-between gap-4 border-b border-sidebar-border bg-card/80 px-4 backdrop-blur-sm">
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" onclick={() => goto(`/classe/${data.classeId}/cours`)}>
				<ArrowLeft class="size-4" />
			</Button>
			<div>
				<h1 class="text-lg font-semibold">{data.coursNom}</h1>
				<p class="text-xs text-muted-foreground">
					{data.salleNom} • {data.heureDebut} - {data.heureFin}
					{#if data.heuresPrevues}<span class="ml-1">• {data.heuresPrevues}h prévues</span>{/if}
				</p>
			</div>
		</div>
	</header>

	{#if !data.canEdit}
		<div class="p-4">
			<div class="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
				<AlertTriangle class="size-4" />
				Réservé au surveillant ou à l’opérateur pour le pointage des cours.
			</div>
		</div>
	{/if}

	<div class="space-y-4 p-4">
		<!-- Bloc pointage : heures + cause -->
		<div class="rounded-2xl border border-sidebar-border bg-card/60 p-4">
			<h2 class="mb-3 flex items-center gap-2 font-semibold">
				<CalendarClock class="size-4 text-primary" /> Pointage du cours
			</h2>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<div class="grid gap-2">
					<Label for="date">Date</Label>
					<Input id="date" type="date" bind:value={datePointage} disabled={!data.canEdit} />
				</div>
				<div class="grid gap-2">
					<Label for="heures">Heures effectuées par le professeur</Label>
					<Input
						id="heures"
						type="number"
						step="0.5"
						min="0"
						placeholder="Ex: 2"
						bind:value={heuresEffectuees}
						disabled={!data.canEdit}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="cause">Cause (si heures incomplètes)</Label>
					<Textarea
						id="cause"
						rows={1}
						placeholder="Ex: panne, grève…"
						bind:value={causeIncomplet}
						disabled={!data.canEdit}
					/>
				</div>
			</div>
			{#if data.heuresPrevues}
				<p class="mt-2 text-xs text-muted-foreground">
					Heures prévues d’après l’emploi du temps : <span class="font-semibold">{data.heuresPrevues}h</span>.
				</p>
			{/if}
		</div>

		<!-- Compteurs -->
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

		<!-- Liste élèves -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each data.eleves as eleve (eleve.id)}
				{@const statut = statuts[eleve.id] || 'PRESENT'}
				<div class="flex flex-col gap-3 rounded-2xl border-2 p-4 transition-all {statutClasse(statut)}">
					<div class="flex items-center gap-4">
						<Avatar.Root class="size-20 shrink-0 ring-2 ring-background">
							<Avatar.Image src={eleve.imageUrl || eleve.photoUrl || ''} alt={`${eleve.nom} ${eleve.prenom}`} class="object-cover" />
							<Avatar.Fallback class="text-xl font-bold">{eleve.nom[0]}{eleve.prenom[0]}</Avatar.Fallback>
						</Avatar.Root>
						<div class="min-w-0 flex-1">
							<p class="truncate text-base font-semibold">{eleve.nom} {eleve.prenom}</p>
							<span class="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium {statut === 'PRESENT' ? 'bg-emerald-500/15 text-emerald-600' : statut === 'RETARD' ? 'bg-amber-500/15 text-amber-600' : 'bg-red-500/15 text-red-600'}">
								{#if statut === 'PRESENT'}<Check class="size-3" /> Présent{:else if statut === 'RETARD'}<Clock class="size-3" /> Retard{:else}<X class="size-3" /> Absent{/if}
							</span>
						</div>
					</div>
					<div class="grid grid-cols-3 gap-2">
						<button type="button" disabled={!data.canEdit} class="flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-semibold transition-all {statut === 'PRESENT' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-emerald-500/20 hover:text-emerald-600'}" onclick={() => (statuts[eleve.id] = 'PRESENT')}>
							<Check class="size-5" /> Présent
						</button>
						<button type="button" disabled={!data.canEdit} class="flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-semibold transition-all {statut === 'RETARD' ? 'bg-amber-500 text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-amber-500/20 hover:text-amber-600'}" onclick={() => (statuts[eleve.id] = 'RETARD')}>
							<Clock class="size-5" /> Retard
						</button>
						<button type="button" disabled={!data.canEdit} class="flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-semibold transition-all {statut === 'ABSENT' ? 'bg-red-500 text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-red-500/20 hover:text-red-600'}" onclick={() => (statuts[eleve.id] = 'ABSENT')}>
							<X class="size-5" /> Absent
						</button>
					</div>
				</div>
			{/each}
		</div>

		{#if erreur}
			<div class="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">{erreur}</div>
		{/if}
		{#if success}
			<div class="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600">
				Pointage enregistré avec succès.
				{#if alertes.length > 0}
					<ul class="mt-1 list-inside list-disc">
						{#each alertes as a (a)}<li>{a}</li>{/each}
					</ul>
				{/if}
			</div>
		{/if}

		{#if data.canEdit}
			<div class="sticky bottom-0 flex justify-end border-t border-sidebar-border bg-sidebar/95 py-3 backdrop-blur">
				<Button onclick={enregistrer} disabled={submitting}>
					{submitting ? 'Enregistrement…' : 'Enregistrer le pointage'}
				</Button>
			</div>
		{/if}
	</div>

	<!-- Historique -->
	{#if data.historique.length > 0}
		<div class="border-t border-sidebar-border p-4">
			<h2 class="mb-3 flex items-center gap-2 font-semibold">
				<Users class="size-4 text-primary" /> Historique des pointages
			</h2>
			<div class="space-y-2">
				{#each data.historique as s (s.id)}
					<div class="overflow-hidden rounded-lg border border-sidebar-border">
						<div class="flex flex-wrap items-center justify-between gap-2 p-3">
							<div>
								<p class="text-sm font-medium">
									{new Date(s.date).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
								</p>
								<p class="text-xs text-muted-foreground">Prof. {s.professeur}</p>
							</div>
							<div class="flex items-center gap-3 text-xs">
								<span class="font-semibold">{s.heuresEffectuees}h</span>
								{#if s.heuresPrevues}<span class="text-muted-foreground">/ {s.heuresPrevues}h prévues</span>{/if}
								<span class="text-amber-500">{s.retards.length} ret.</span>
								<span class="text-red-500">{s.absents.length} abs.</span>
							</div>
						</div>
						{#if s.causeIncomplet}
							<p class="border-t border-sidebar-border bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
								Cause : {s.causeIncomplet}
							</p>
						{/if}
						{#if s.absents.length > 0 || s.retards.length > 0}
							<div class="grid gap-3 border-t border-sidebar-border bg-muted/20 p-3 sm:grid-cols-2">
								<div>
									<p class="mb-1.5 text-xs font-semibold text-red-500">Absents ({s.absents.length})</p>
									{#if s.absents.length === 0}<p class="text-xs text-muted-foreground">Aucun</p>{:else}
										<ul class="space-y-0.5">{#each s.absents as nom (nom)}<li class="text-xs">{nom}</li>{/each}</ul>
									{/if}
								</div>
								<div>
									<p class="mb-1.5 text-xs font-semibold text-amber-500">Retards ({s.retards.length})</p>
									{#if s.retards.length === 0}<p class="text-xs text-muted-foreground">Aucun</p>{:else}
										<ul class="space-y-0.5">{#each s.retards as nom (nom)}<li class="text-xs">{nom}</li>{/each}</ul>
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
