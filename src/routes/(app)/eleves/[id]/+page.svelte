<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import {
		Mail,
		Phone,
		MapPin,
		Calendar,
		Clock,
		Shield,
		Users,
		CheckCircle2,
		X,
		Info,
		AlertCircle,
		ChevronDown,
		ChevronUp
	} from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import type { EleveIncident } from '$lib/types/Incident.type';
	import ProfileImage from '$lib/components/user/ProfileImage.svelte';

	const { data }: PageProps = $props();
	const eleve = data.eleve;
	const incidents: EleveIncident[] = data.incidents || [];

	const initial = eleve.prenom.charAt(0) + eleve.nom.charAt(0);
	let photo = $state<string | null>(eleve.imageUrl ?? null);
	const stats = eleve.stats;

	let positivesOpen = $state(false);
	let negativesOpen = $state(false);
	let autresOpen = $state(false);

	const notesPositives = incidents.filter(i => i.type === 'note');
	const notesNegatives = incidents.filter(i => i.type === 'erreur');
	const autresIncidents = incidents.filter(i => i.type !== 'note' && i.type !== 'erreur');
</script>

<main class="min-h-full bg-sidebar p-4 text-sidebar-foreground">
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">Profil de l'élève</h1>
			<Button variant="outline" onclick={() => goto('/eleves')}>Retour</Button>
		</div>

		<Card class="p-6">
			<div class="flex items-center gap-4">
				<ProfileImage
					personneId={eleve.personneId}
					imageUrl={photo}
					initials={initial}
					onChange={(url) => (photo = url)}
				/>
				<div>
					<h2 class="text-2xl font-semibold">{eleve.prenom} {eleve.nom}</h2>
					<Badge variant="secondary" class="text-xs">{eleve.classe}</Badge>
				</div>
			</div>
		</Card>

		<div class="grid gap-4 md:grid-cols-2">
			<Card class="space-y-3 p-4">
				<h3 class="font-semibold">Informations</h3>
				<div class="flex items-center gap-3">
					<Calendar class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Date de naissance</Label>
						<p class="text-sm font-medium">
							{eleve.dateNaissance
								? new Date(eleve.dateNaissance).toLocaleDateString('fr-FR')
								: '—'}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<Mail class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Email</Label>
						<p class="text-sm font-medium">{eleve.email || '—'}</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<Phone class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Téléphone</Label>
						<p class="text-sm font-medium">{eleve.telephone || '—'}</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<MapPin class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Adresse</Label>
						<p class="text-sm font-medium">{eleve.adresse || '—'}</p>
					</div>
				</div>
			</Card>

			<Card class="space-y-3 p-4">
				<h3 class="font-semibold">Statut</h3>
				<div class="flex items-center gap-3">
					<Shield class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Rôle</Label>
						<p class="text-sm font-medium">Élève</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<Calendar class="size-4 text-muted-foreground" />
					<div>
						<Label class="text-xs text-muted-foreground">Classe</Label>
						<p class="text-sm font-medium">{eleve.classe}</p>
					</div>
				</div>
			</Card>
		</div>

		<Card class="space-y-4 p-5">
			<div class="flex items-center gap-2">
				<Users class="size-5 text-primary" />
				<h3 class="font-semibold">Responsables (parents / tuteur)</h3>
			</div>
			<div class="grid gap-4 md:grid-cols-3">
				{#each [{ titre: 'Père', nom: eleve.nomPere, prenom: eleve.prenomPere, tel: eleve.telephonePere }, { titre: 'Mère', nom: eleve.nomMere, prenom: eleve.prenomMere, tel: eleve.telephoneMere }, { titre: 'Tuteur', nom: eleve.nomTuteur, prenom: eleve.prenomTuteur, tel: eleve.telephoneTuteur }] as responsable (responsable.titre)}
					<div class="rounded-lg border p-3">
						<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{responsable.titre}</p>
						{#if responsable.nom || responsable.prenom}
							<p class="text-sm font-medium">{responsable.prenom || ''} {responsable.nom || ''}</p>
							<p class="mt-1 flex items-center gap-2 text-sm">
								<Phone class="size-3.5 text-muted-foreground" />
								{responsable.tel || '—'}
							</p>
						{:else}
							<p class="text-sm text-muted-foreground italic">Non renseigné</p>
						{/if}
					</div>
				{/each}
			</div>
		</Card>

		{#if stats}
			<Card class="space-y-4 p-5">
				<h3 class="font-semibold">Statistiques</h3>
				<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
					<div class="rounded-lg bg-muted/30 p-3 text-center">
						<Clock class="mx-auto mb-1 size-5 text-amber-500" />
						<p class="text-xs text-muted-foreground">Retards</p>
						<p class="text-2xl font-bold {stats.retards > 2 ? 'text-red-500' : 'text-amber-500'}">
							{stats.retards}
						</p>
					</div>
					<div class="rounded-lg bg-muted/30 p-3 text-center">
						<Users class="mx-auto mb-1 size-5 text-red-500" />
						<p class="text-xs text-muted-foreground">Absences</p>
						<p class="text-2xl font-bold {stats.absences > 1 ? 'text-red-500' : 'text-amber-500'}">
							{stats.absences}
						</p>
					</div>
					<div class="rounded-lg bg-muted/30 p-3 text-center">
						<Shield class="mx-auto mb-1 size-5 text-red-500" />
						<p class="text-xs text-muted-foreground">Incidents</p>
						<p
							class="text-2xl font-bold {stats.incidents > 0 ? 'text-red-500' : 'text-emerald-500'}"
						>
							{stats.incidents}
						</p>
					</div>
					<div class="rounded-lg bg-muted/30 p-3 text-center">
						<CheckCircle2 class="mx-auto mb-1 size-5 text-emerald-500" />
						<p class="text-xs text-muted-foreground">Notes positives</p>
						<p class="text-2xl font-bold text-emerald-500">{stats.notesPositives}</p>
					</div>
					<div class="rounded-lg bg-muted/30 p-3 text-center">
						<X class="mx-auto mb-1 size-5 text-red-500" />
						<p class="text-xs text-muted-foreground">Notes négatives</p>
						<p
							class="text-2xl font-bold {stats.notesNegatives > 2
								? 'text-red-500'
								: stats.notesNegatives > 0
									? 'text-amber-500'
									: 'text-emerald-500'}"
						>
							{stats.notesNegatives}
						</p>
					</div>
					<div class="rounded-lg bg-muted/30 p-3 text-center">
						<Calendar class="mx-auto mb-1 size-5 text-blue-500" />
						<p class="text-xs text-muted-foreground">Heures cours</p>
						<p class="text-2xl font-bold text-blue-500">{stats.heuresCours}h</p>
					</div>
				</div>
			</Card>
		{/if}

		{#if incidents.length > 0}
			<div class="space-y-3">
				{#if notesPositives.length > 0}
					<button
						onclick={() => (positivesOpen = !positivesOpen)}
						class="flex w-full items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4 text-left transition-all hover:bg-emerald-50/50 dark:border-emerald-700/70 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20"
					>
						<div class="flex items-center gap-3">
							<div class="flex size-10 items-center justify-center rounded-full bg-emerald-100/90 dark:bg-emerald-900/40">
								<CheckCircle2 class="size-5 text-emerald-600 dark:text-emerald-400" />
							</div>
							<div>
								<p class="font-semibold text-emerald-800 dark:text-emerald-300">Notes positives</p>
								<p class="text-xs text-emerald-600/80 dark:text-emerald-400/70">
									{notesPositives.length} {(notesPositives.length > 1) ? 'incidents' : 'incident'}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<span class="flex size-6 items-center justify-center rounded-full bg-emerald-100/90 text-xs font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
								{notesPositives.length}
							</span>
							{#if positivesOpen}
								<ChevronUp class="size-4 text-emerald-600 dark:text-emerald-400" />
							{:else}
								<ChevronDown class="size-4 text-emerald-600 dark:text-emerald-400" />
							{/if}
						</div>
					</button>
					{#if positivesOpen}
						<div class="ml-4 space-y-2 border-l-2 border-emerald-300/70 pl-4 dark:border-emerald-700/70">
							{#each notesPositives as incident}
								<div class="rounded-lg border border-emerald-200/70 bg-white/90 p-3 shadow-sm transition-all hover:shadow dark:border-emerald-800/70 dark:bg-slate-900/80">
									<p class="text-sm text-slate-800 dark:text-slate-100">{incident.message}</p>
									<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Par {incident.auteur} • {new Date(incident.date).toLocaleDateString('fr-FR')}</p>
								</div>
							{/each}
						</div>
					{/if}
				{/if}

				{#if notesNegatives.length > 0}
					<button
						onclick={() => (negativesOpen = !negativesOpen)}
						class="flex w-full items-center justify-between rounded-xl border border-red-200/80 bg-red-50/30 p-4 text-left transition-all hover:bg-red-50/50 dark:border-red-700/70 dark:bg-red-950/10 dark:hover:bg-red-950/20"
					>
						<div class="flex items-center gap-3">
							<div class="flex size-10 items-center justify-center rounded-full bg-red-100/90 dark:bg-red-900/40">
								<X class="size-5 text-red-600 dark:text-red-400" />
							</div>
							<div>
								<p class="font-semibold text-red-800 dark:text-red-300">Notes négatives</p>
								<p class="text-xs text-red-600/80 dark:text-red-400/70">
									{notesNegatives.length} {(notesNegatives.length > 1) ? 'incidents' : 'incident'}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<span class="flex size-6 items-center justify-center rounded-full bg-red-100/90 text-xs font-bold text-red-700 dark:bg-red-900/50 dark:text-red-300">
								{notesNegatives.length}
							</span>
							{#if negativesOpen}
								<ChevronUp class="size-4 text-red-600 dark:text-red-400" />
							{:else}
								<ChevronDown class="size-4 text-red-600 dark:text-red-400" />
							{/if}
						</div>
					</button>
					{#if negativesOpen}
						<div class="ml-4 space-y-2 border-l-2 border-red-300/70 pl-4 dark:border-red-700/70">
							{#each notesNegatives as incident}
								<div class="rounded-lg border border-red-200/70 bg-white/90 p-3 shadow-sm transition-all hover:shadow dark:border-red-800/70 dark:bg-slate-900/80">
									<p class="text-sm text-slate-800 dark:text-slate-100">{incident.message}</p>
									<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Par {incident.auteur} • {new Date(incident.date).toLocaleDateString('fr-FR')}</p>
								</div>
							{/each}
						</div>
					{/if}
				{/if}

				{#if autresIncidents.length > 0}
					<button
						onclick={() => (autresOpen = !autresOpen)}
						class="flex w-full items-center justify-between rounded-xl border border-blue-200/80 bg-blue-50/30 p-4 text-left transition-all hover:bg-blue-50/50 dark:border-blue-700/70 dark:bg-blue-950/10 dark:hover:bg-blue-950/20"
					>
						<div class="flex items-center gap-3">
							<div class="flex size-10 items-center justify-center rounded-full bg-blue-100/90 dark:bg-blue-900/40">
								<Info class="size-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<p class="font-semibold text-blue-800 dark:text-blue-300">Autres incidents</p>
								<p class="text-xs text-blue-600/80 dark:text-blue-400/70">
									{autresIncidents.length} {(autresIncidents.length > 1) ? 'incidents' : 'incident'}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<span class="flex size-6 items-center justify-center rounded-full bg-blue-100/90 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
								{autresIncidents.length}
							</span>
							{#if autresOpen}
								<ChevronUp class="size-4 text-blue-600 dark:text-blue-400" />
							{:else}
								<ChevronDown class="size-4 text-blue-600 dark:text-blue-400" />
							{/if}
						</div>
					</button>
					{#if autresOpen}
						<div class="ml-4 space-y-2 border-l-2 border-blue-300/70 pl-4 dark:border-blue-700/70">
							{#each autresIncidents as incident}
								<div class="rounded-lg border border-blue-200/70 bg-white/90 p-3 shadow-sm transition-all hover:shadow dark:border-blue-800/70 dark:bg-slate-900/80">
									<Badge variant="outline" class="mb-1 text-xs border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300">{incident.type}</Badge>
									<p class="text-sm text-slate-800 dark:text-slate-100">{incident.message}</p>
									<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Par {incident.auteur} • {new Date(incident.date).toLocaleDateString('fr-FR')}</p>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
</main>