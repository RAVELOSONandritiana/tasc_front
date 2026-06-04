<script lang="ts">
	import Classe from '$lib/components/user/classe/Classe.svelte';

	const { data } = $props();

	// svelte-ignore state_referenced_locally
	const {listClasse} = data;
</script>

<main class="flex-1 bg-sidebar p-6 text-sidebar-foreground">
	<div class="grid grid-cols-2 lg:grid-cols-3">
        {#each listClasse as l (l.id)}
            <Classe />
        {/each}
    </div>
</main>
