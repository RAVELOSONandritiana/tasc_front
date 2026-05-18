<script>
	import { page } from '$app/stores';
	import Link from '$lib/components/user/Link.svelte';

	let { children } = $props();

	const id = $page.params.id;

	const links = [
		{ path: `/app/anne-scolaire/${id}`, label: 'Surveillant' },
		{ path: `/app/anne-scolaire/${id}/prof`, label: 'Professeur' },
		{ path: `/app/anne-scolaire/${id}/classe`, label: 'Classe' },
		{ path: `/app/anne-scolaire/${id}/parametre`, label: 'Paramètre' }
	];
</script>

<header class="border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
	<nav class="py-3">
		<ul class="mx-4 flex items-center gap-2">
			{#each links as link (link.label)}
				<Link label={link.label} href={link.path} />
			{/each}
		</ul>
	</nav>
</header>

{@render children()}
