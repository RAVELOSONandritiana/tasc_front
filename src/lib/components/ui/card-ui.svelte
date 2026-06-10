<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		class: className = '',
		children,
		...restProps
	}: {
		class?: string;
		children?: Snippet;
		[key: string]: any;
	} = $props();
</script>

<div class={`overflow-hidden rounded-2xl border border-sidebar-border bg-card/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${className}`} {...restProps}>
	{@render children?.()}
</div>
