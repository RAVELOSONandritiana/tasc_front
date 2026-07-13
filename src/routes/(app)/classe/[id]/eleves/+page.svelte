<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { EleveCours } from '$lib/types/Materiel.type';
	import type { PageProps } from './$types';
	import { loadingForm } from '$lib/actions/loadingForm';
	import type { ActionResult } from '@sveltejs/kit';
	import { Trash, Plus, UserCheck, X, Printer } from '@lucide/svelte';
	import { formatClasseNom } from '$lib/utils';
	import ConfirmDeleteDialog from '$lib/components/user/ConfirmDeleteDialog.svelte';

	const { data }: PageProps = $props();

	let searchEleve = $state('');
	let elevesInscrits = $state<EleveCours[]>([...data.elevesInscrits]);
	let elevesDisponibles = $state<
		{ id: string; nom: string; prenom: string; dateNaissance: string }[]
	>([...(data.elevesDisponibles || [])]);

	let openAddDialog = $state(false);
	let searchQuery = $state('');
	let selectedExistingId = $state('');

	const elevesFiltres = $derived(
		elevesInscrits.filter((e) =>
			`${e.nom}${e.prenom}`.toLowerCase().includes(searchEleve.toLowerCase())
		)
	);

	const resultats = $derived(
		searchQuery.trim().length > 0 && !selectedExistingId
			? elevesDisponibles.filter((e) =>
					`${e.nom} ${e.prenom}`.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: []
	);

	const eleveSelectionne = $derived(
		selectedExistingId ? elevesDisponibles.find((e) => e.id === selectedExistingId) || null : null
	);

	function resetAddDialog() {
		searchQuery = '';
		selectedExistingId = '';
	}

	function selectEleve(e: { id: string; nom: string; prenom: string; dateNaissance: string }) {
		selectedExistingId = e.id;
		searchQuery = `${e.nom} ${e.prenom}`;
	}

	let confirmOpen = $state(false);
	let submittingDelete = $state(false);
	let deleteForm = $state<HTMLFormElement | null>(null);
	let eleveToDelete = $state<{ id: string; nom: string; prenom: string } | null>(null);
	let datePresence = $state(new Date().toISOString().split('T')[0]);

	function removeEleve(id: string) {
		elevesInscrits = elevesInscrits.filter((e) => e.id !== id);
	}

	function inscrireLocalement(eleve: {
		id: string;
		nom: string;
		prenom: string;
		dateNaissance: string;
		actif: boolean;
	}) {
		elevesInscrits = [
			...elevesInscrits,
			{
				id: eleve.id,
				nom: eleve.nom,
				prenom: eleve.prenom,
				dateNaissance: eleve.dateNaissance,
				actif: eleve.actif,
				notes: [],
				incidents: [],
				absences: [],
				retards: []
			}
		];
		elevesDisponibles = elevesDisponibles.filter((e) => e.id !== eleve.id);
	}

	let presenceOpen = $state(false);
	function numeroClasse(eleve: EleveCours): string {
		const ordre =
			[...elevesInscrits]
				.sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'))
				.findIndex((e) => e.id === eleve.id) + 1;
		const suffix = eleve.sexe === 'F' ? 'F' : 'G';
		return `${ordre}${suffix}`;
	}
</script>

<div class="flex min-h-full flex-col bg-sidebar text-sidebar-foreground">
	<div
		class="sticky top-16 z-50 flex justify-between border-b border-sidebar-border bg-sidebar p-4 {presenceOpen
			? 'print:hidden'
			: ''}"
	>
		<SearchInput placeholder="Rechercher un élève" bind:value={searchEleve} />

		<div class="flex gap-2">
			<Button variant="outline" onclick={() => (presenceOpen = true)}>
				<Printer class="mr-2 size-4" />
				Liste de présence
			</Button>
			<Dialog.Root
				bind:open={openAddDialog}
				onOpenChange={(open) => {
					if (!open) resetAddDialog();
				}}
			>
				<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default' })}>
					<Plus class="mr-2 size-4" />
					Nouvel élève
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[500px]">
					<Dialog.Header>
						<Dialog.Title>Ajouter un élève à la classe</Dialog.Title>
						<Dialog.Description>
							Recherchez puis sélectionnez un élève déjà inscrit dans l'établissement.
						</Dialog.Description>
					</Dialog.Header>

					<div class="grid gap-4 py-2">
						<div class="grid gap-2">
							<Label>Rechercher un élève</Label>
							<div class="relative">
								<Input
									id="searchExisting"
									placeholder="Nom de l'élève..."
									value={searchQuery}
									oninput={(e) =>
										(searchQuery = (e.target as HTMLInputElement).value
											.replace(/\s+/g, ' ')
											.trimStart())}
								/>

								{#if resultats.length > 0 && !selectedExistingId}
									<div class="mt-2 max-h-64 space-y-2 overflow-y-auto rounded-md border p-2">
										{#each resultats as e (e.id)}
											<button
												type="button"
												class="flex w-full flex-col rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted"
												onclick={() => selectEleve(e)}
											>
												<p class="text-sm font-medium">{e.nom} {e.prenom}</p>
												<p class="text-xs text-muted-foreground">
													{e.dateNaissance ? new Date(e.dateNaissance).toLocaleDateString() : ''}
												</p>
											</button>
										{/each}
									</div>
								{/if}

								{#if eleveSelectionne}
									<div
										class="mt-2 flex items-center justify-between gap-2 rounded-lg bg-muted/30 p-2"
									>
										<div class="flex items-center gap-2">
											<div
												class="flex size-8 items-center justify-center rounded-full bg-primary/10"
											>
												<span class="text-sm font-bold text-primary">
													{eleveSelectionne.nom[0]}{eleveSelectionne.prenom[0]}
												</span>
											</div>
											<span class="text-sm font-medium">
												{eleveSelectionne.nom}
												{eleveSelectionne.prenom}
											</span>
										</div>
										<button
											type="button"
											class="rounded-full p-1 hover:bg-muted"
											onclick={() => {
												selectedExistingId = '';
												searchQuery = '';
											}}
										>
											<X class="size-4 text-muted-foreground" />
										</button>
									</div>
								{/if}
							</div>
						</div>

						{#if searchQuery.trim().length > 0 && resultats.length === 0 && !selectedExistingId}
							<p class="text-sm text-muted-foreground">Aucun élève correspondant trouvé.</p>
						{/if}
					</div>

					<Dialog.Footer class="gap-2">
						<form
							method="POST"
							action="?/addExisting"
							use:loadingForm={{
								handler: () => {
									return async ({ result }: { result: ActionResult }) => {
										if (result.type === 'success' && result.data?.eleve) {
											const eleve = result.data.eleve as {
												id: string;
												nom: string;
												prenom: string;
												dateNaissance: string;
												actif: boolean;
											};
											inscrireLocalement(eleve);
											selectedExistingId = '';
											searchQuery = '';
											openAddDialog = false;
											resetAddDialog();
										} else if (result.type === 'failure') {
											alert(result.data?.error || "Erreur lors de l'ajout de l'élève");
										}
									};
								}
							}}
						>
							<input type="hidden" name="eleveId" value={selectedExistingId} />
							<Button type="submit" variant="outline" size="sm" disabled={!selectedExistingId}>
								<UserCheck class="mr-2 size-4" />
								Ajouter
							</Button>
						</form>
						<Button variant="outline" size="sm" onclick={() => (openAddDialog = false)}>
							Annuler
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</div>

	<div class="flex-1 overflow-y-auto p-4 {presenceOpen ? 'print:hidden' : ''}">
		<p class="mb-4 text-sm text-muted-foreground">
			Tous les élèves inscrits seront automatiquement affectés aux examens de chaque cours.
		</p>

		<div class="overflow-x-auto rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="text-center">N° classe</Table.Head>
						<Table.Head>Nom</Table.Head>
						<Table.Head>Prénom</Table.Head>
						<Table.Head>Date naissance</Table.Head>
						<Table.Head>Domicile</Table.Head>
						<Table.Head class="text-center">Incidents</Table.Head>
						<Table.Head class="text-center">Absences</Table.Head>
						<Table.Head class="text-center">Retards</Table.Head>
						<Table.Head class="text-center">Action</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each elevesFiltres as eleve (eleve.id)}
						<Table.Row>
							<Table.Cell class="text-center font-semibold">{numeroClasse(eleve)}</Table.Cell>
							<Table.Cell class="font-medium">{eleve.nom}</Table.Cell>
							<Table.Cell>{eleve.prenom}</Table.Cell>
							<Table.Cell>
								{#if eleve.dateNaissance}
									{new Date(eleve.dateNaissance).toLocaleDateString()}
								{:else}
									<span class="text-muted-foreground/50">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell>
								{#if eleve.domicile}
									{eleve.domicile}
								{:else}
									<span class="text-muted-foreground/50">—</span>
								{/if}
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
								<Button
									type="button"
									variant="destructive"
									size="icon"
									class="size-8"
									title="Supprimer"
									onclick={() => {
										eleveToDelete = eleve;
										confirmOpen = true;
									}}
								>
									<Trash class="size-4" />
								</Button>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</div>

	<form
		bind:this={deleteForm}
		method="POST"
		action="?/delete"
		use:loadingForm={{
			handler: () => {
				submittingDelete = true;
				return async ({ result }: { result: ActionResult }) => {
					submittingDelete = false;
					if (result.type === 'success' && eleveToDelete) {
						removeEleve(eleveToDelete.id);
						confirmOpen = false;
					} else if (result.type === 'failure') {
						alert(result.data?.error || 'Suppression impossible');
					}
				};
			}
		}}
	>
		<input type="hidden" name="id" value={eleveToDelete?.id || ''} />
	</form>

	<ConfirmDeleteDialog
		bind:open={confirmOpen}
		title="Retirer l'élève de la classe"
		description={eleveToDelete
			? `Êtes-vous sûr de vouloir retirer ${eleveToDelete.prenom} ${eleveToDelete.nom} de cette classe ? Cette action est irréversible.`
			: ''}
		loading={submittingDelete}
		onConfirm={() => deleteForm?.requestSubmit()}
	/>

	{#if presenceOpen}
		<div
			class="fixed inset-0 z-[100] overflow-auto bg-white p-8 text-black print:static print:bg-white print:p-0"
		>
			<div class="mb-4 flex items-center justify-between print:hidden">
				<Button variant="outline" onclick={() => (presenceOpen = false)}>Retour</Button>
				<Button onclick={() => window.print()}>Imprimer</Button>
			</div>

			<h1 class="mb-3 text-left text-xl font-bold uppercase">
				{formatClasseNom(data.classe?.niveau, data.classe?.nom)} — Liste de présence
			</h1>

			<div class="mb-4 flex items-center gap-2 text-sm">
				<span class="font-semibold">Date :</span>
				<span>{new Date(datePresence).toLocaleDateString('fr-FR')}</span>
			</div>

			<table class="w-full border-collapse border border-black text-sm">
				<thead>
					<tr>
						<th class="border border-black px-2 py-1 text-left">Nom</th>
						<th class="border border-black px-2 py-1 text-left">Prénom</th>
						<th class="border border-black px-2 py-1 text-left">N° classe</th>
						<th class="border border-black px-2 py-1 text-left">Présent / Absent</th>
					</tr>
				</thead>
				<tbody>
					{#each elevesInscrits as eleve (eleve.id)}
						<tr>
							<td class="border border-black px-2 py-2">{eleve.nom}</td>
							<td class="border border-black px-2 py-2">{eleve.prenom}</td>
							<td class="border border-black px-2 py-2">{numeroClasse(eleve)}</td>
							<td class="border border-black px-2 py-2"></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
