<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { Snippet } from 'svelte';
	import { env } from '$env/dynamic/public';
	const {
		children
	}: {
		children?: Snippet;
	} = $props();
</script>

<Card.Root class="transition-duration m-0 gap-y-0 p-0">
	<Card.Content class="m-0 h-40 p-0">
		<!-- svelte-ignore a11y_img_redundant_alt -->
		<img
			src={env.PUBLIC_DEFAULT_IMAGE_PERSONNE}
			alt="image salle"
			class="transitio-all h-full w-full object-cover duration-400 hover:scale-105 hover:grayscale-75"
		/>
	</Card.Content>
	<Card.Footer class="m-0 flex flex-col items-start justify-center gap-5 bg-white/10 p-4">
		{#if children}
			{@render children()}
		{/if}
		<div class="flex w-full items-center justify-between">
			<div></div>
			<Button>Voir profil</Button>
		</div>
	</Card.Footer>
</Card.Root>
