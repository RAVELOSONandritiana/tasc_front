<script lang="ts">
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { Personne, Professeur, Surveillant } from '$lib/types/Personne.type';
	import {
		Mail,
		Phone,
		UserRound,
		CalendarDays,
		Users,
		Shield,
		X,
		CheckCircle2,
		BookOpen
	} from '@lucide/svelte/icons';
	import Avatar from '$lib/components/ui/avatar/avatar.svelte';
	import AvatarFallback from '$lib/components/ui/avatar/avatar-fallback.svelte';
	import AvatarImage from '$lib/components/ui/avatar/avatar-image.svelte';
	import { env } from '$env/dynamic/public';
	import { goto } from '$app/navigation';

	type PersonWithStats = Personne & {
		matiere?: string[];
		poste?: string;
		stats?: {
			retards: number;
			absences: number;
			incidents: number;
		};
	};

	let {
		personne,
		role,
		matieres,
		id: personId,
		hrefProfil = '/enseignant'
	}: {
		personne: PersonWithStats;
		role: string;
		matieres?: string[];
		id?: string;
		hrefProfil?: string;
	} = $props();

	const initial = $derived((personne.name?.charAt(0) || '') + (personne.lastname?.charAt(0) || ''));

	const stats = personne.stats;
	const displayMatieres = matieres || personne.matiere;
</script>

<CardUI
	class="group flex h-full flex-col overflow-hidden transition-all duration-200 hover:shadow-md"
>
	<div class="relative h-20 w-full">
		<div
			class="absolute inset-0 bg-linear-to-br from-sidebar-accent/40 via-sidebar to-sidebar-accent/20"
		></div>
		<div class="absolute inset-0 bg-linear-to-b from-transparent to-sidebar/80"></div>
	</div>
	<div class="flex-1 px-8 pt-0 pb-5">
		<div class="relative -mt-10 mb-4 flex items-end gap-4">
			<Avatar class="h-16 w-16 rounded-xl border-[3px] border-sidebar shadow-md">
				{#if env.PUBLIC_DEFAULT_AVATAR}
					<AvatarImage src={env.PUBLIC_DEFAULT_AVATAR} alt={personne.name} />
				{/if}
				<AvatarFallback
					class="rounded-xl bg-sidebar-primary/10 text-sm font-semibold text-sidebar-primary"
				>
					{initial || '?'}
				</AvatarFallback>
			</Avatar>
			<div class="mb-2 min-w-0 flex-1">
				<div class="text-lg leading-snug font-semibold text-foreground">
					{personne.name}
					{personne.lastname}
				</div>
				<div class="mt-1 flex flex-wrap items-center gap-2">
					<span class="inline-flex items-center gap-2 text-xs text-muted-foreground">
						<UserRound class="size-3.5" />
						{role}
					</span>
				</div>
			</div>
		</div>

		<div class="space-y-3">
			<div class="flex flex-col gap-2 text-xs text-muted-foreground">
				<span class="inline-flex items-center gap-2">
					<Mail class="size-3.5" />
					<span class="truncate">{personne.email || '—'}</span>
				</span>
				<span class="inline-flex items-center gap-2">
					<Phone class="size-3.5" />
					<span class="truncate">{personne.phone || '—'}</span>
				</span>
			</div>

			{#if displayMatieres && displayMatieres.length}
				<div class="flex flex-wrap gap-2">
					{#each displayMatieres as m (m)}
						<Badge variant="secondary" class="rounded-md px-2.5 py-1 text-xs">{m}</Badge>
					{/each}
				</div>
			{/if}

			{#if stats}
				<div class="grid grid-cols-3 gap-2 border-t border-sidebar-border pt-2">
					<div class="text-center">
						<p class="text-xs text-muted-foreground">Retards</p>
						<p class="font-bold text-amber-500">{stats.retards}</p>
					</div>
					<div class="text-center">
						<p class="text-xs text-muted-foreground">Absences</p>
						<p class="font-bold text-red-500">{stats.absences}</p>
					</div>
					<div class="text-center">
						<p class="text-xs text-muted-foreground">Incidents</p>
						<p class="font-bold {stats.incidents > 0 ? 'text-red-500' : 'text-emerald-500'}">
							{stats.incidents}
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<div class="border-t border-sidebar-border bg-sidebar/40 px-8 py-3">
		<Button
			size="sm"
			variant="default"
			class="h-8 w-full justify-center rounded-lg px-3 text-xs"
			onclick={() => goto(personId ? `/enseignant/${personId}` : hrefProfil)}
		>
			Voir profil
		</Button>
	</div>
</CardUI>
