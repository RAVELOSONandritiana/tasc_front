<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '../ui/button/button.svelte';

	let {
		label = '',
		creator = '',
		image,
		id = 0
	}: {
		label: string;
		creator: string;
		image?: string;
		id: number;
	} = $props();

	function gotoId() {
		goto(`/app/anne-scolaire/${id}`);
	}
</script>

<div
	class="overflow-hidden rounded-lg border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm transition-shadow duration-200 hover:shadow"
>
	<div class="aspect-video overflow-hidden">
		{#if image}
			<img
				src={image}
				alt={label}
				class="h-full w-full object-cover transition-all duration-300 hover:scale-105 hover:grayscale-100"
			/>
		{:else}
			<div class="flex h-full items-center justify-center bg-sidebar-accent transition-all duration-300 hover:scale-105">
				<div
					class="flex items-center justify-center bg-linear-to-br from-purple-600 via-blue-400 to-black bg-clip-text"
				>
					<h3 class="text-2xl font-bold text-transparent">{label}</h3>
				</div>
			</div>
		{/if}
	</div>
	<div class="space-y-4 p-4">
		<h2 class="text-lg font-semibold">{label}</h2>
		<h4 class="text-sm text-sidebar-foreground/60">{creator}</h4>
		<Button class="w-full" onclick={gotoId}>Inspecter</Button>
	</div>
</div>
