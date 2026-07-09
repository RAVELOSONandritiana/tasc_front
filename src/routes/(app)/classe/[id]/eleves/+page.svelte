<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { EleveCours } from '$lib/types/Materiel.type';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import { Trash, Plus } from '@lucide/svelte/icons';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	const { data }: PageProps = $props();

	let searchEleve = $state('');
	let elevesInscrits = $state<EleveCours[]>([...data.elevesInscrits]);

	let openAddExistingDialog = $state(false);
	let searchExisting = $state('');
	let elevesDisponibles: { id: string; nom: string; prenom: string; dateNaissance: string }[] = $state([]);
	let loadingDisponibles = $state(false);
	let selectedExistingId = $state('');

	const elevesFiltres = $derived(
		elevesInscrits.filter((e) =>
			`${e.nom}${e.prenom}`.toLowerCase().includes(searchEleve.toLowerCase())
		)
	);

	const disponiblesFiltres = $derived(
		searchExisting.trim().length === 0
			? elevesDisponibles
			: elevesDisponibles.filter((e) =>
					`${e.nom}${e.prenom}`.toLowerCase().includes(searchExisting.toLowerCase())
				)
	);

	function removeEleve(id: string) {
		elevesInscrits = elevesInscrits.filter((e) => e.id !== id);
	}

	async function loadElevesDisponibles() {
		loadingDisponibles = true;
		try {
			const res = await fetch(`/classe/${$page.params.id}/eleves?/getDisponibles`);
			const result = await res.json();
			if (result.success) {
				elevesDisponibles = result.elevesDisponibles || [];
			}
		} catch (e) {
			console.error('Failed to load disponibles:', e);
		} finally {
			loadingDisponibles = false;
		}
	}

	onMount(() => {
		if (openAddExistingDialog && elevesDisponibles.length === 0) {
			loadElevesDisponibles();
		}
	});

	$effect(() => {
		if (openAddExistingDialog && elevesDisponibles.length === 0) {
			loadElevesDisponibles();
		}
		if (!openAddExistingDialog) {
			searchExisting = '';
			selectedExistingId = '';
		}
	});
</script>

<div class="flex h-screen flex-col bg-sidebar text-sidebar-foreground">
	<div
		class="sticky top-16 z-50 flex justify-between border-b border-sidebar-border bg-sidebar p-4"
	>
		<SearchInput placeholder="Rechercher un élève" bind:value={searchEleve} />

		<div class="flex gap-2">
			<Dialog.Root bind:open={openAddExistingDialog}>
				<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default' })}>
					<Plus class="mr-2 size-4" />
					Nouvel élève
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[500px]">
					<Dialog.Header>
						<Dialog.Title>Ajouter un nouvel élève</Dialog.Title>
						<Dialog.Description>Sélectionnez un élève déjà inscrit dans l'établissement</Dialog.Description>
					</Dialog.Header>

					{#if loadingDisponibles}
						<p class="text-sm text-muted-foreground">Chargement...</p>
					{:else}
						<div class="grid gap-4 py-4">
							<div class="grid gap-2">
								<Label>Rechercher</Label>
								<SearchInput placeholder="Rechercher un élève..." bind:value={searchExisting} />
							</div>

							{#if disponiblesFiltres.length === 0}
								<p class="text-sm text-muted-foreground">Aucun élève disponible pour l'inscription.</p>
							{:else}
								<div class="max-h-72 space-y-2 overflow-y-auto rounded-md border p-2">
									{#each disponiblesFiltres as e (e.id)}
										{@const isSelected = selectedExistingId === e.id}
										<button
											type="button"
											class="flex w-full flex-col rounded-md border px-3 py-2 text-left transition-colors {isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted'}"
											onclick={() => selectedExistingId = isSelected ? '' : e.id}
										>
											<p class="text-sm font-medium">{e.nom} {e.prenom}</p>
											<p class="text-xs text-muted-foreground">
												{e.dateNaissance ? new Date(e.dateNaissance).toLocaleDateString() : ''}
											</p>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					<Dialog.Footer class="gap-2">
						<Button
							variant="outline"
							size="sm"
							type="button"
							disabled={!selectedExistingId}
							onclick={() => {
								const formData = new FormData();
								formData.append('eleveId', selectedExistingId);
								fetch(`/classe/${data.classeId || ''}/eleves?/addExisting`, {
									method: 'POST',
									body: formData,
									credentials: 'same-origin'
								})
								.then(async (res) => {
									const result = await res.json();
									if (result.success && result.eleve) {
										elevesInscrits = [...elevesInscrits, {
											id: result.eleve.id,
											nom: result.eleve.nom,
											prenom: result.eleve.prenom,
											dateNaissance: result.eleve.dateNaissance,
											actif: result.eleve.actif,
											notes: [],
											incidents: [],
											absences: [],
											retards: []
										}];
										selectedExistingId = '';
										searchExisting = '';
										openAddExistingDialog = false;
									} else {
										alert(result.error || "Erreur lors de l'ajout de l'élève");
									}
								})
								.catch(() => {
									alert("Erreur réseau lors de l'ajout de l'élève");
								});
							}}
						>
							Ajouter
						</Button>
						<Button
							variant="outline"
							size="sm"
							onclick={() => {
								openAddExistingDialog = false;
							}}
						>
							Annuler
						</Button>
					</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	</div>
	</div>

	<div class="flex-1 overflow-y-auto p-4">
		<p class="mb-4 text-sm text-muted-foreground">
			Tous les élèves inscrits seront automatiquement affectés aux examens de chaque cours.
		</p>

		<div class="overflow-x-auto rounded-md border">
			<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Nom</Table.Head>
					<Table.Head>Prénom</Table.Head>
					<Table.Head>Date naissance</Table.Head>
					<Table.Head class="text-center">Notes</Table.Head>
					<Table.Head class="text-center">Moyenne</Table.Head>
					<Table.Head class="text-center">Incidents</Table.Head>
					<Table.Head class="text-center">Absences</Table.Head>
					<Table.Head class="text-center">Retards</Table.Head>
					<Table.Head class="text-center">Action</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each elevesFiltres as eleve (eleve.id)}
					<Table.Row>
						<Table.Cell class="font-medium">{eleve.nom}</Table.Cell>
						<Table.Cell>{eleve.prenom}</Table.Cell>
						<Table.Cell>
							{eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString() : '—'}
						</Table.Cell>
						<Table.Cell class="text-center">
							{eleve.notes?.length || 0}
						</Table.Cell>
						<Table.Cell class="text-center">
							{eleve.notes && eleve.notes.length > 0
								? (
										eleve.notes.reduce((sum, n) => sum + n.valeur, 0) / eleve.notes.length
									).toFixed(1)
								: '—'}
						</Table.Cell>
						<Table.Cell class="text-center">
							{eleve.incidents?.length || 0}
						</Table.Cell>
						<Table.Cell class="text-center">
							{eleve.absences?.length || 0}
						</Table.Cell>
						<Table.Cell class="text-center">
							{eleve.retards?.length || 0}
						</Table.Cell>
						<Table.Cell class="text-center">
							<form method="POST" action="?/delete" use:enhance={() => {
								return async ({ result }: { result: ActionResult }) => {
									if (result.type === 'success') {
										removeEleve(eleve.id);
									}
								};
							}}>
								<input type="hidden" name="id" value={eleve.id} />
								<Button type="submit" variant="destructive" size="icon" class="size-8">
									<Trash class="size-4" />
								</Button>
							</form>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
			</Table.Root>
		</div>
	</div>
</div>
