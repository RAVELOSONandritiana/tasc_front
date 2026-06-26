<script lang="ts">
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { Surveillant } from '$lib/types/Personne.type';
	import { Mail, Phone, UserRound, Shield, Clock, Users, CheckCircle2, X } from '@lucide/svelte/icons';
	import Avatar from '$lib/components/ui/avatar/avatar.svelte';
	import AvatarFallback from '$lib/components/ui/avatar/avatar-fallback.svelte';
	import AvatarImage from '$lib/components/ui/avatar/avatar-image.svelte';
	import { env } from '$env/dynamic/public';
	import { goto } from '$app/navigation';

	type SurveillantWithStats = Surveillant & { stats?: Surveillant['stats'] };

	let {
		personne,
		tags,
		hrefProfil = '/surveillant'
	}: {
		personne: SurveillantWithStats;
		tags?: string[];
		hrefProfil?: string;
	} = $props();

	const initial = $derived(
		(personne.name?.charAt(0) || '') + (personne.lastname?.charAt(0) || '')
	);

	const roleLabel = $derived((tags && tags[0]) || 'Surveillant');
	const stats = personne.stats;
</script>

<CardUI class="group flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md h-full">
	<div class="relative h-20 w-full">
		<div class="absolute inset-0 bg-gradient-to-br from-sidebar-accent/40 via-sidebar to-sidebar-accent/20"></div>
		<div class="absolute inset-0 bg-linear-to-b from-transparent to-sidebar/80"></div>
	</div>
	<div class="px-8 pb-5 pt-0 flex-1">
		<div class="relative -mt-10 mb-4 flex items-end gap-4">
			<Avatar class="h-16 w-16 rounded-xl border-[3px] border-sidebar shadow-md">
				{#if env.PUBLIC_DEFAULT_AVATAR}
					<AvatarImage src={env.PUBLIC_DEFAULT_AVATAR} alt={personne.name} />
				{/if}
				<AvatarFallback class="rounded-xl bg-sidebar-primary/10 text-sm font-semibold text-sidebar-primary">
					{initial || '?'}
				</AvatarFallback>
			</Avatar>
			<div class="mb-2 min-w-0 flex-1">
				<div class="text-lg font-semibold leading-snug text-foreground">
					{personne.name} {personne.lastname}
				</div>
				<div class="mt-1 flex flex-wrap items-center gap-2">
					<span class="inline-flex items-center gap-2 text-xs text-muted-foreground">
						<UserRound class="size-3.5" />
						{roleLabel}
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

			{#if tags && tags.length}
				<div class="flex flex-wrap gap-2">
					{#each tags as tag}
						<Badge variant="secondary" class="rounded-md px-2.5 py-1 text-xs">{tag}</Badge>
					{/each}
				</div>
			{/if}

			{#if stats}
				<div class="grid grid-cols-3 gap-2 pt-2 border-t border-sidebar-border">
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
						<p class="font-bold {stats.incidents > 0 ? 'text-red-500' : 'text-emerald-500'}">{stats.incidents}</p>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<div class="border-t border-sidebar-border bg-sidebar/40 px-8 py-3">
		<Button size="sm" variant="default" class="h-8 rounded-lg px-3 text-xs w-full justify-center" onclick={() => goto(hrefProfil)}>
			Voir profil
		</Button>
	</div>
</CardUI>
