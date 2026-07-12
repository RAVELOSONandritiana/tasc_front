<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { CalendarDays } from '@lucide/svelte/icons';
	import type { AnneeScolaire } from '@prisma/client';

	let {
		annees = [],
		activeId = ''
	}: {
		annees?: { id: string; nom: string; active: boolean }[];
		activeId?: string;
	} = $props();

	let switching = $state(false);

	async function changer(id: string) {
		if (id === activeId || switching) return;
		switching = true;
		try {
			const fd = new FormData();
			fd.append('id', id);
			await fetch('/annee/set-active', {
				method: 'POST',
				body: fd,
				credentials: 'same-origin'
			});
			await invalidateAll();
		} catch (e) {
			console.error('Échec changement année', e);
		} finally {
			switching = false;
		}
	}
</script>

<div class="flex items-center gap-2">
	<CalendarDays class="size-4 text-muted-foreground" />
	<select
		class="rounded-md border border-input bg-background px-2 py-1 text-sm"
		value={activeId}
		disabled={switching}
		onchange={(e) => changer((e.currentTarget as HTMLSelectElement).value)}
		title="Année scolaire active"
	>
		{#each annees as annee (annee.id)}
			<option value={annee.id}>{annee.nom}{annee.active ? ' •' : ''}</option>
		{/each}
	</select>
</div>
