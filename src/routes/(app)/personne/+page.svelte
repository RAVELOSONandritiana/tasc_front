<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import PesonnelProfil from '$lib/components/user/profil/PesonnelProfil.svelte';
	import type { PageProps } from './$types';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import { Label } from '$lib/components/ui/label';

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
	<div class="sticky top-16 z-50 flex justify-between bg-sidebar p-4">
		<SearchInput placeholder="Rechercher une personne" bind:value={searchText} />
		<Button onclick={() => goto('personne/new')}>Nouveau</Button>
	</div>
	<div class="grid grid-cols-1 gap-8 p-4 md:grid-cols-2 lg:grid-cols-3">
		{#each filteredPersonnel as p (p.phone)}
			<PesonnelProfil>
				<div class="space-y-2">
					<Label>Nom : {p.name}</Label>
					<Label>Prenom : {p.lastname}</Label>
					<Label>Phone : {p.phone}</Label>
					<Label>Email : {p.email}</Label>
				</div>
			</PesonnelProfil>
		{/each}
	</div>
</main>
