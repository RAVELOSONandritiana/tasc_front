<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import SurveillantProfil from '$lib/components/user/profil/SurveillantProfil.svelte';
	import type { PageProps } from './$types';
	import SearchInput from '$lib/components/user/SearchInput.svelte';

	const { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	const { personnes } = data;

	let searchText = $state('');

	const filteredPersonnel = $derived(
		personnes.filter((p) =>
			`${p.name}${p.lastname}${p.email}${p.domicile}${p.fokontany}${p.commune}${p.phone}`
				.toLowerCase()
				.includes(searchText.toLowerCase())
		)
	);
</script>

<main class="min-h-full rounded-md bg-sidebar text-sidebar-foreground">
	<div class="p-4 flex justify-between sticky top-16 z-50 bg-sidebar">
		<SearchInput placeholder="Rechercher une personne" bind:value={searchText}/>
		<Button onclick={() => goto('personne/new')}>Nouveau</Button>
	</div>
	<div class="p-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each filteredPersonnel as p (p.phone)}
			<SurveillantProfil
				name={p.name}
				lastname={p.lastname}
				domicile={p.domicile}
				fokontany={p.fokontany}
				commune={p.commune}
				phone={p.phone}
				email={p.email}
				connected={p.connected}
			/>
		{/each}
	</div>
</main>
