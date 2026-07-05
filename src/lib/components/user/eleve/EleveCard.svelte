<script lang="ts">
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Calendar, Shield, Users } from '@lucide/svelte/icons';
	import { goto } from '$app/navigation';
	import type { Eleve } from '$lib/types/Personne.type';

	const { eleve }: { eleve: Eleve } = $props();

	const stats = $derived.by(() => {
		if (!eleve.stats) return null;
		return {
			retards: eleve.stats.retards,
			absences: eleve.stats.absences,
			incidents: eleve.stats.incidents
		};
	});
</script>

<CardUI
	class="group flex h-full flex-col overflow-hidden transition-all duration-200 hover:shadow-md"
>
	<div class="flex-1 p-4">
		<div class="flex items-center gap-3">
			<Avatar class="size-10 transition-transform duration-200 group-hover:scale-105">
				<AvatarFallback class="text-sm font-bold text-primary"
					>{eleve.prenom[0]}{eleve.nom[0]}</AvatarFallback
				>
			</Avatar>
			<div class="min-w-0 flex-1">
				<h3 class="truncate text-sm font-semibold">{eleve.prenom} {eleve.nom}</h3>
				<Badge variant="secondary" class="mt-0.5 text-[10px]">{eleve.classe}</Badge>
			</div>
		</div>

		{#if stats}
			<div class="mt-3 grid grid-cols-3 gap-2 text-center">
				<div>
					<p class="text-xs text-muted-foreground">Retards</p>
					<p class="font-bold text-amber-500">{stats.retards}</p>
				</div>
				<div>
					<p class="text-xs text-muted-foreground">Absences</p>
					<p class="font-bold text-red-500">{stats.absences}</p>
				</div>
				<div>
					<p class="text-xs text-muted-foreground">Incidents</p>
					<p class="font-bold {stats.incidents > 0 ? 'text-red-500' : 'text-emerald-500'}">
						{stats.incidents}
					</p>
				</div>
			</div>
		{/if}
	</div>

	<div class="border-t border-sidebar-border bg-sidebar/40 px-4 py-3">
		<Button
			variant="default"
			size="sm"
			class="h-7 w-full justify-center text-xs"
			onclick={() => goto(`/eleves/${eleve.id}`)}
		>
			Voir profil
		</Button>
	</div>
</CardUI>
