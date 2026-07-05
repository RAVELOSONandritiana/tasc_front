<script lang="ts">
	let {
		index = 0,
		base = 'animate-slide-up',
		animate = true
	}: { index?: number; base?: string; animate?: boolean } = $props();

	const staggerMap: Record<number, string> = {
		0: 'stagger-1',
		1: 'stagger-2',
		2: 'stagger-3',
		3: 'stagger-4',
		4: 'stagger-5',
		5: 'stagger-6',
		6: 'stagger-7',
		7: 'stagger-8'
	};

	const classes = $derived(animate ? `${base} ${staggerMap[index] ?? ''} opacity-0` : '');
</script>

<div class={classes}>
	<slot />
</div>
