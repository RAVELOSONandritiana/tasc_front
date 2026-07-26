<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	const {
		children
	}: {
		children: Snippet;
	} = $props();

	const id = $page.params.id;

	const navigation = [
		{ path: `/classe/${id}/cours`, label: 'Cours', number: 0 },
		{ path: `/classe/${id}/eleves`, label: 'Eleve', number: 1 },
		{ path: `/classe/${id}/edt`, label: 'Emploi du temps', number: 2 },
		{ path: `/classe/${id}/bulletin`, label: 'Bulletins', number: 3 },
		{ path: `/classe/${id}/deliberation`, label: 'Délibération', number: 4 }
	];

	const activePathIndex = $derived(
		(() => {
			const idx = navigation.findIndex((n) => $page.url.pathname.startsWith(n.path));
			return idx !== -1 ? idx : 0;
		})()
	);

	function setCurrentTab(pageNumber: number) {
		const newpath = navigation.find((e) => e.number == pageNumber)?.path;
		if (newpath) goto(newpath);
	}
</script>

<header class="sticky top-16 border-b border-sidebar-border bg-sidebar/80 backdrop-blur-sm shadow-sm">
	<nav>
		<ul class="flex flex-wrap items-center justify-start gap-x-3 gap-y-2 px-4 py-2">
			{#each navigation as n (n.label)}
				<Button
					class="px-3"
					onclick={() => setCurrentTab(n.number)}
					variant={activePathIndex == n.number ? 'default' : 'secondary'}>{n.label}</Button
				>
			{/each}
		</ul>
	</nav>
</header>

{@render children()}
