<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import type { ComponentProps } from 'svelte';

	let { ref = $bindable(null), class: className, ...restProps }: ComponentProps<typeof DialogPrimitive.Overlay> = $props();
</script>

<DialogPrimitive.Overlay
	data-slot="dialog-overlay"
	class={cn(
		'fixed inset-0 z-40 bg-black/60 backdrop-blur-xs data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
		className
	)}
	bind:ref
	{...restProps}
/>
