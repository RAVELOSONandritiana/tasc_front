<script lang="ts">
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { Personne } from '$lib/types/Personne.type';
	import { Mail, Phone, UserRound } from '@lucide/svelte/icons';
	import Avatar from '$lib/components/ui/avatar/avatar.svelte';
	import AvatarFallback from '$lib/components/ui/avatar/avatar-fallback.svelte';
	import AvatarImage from '$lib/components/ui/avatar/avatar-image.svelte';
	import { env } from '$env/dynamic/public';

	type Surveillant = Personne & { poste: string };

	let {
		personne,
		tags,
		hrefProfil = '/surveillant',
		hrefContact = '#'
	}: {
		personne: Surveillant;
		tags?: string[];
		hrefProfil?: string;
		hrefContact?: string;
	} = $props();

	const initial = $derived(
		(personne.name?.charAt(0) || '') + (personne.lastname?.charAt(0) || '')
	);

	const roleLabel = $derived((tags && tags[0]) || 'Surveillant');
</script>

<CardUI>
	<div class="relative h-20 w-full">
		<div class="absolute inset-0 bg-gradient-to-br from-sidebar-accent/40 via-sidebar to-sidebar-accent/20" />
		<div class="absolute inset-0 bg-gradient-to-b from-transparent to-sidebar/80" />
	</div>
	<div class="px-8 pb-5 pt-0">
		<div class="relative -mt-10 mb-4 flex items-end gap-4">
			<Avatar class="h-16 w-16 rounded-xl border-[3px] border-sidebar shadow-md">
				{#if env.PUBLIC_DEFAULT_AVATAR}
					<AvatarImage src={env.PUBLIC_DEFAULT_AVATAR} alt={personne.name} />
				{/if}
				<AvatarFallback class="rounded-xl bg-sidebar-primary/10 text-sm font-semibold text-sidebar-primary">
					{initial || '?'}
				</AvatarFallback>
			</Avatar>
			<div class="mb-2 min-w-0">
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
			<div class="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
				<span class="inline-flex items-center gap-2">
					<Mail class="size-3.5" />
					<span class="truncate">{personne.email || '—'}</span>
				</span>
				<span class="hidden h-3 w-px bg-sidebar-border sm:block" />
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
		</div>
	</div>

	<div class="border-t border-sidebar-border bg-sidebar/40 px-8 py-3 sm:flex sm:items-center sm:justify-between">
		<div class="mb-2 sm:mb-0">
			{#if personne.connected}
				<span class="inline-flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
					<span class="relative inline-flex size-2 rounded-full bg-emerald-500">
						<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
						<span class="relative inline-flex size-2 rounded-full bg-emerald-500" />
					</span>
					Connecté
				</span>
			{:else}
				<span class="inline-flex items-center gap-2 text-xs text-muted-foreground">
					<span class="inline-flex size-2 rounded-full bg-muted-foreground/60" />
					Hors ligne
				</span>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<Button
				variant="ghost"
				size="sm"
				class="h-8 rounded-lg px-3 text-xs"
				onclick={() => window.open(hrefContact)}
			>
				Contacter
			</Button>
			<Button size="sm" variant="default" class="h-8 rounded-lg px-3 text-xs" onclick={() => (window.location.href = hrefProfil)}>
				Voir profil
			</Button>
		</div>
	</div>
</CardUI>
