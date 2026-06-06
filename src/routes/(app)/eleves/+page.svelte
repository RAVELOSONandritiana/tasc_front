<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import SearchInput from '$lib/components/user/SearchInput.svelte';

	let searchText = $state('');
</script>

<main class="min-h-full rounded-md bg-sidebar p-4 text-sidebar-foreground">
	<div class="flex justify-between">
		<SearchInput placeholder="Rechercher un eleve par nom" bind:value={searchText} />
		<Button onclick={() => goto('eleves/new')}>Nouveau</Button>
	</div>
</main>
