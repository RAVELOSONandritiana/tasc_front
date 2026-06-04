<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	const {
		children
	}: {
		children: Snippet;
	} = $props();

	const id = $page.params.id;

	const navigation = [
		{ path: `/classe/${id}/cours`, label: 'Cours', number: 0 },
		{ path: `/classe/${id}/eleves`, label: 'Eleve', number: 1 }
	];

	let activePath = $state(0);

	function setCurrentTab(pageNumber: number) {
		activePath = pageNumber;
		const newpath = navigation.filter((e) => e.number == activePath)[0].path;
		goto(newpath);
	}
</script>

<header class="border-b shadow-sm">
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
