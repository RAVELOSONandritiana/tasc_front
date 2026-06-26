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
		{ path: `/classe/${id}/bulletin`, label: 'Bulletins', number: 3 }
	];

	let activePath = $state(0);

	function setCurrentTab(pageNumber: number) {
		activePath = pageNumber;
		const newpath = navigation.filter((e) => e.number == activePath)[0].path;
		goto(newpath);
	}
</script>

<header class="border-b shadow-sm sticky z-100 top-16 bg-sidebar">
	<nav>
		<ul class="flex items-center justify-start gap-x-3 px-4 py-2">
			{#each navigation as n (n.label)}
				<Button
					class="px-3"
					onclick={() => setCurrentTab(n.number)}
					variant={activePath == n.number ? 'default' : 'secondary'}>{n.label}</Button
				>
			{/each}
		</ul>
	</nav>
</header>

{@render children()}
