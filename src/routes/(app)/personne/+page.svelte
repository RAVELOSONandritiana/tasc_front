<script lang="ts">
	import PersonnelCard from '$lib/components/user/profil/PersonnelCard.svelte';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import type { PageProps } from './$types';

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
</script>

<main class="min-h-full bg-sidebar text-sidebar-foreground">
	<div class="flex justify-between p-4 top-16 sticky z-50 bg-sidebar">
		<SearchInput bind:value={searchText} placeholder="Rechercher une personne" />
	</div>

	<div class="p-4">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
			{#each filteredPersonnel as p (p.phone)}
				<PersonnelCard personne={p} role="Personnel" hrefContact={`mailto:${p.email}`} />
			{/each}
		</div>
	</div>
</main>
