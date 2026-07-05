<script lang="ts">
	import { page } from '$app/stores';

	let { href = '', label = '' } = $props();

	// Vérifier si le lien est actif
	const isActive = $derived($page.url.pathname === href);
</script>

<li>
	<a
		{href}
		class="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors
			{isActive
			? 'bg-primary text-primary-foreground'
			: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}"
	>
		{label}
	</a>
</li>
