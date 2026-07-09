<script lang="ts">
	import { enhance } from '$app/forms';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import SurveillantCard from '$lib/components/user/profil/SurveillantCard.svelte';
	import type { PageProps } from './$types';
	import type { Personne } from '$lib/types/Personne.type';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import { Card } from '$lib/components/ui/card';
	import { UserSquare2, Plus, X } from '@lucide/svelte/icons';
	import { Spinner } from '$lib/components/ui/spinner';
	import type { ActionResult } from '@sveltejs/kit';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';

	const { data }: PageProps = $props();

	let listSurveillant = $state(data.listSurveillant);
	const allPersonnel = $state<Personne[]>(data.personnel || []);

	let searchText = $state('');
	let dialogOpen = $state(false);
	let submitting = $state(false);
	let success = $state(false);
	let searchQuery = $state('');
	let selectedPersonne = $state<Personne | null>(null);
	let matricule = $state('');
	let poste = $state('Surveillant');

	const listFiltered = $derived(
		listSurveillant.filter((p) =>
			`${p.name}${p.lastname}${p.email}${p.phone}${p.poste}`.toLowerCase().includes(searchText.toLowerCase())
		)
	);

	const searchResults = $derived(
		searchQuery.trim().length > 0 && !selectedPersonne
			? allPersonnel.filter((p) =>
				`${p.name} ${p.lastname} ${p.email} ${p.phone}`.toLowerCase().includes(searchQuery.toLowerCase())
			)
			: []
	);

	function resetForm() {
		searchQuery = '';
		selectedPersonne = null;
		matricule = '';
		poste = 'Surveillant';
		success = false;
	}

	function onSearchChange(value: string) {
		searchQuery = value.replace(/\s+/g, ' ').trim();
	}

	function selectPersonne(p: Personne) {
		selectedPersonne = p;
		searchQuery = p.name;
		matricule = p.compte?.matricule || '';
		poste = 'Surveillant';
	}
</script>

<main class="flex h-screen flex-col bg-background text-foreground">
	<div class="flex-1 overflow-y-auto">
		<div class="sticky top-0 z-10 border-b border-sidebar-border bg-background p-4 md:p-6">
			<div class="space-y-4">
				<div
					class="animate-slide-down flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="flex items-center gap-3">
						<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
							<UserSquare2 class="size-5 text-primary" />
						</div>
						<div>
							<h1 class="text-xl font-bold tracking-tight">Surveillants</h1>
							<p class="text-xs text-muted-foreground">
								{listFiltered.length} surveillant{listFiltered.length > 1 ? 's' : ''}
							</p>
						</div>
					</div>
					<Button
						class="h-9 gap-2 rounded-lg px-5 text-sm font-medium"
						onclick={() => { resetForm(); dialogOpen = true; }}
					>
						<Plus class="size-3.5" />
						Nouveau
					</Button>
				</div>

				<Card class="animate-slide-up stagger-1 p-4 opacity-0">
					<SearchInput bind:value={searchText} placeholder="Rechercher un surveillant" />
				</Card>
			</div>
		</div>

		<div class="p-4 md:p-6">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
				{#each listFiltered as p, i (p.phone || `${p.name}${p.lastname}`)}
					<div
						class="animate-slide-up opacity-0"
						style="animation-delay: {Math.min(i * 50, 400)}ms"
					>
						<SurveillantCard personne={p} tags={[p.poste]} hrefProfil={`/profil/${p.compte?.id || p.personneId}`} id={p.personneId} deleteAction="?/delete" />
					</div>
				{/each}
			</div>
		</div>
	</div>
</main>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-106.25">
		<form method="POST" action="?/createFromPersonne" use:enhance={() => {
			submitting = true;
			return async ({ result }: { result: ActionResult }) => {
				submitting = false;
				if (result.type === 'success') {
					const newSurv = result.data?.result;
					if (newSurv?.surveillant && newSurv?.personne) {
						const mappedSurv = {
							id: newSurv.surveillant.id,
							name: newSurv.personne.name,
							lastname: newSurv.personne.lastname,
							domicile: newSurv.personne.domicile || '',
							fokontany: newSurv.personne.fokontany || '',
							commune: newSurv.personne.commune || '',
							phone: newSurv.personne.phone,
							email: newSurv.personne.email,
							poste: newSurv.surveillant.poste,
							stats: {
								retards: newSurv.surveillant.retards,
								absences: newSurv.surveillant.absences,
								heuresCours: newSurv.surveillant.heuresCours,
								incidents: newSurv.surveillant.incidents,
								notesPositives: newSurv.surveillant.notesPositives,
								notesNegatives: newSurv.surveillant.notesNegatives
							}
						};
						listSurveillant = [...listSurveillant, mappedSurv];
					}
					success = true;
					setTimeout(() => { dialogOpen = false; resetForm(); }, 800);
				}
			};
		}}>
			<Dialog.Header class="mb-1 space-y-1">
				<Dialog.Title class="text-xl font-semibold">Ajouter un surveillant</Dialog.Title>
				<Dialog.Description>
					Recherchez un personnel existant et associez-lui un profil surveillant.
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-4 py-2">
				<div class="grid gap-2">
					<Label for="search">Nom *</Label>
					<Input
						id="search"
						name="search"
						placeholder="Rechercher par nom..."
						value={searchQuery}
						oninput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
					/>
					{#if searchResults.length > 0 && !selectedPersonne}
						<div class="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-md border p-2">
							{#each searchResults as p (p.id)}
								<button
									type="button"
									class="flex w-full flex-col rounded-md border px-3 py-2 text-left hover:bg-muted transition-colors"
									onclick={() => selectPersonne(p)}
								>
									<p class="text-sm font-medium">{p.name} {p.lastname}</p>
									<p class="text-xs text-muted-foreground">{p.email || ''}</p>
									<p class="text-xs text-muted-foreground">{p.phone || ''}</p>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				{#if selectedPersonne}
					<div class="flex items-center justify-between gap-2 rounded-md border p-3">
						<div>
							<p class="text-sm font-medium">{selectedPersonne.name} {selectedPersonne.lastname}</p>
							<p class="text-xs text-muted-foreground">{selectedPersonne.email || ''}</p>
							<p class="text-xs text-muted-foreground">{selectedPersonne.phone || ''}</p>
						</div>
						<button
							type="button"
							class="rounded-full p-1 hover:bg-muted"
							onclick={() => { selectedPersonne = null; searchQuery = ''; matricule = ''; poste = 'Surveillant'; }}
						>
							<X class="size-4 text-muted-foreground" />
						</button>
					</div>
				{/if}

				{#if selectedPersonne}
					<div class="grid gap-2">
						<Label for="matricule">Matricule</Label>
						<Input id="matricule" name="matricule" bind:value={matricule} placeholder="Ex: SRV-047" />
					</div>
				{/if}

				{#if selectedPersonne}
					<div class="grid gap-2">
						<Label for="poste">Poste</Label>
						<NativeSelect.Root class="w-full" bind:value={poste} name="poste">
							<NativeSelect.Option value="Surveillant">Surveillant</NativeSelect.Option>
							<NativeSelect.Option value="Surveillant General">Surveillant Général</NativeSelect.Option>
							<NativeSelect.Option value="Surveillant Principal">Surveillant Principal</NativeSelect.Option>
						</NativeSelect.Root>
					</div>
				{/if}
			</div>

			<input type="hidden" name="personneId" value={selectedPersonne?.id || ''} />
			<input type="hidden" name="poste" value={poste} />

			<Dialog.Footer class="mt-2 gap-2 sm:justify-end">
				<Button type="button" variant="outline" size="sm" onclick={() => { resetForm(); dialogOpen = false; }}>Annuler</Button>
				<Button type="submit" variant="default" size="sm" disabled={submitting || success || !selectedPersonne}>
					{#if submitting}
						<Spinner class="mr-2 size-4" />
						Création...
					{:else if success}
						Créé !
					{:else}
						Confirmer
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
