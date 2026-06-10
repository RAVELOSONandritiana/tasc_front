<script lang="ts">
	import PersonnelCard from '$lib/components/user/profil/PersonnelCard.svelte';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';

	const { data }: PageProps = $props();
	const { personnes } = data;

	let searchText = $state('');

	const filteredPersonnel = $derived(
		personnes.filter((p) =>
			`${p.name}${p.lastname}${p.email}${p.domicile}${p.fokontany}${p.commune}${p.phone}`
				.toLowerCase()
				.includes(searchText.toLowerCase())
		)
	);

	function goNew() {
		goto('/personne/new');
	}
</script>

<main class="min-h-full bg-sidebar text-sidebar-foreground">
	<div class="flex justify-between p-4 top-16 sticky z-50 bg-sidebar">
		<SearchInput bind:value={searchText} placeholder="Rechercher une personne" />
		<Button class="h-9 rounded-lg px-5 text-sm font-medium" onclick={goNew}> Nouveau </Button>
	</div>

	<div class="p-4">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
			{#each filteredPersonnel as p (p.phone)}
				<PersonnelCard personne={p} role="Personnel" />
			{/each}
		</div>
	</div>
</main>
