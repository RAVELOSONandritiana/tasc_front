<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import type { Snippet } from 'svelte';
	import ImageSalle from '$lib/assets/images/530476.jpg';
	const {
		children
	}: {
		children?: Snippet;
	} = $props();
</script>

<Card.Root class="transition-duration m-0 gap-y-0 p-0">
	<Card.Content class="m-0 p-0 h-40">
		<!-- svelte-ignore a11y_img_redundant_alt -->
		<img
			src={ImageSalle}
			alt="image salle"
			class="transitio-all h-full w-full object-cover duration-400 hover:scale-105 hover:grayscale-75"
		/>
	</Card.Content>
	<Card.Footer class="m-0 flex flex-col items-start justify-center gap-5 bg-white/10 p-4">
		{#if children}
			{@render children()}
		{/if}
	</Card.Footer>
</Card.Root>
