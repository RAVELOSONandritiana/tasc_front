<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '@iconify/svelte';

	let {
		name,
		lastname,
		image,
		sexe,
		header,
		children,
		footer
	}: {
		name: string;
		lastname: string;
		image?: string;
		sexe: number;
		header?: Snippet;
		children?: Snippet;
		footer?: Snippet;
	} = $props();
</script>

<div>
	{#if header}
		{@render header()}
	{:else}
		<div>
			{#if image}
				<img src={image} alt={image} />
			{:else if sexe == 0}
				<Icon icon="lucide:mars" class="h-6 w-6 text-blue-500" />
			{:else}
				<Icon icon="lucide:venus" class="h-6 w-6 text-pink-500" />
			{/if}

			<div>
				<h1>{name}</h1>
				<h3>{lastname}</h3>
			</div>
		</div>
	{/if}

	{#if children}
		{@render children()}
	{/if}

	{#if footer}
		{@render footer()}
	{/if}
</div>
