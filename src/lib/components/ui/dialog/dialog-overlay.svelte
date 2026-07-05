<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import type { ComponentProps } from 'svelte';

	let { ref = $bindable(null), class: className, ...restProps } = $props();
</script>

<DialogPrimitive.Overlay
	data-slot="dialog-overlay"
	class={cn(
		'fixed inset-0 z-40 bg-background/80 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
		className
	)}
	bind:ref
	{...restProps}
/>
