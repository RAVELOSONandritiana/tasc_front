<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let loading = $state(false);
	let previousUrl = '';

	onMount(() => {
		const unsubscribe = page.subscribe(($page) => {
			if (previousUrl && previousUrl !== $page.url.pathname) {
				loading = true;
				setTimeout(() => {
					loading = false;
				}, 500);
			}
			previousUrl = $page.url.pathname;
		});

		return unsubscribe;
	});
</script>

<div
	class="fixed top-0 right-0 left-0 z-[9999] h-0.5 bg-primary transition-opacity duration-200 {loading
		? 'opacity-100'
		: 'opacity-0'}"
></div>
