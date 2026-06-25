<script lang="ts">
	import EleveCard from '$lib/components/user/eleve/EleveCard.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let listEleve = $state([...data.list_eleve]);
	let searchText = $state('');
	let resetDialogOpen = $state(false);

	const elevesFiltres = $derived(
		listEleve.filter(
			(e) =>
				`${e.nom}${e.prenom}`.toLowerCase().includes(searchText.toLowerCase())
		)
	);
</script>

<main class="flex-1 bg-sidebar text-sidebar-foreground">
	<div class="flex flex-wrap items-center justify-between gap-4 p-4">
		<SearchInput placeholder="Rechercher un élève" bind:value={searchText} />
		<div class="flex gap-2">
			<AlertDialog.Root bind:open={resetDialogOpen}>
				<AlertDialog.Trigger class={buttonVariants({ variant: 'outline', size: 'sm' })}>
					Nouvelle année
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Confirmer la nouvelle année scolaire</AlertDialog.Title>
						<AlertDialog.Description>
							Cela supprimera tous les élèves actuels. Cette action est irréversible.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
						<AlertDialog.Action
							onclick={() => {
								listEleve = [];
								resetDialogOpen = false;
							}}
						>
							Confirmer
						</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
			<Button size="sm" onclick={() => goto('eleves/new')}>Nouvel élève</Button>
		</div>
	</div>

	{#if elevesFiltres.length === 0}
		<div class="flex flex-col items-center justify-center p-8 text-muted-foreground">
			<p>Aucun élève inscrit pour le moment.</p>
			<Button class="mt-4" onclick={() => goto('eleves/new')}>Ajouter un élève</Button>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
			{#each elevesFiltres as eleve (eleve.id)}
				<EleveCard {eleve} />
			{/each}
		</div>
	{/if}
</main>
