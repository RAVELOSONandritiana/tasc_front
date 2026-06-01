<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import SurveillantProfil from '$lib/components/user/profil/SurveillantProfil.svelte';
	import type { Personne } from '$lib/types/Personne.type';

	const {data} = $props();

	const personnes: Personne[] = data.personnes;

	let searchText = $state('');

	const filteredPersonnel = $derived(
		personnes.filter((p) =>
			`${p.name}${p.lastname}${p.email}${p.domicile}${p.fokontany}${p.commune}${p.phone}`
				.toLowerCase()
				.includes(searchText.toLowerCase())
		)
	);
</script>

<main class="min-h-full rounded-md bg-sidebar p-4 text-sidebar-foreground">
	<div class="flex justify-between">
		<Input
			type="search"
			placeholder="Rechercher une personne"
			class="max-w-md"
			bind:value={searchText}
		/>
		<Button onclick={() => goto('personne/new')}>Nouveau</Button>
	</div>
	<div class="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-3">
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
