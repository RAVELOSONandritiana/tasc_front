<script lang="ts">
	import { env } from '$env/dynamic/public';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import type { Snippet } from 'svelte';
	const {
		children
	}: {
		children?: Snippet;
	} = $props();
</script>

<CardUI>
	<div class="h-40 w-full">
		<img
			src={env.PUBLIC_DEFAULT_IMAGE}
			alt="illustration du cours"
			class="h-full w-full object-cover transition-all duration-300 hover:scale-105 hover:grayscale-75"
		/>
	</div>
	<div class="flex flex-col gap-2 bg-white/5 p-4">
		{#if children}
			{@render children()}
		{/if}
	</div>
</CardUI>
