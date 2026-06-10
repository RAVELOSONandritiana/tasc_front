<script lang="ts">
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { Snippet } from 'svelte';
	const {
		children
	}: {
		children?: Snippet;
	} = $props();
</script>

<CardUI>
	<div class="relative h-20 w-full">
		<div class="absolute inset-0 bg-gradient-to-br from-sidebar-accent/40 via-sidebar to-sidebar-accent/20" />
		<div class="absolute inset-0 bg-gradient-to-b from-transparent to-sidebar/80" />
	</div>
	<div class="px-8 pb-5 pt-0">
		<div class="relative -mt-8 flex items-end gap-4">
			<span class="inline-flex size-12 items-center justify-center rounded-xl border-[3px] border-sidebar bg-sidebar-primary/10 text-base font-semibold text-sidebar-primary shadow-md">
				{children}
			</span>
			<div class="mb-1 min-w-0">
				<slot />
			</div>
		</div>
	</div>

	<div class="border-t border-sidebar-border bg-sidebar/40 px-8 py-3 sm:flex sm:items-center sm:justify-between">
		<div class="mb-2 sm:mb-0">
			<span class="inline-flex items-center gap-2 text-xs text-muted-foreground">
				<span class="relative inline-flex size-2 rounded-full bg-muted-foreground/60" />
				Profil local
			</span>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" class="h-8 rounded-lg px-3 text-xs">Voir profil</Button>
		</div>
	</div>
</CardUI>
