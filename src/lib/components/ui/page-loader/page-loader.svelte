<script lang="ts">
	import { navigating } from '$app/stores';
	import { Spinner } from '$lib/components/ui/spinner';

	// On n'affiche le loader qu'au bout d'un court délai pour éviter un
	// flash désagréable lors des navigations instantanées.
	let visible = $state(false);
	let timer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if ($navigating) {
			timer = setTimeout(() => {
				visible = true;
			}, 150);
		} else {
			if (timer) clearTimeout(timer);
			timer = null;
			visible = false;
		}
	});
</script>

{#if visible}
	<div
		class="fixed inset-0 z-[9998] flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm"
		role="status"
		aria-live="polite"
	>
		<Spinner class="size-10 text-primary" />
		<p class="text-sm font-medium text-muted-foreground">Chargement en cours…</p>
	</div>
{/if}
