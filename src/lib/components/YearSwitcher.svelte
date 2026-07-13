<script lang="ts">
	import { CalendarDays } from '@lucide/svelte/icons';
	import type { AnneeScolaire } from '@prisma/client';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';

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
			const res = await fetch('/annee/set-active', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ id }),
				credentials: 'same-origin'
			});
			if (!res.ok) throw new Error('Échec changement année');
			// Recharge la page pour refléter la nouvelle année scolaire sur toutes les
			// données (les listes copient les données serveur dans un état local).
			window.location.reload();
		} catch (e) {
			console.error('Échec changement année', e);
			switching = false;
		}
	}
</script>

<div class="flex items-center gap-2">
	<CalendarDays class="size-4 text-muted-foreground" />
	<NativeSelect.Root
		class="w-fit"
		value={activeId}
		disabled={switching}
		onchange={(e) => changer((e.currentTarget as HTMLSelectElement).value)}
		title="Année scolaire active"
	>
		{#each annees as annee (annee.id)}
			<NativeSelect.Option value={annee.id}
				>{annee.nom}{annee.active ? ' •' : ''}</NativeSelect.Option
			>
		{/each}
	</NativeSelect.Root>
</div>
