<script lang="ts">
	import { enhance } from '$app/forms';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import PersonCard from '$lib/components/user/PersonCard.svelte';
	import PersonAvatar from '$lib/components/user/PersonAvatar.svelte';
	import type { PageProps } from './$types';
	import type { Personne } from '$lib/types/Personne.type';
	import type { RoleCompte } from '@prisma/client';

	type ServerPersonne = {
		id: string;
		name: string;
		lastname: string;
		domicile: string | null;
		fokontany: string | null;
		commune: string | null;
		phone: string;
		email: string;
		compte?: { id: string; matricule: string; role: RoleCompte } | null;
		createdAt?: string | Date;
		updatedAt?: string | Date;
	};

	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import { Card } from '$lib/components/ui/card';
	import { UserCog, Plus, X } from '@lucide/svelte/icons';
	import { Spinner } from '$lib/components/ui/spinner';
	import type { ActionResult } from '@sveltejs/kit';

	const { data }: PageProps = $props();

	let listProfesseur = $state(data.professeur);

	function supprimerProf(id: string) {
		listProfesseur = listProfesseur.filter((p) => p.id !== id);
	}
	const allPersonnel = $state<Personne[]>((data.personnel || []).map((p: ServerPersonne) => ({
		id: p.id,
		name: p.name,
		lastname: p.lastname,
		domicile: p.domicile ?? undefined,
		fokontany: p.fokontany ?? undefined,
		commune: p.commune ?? undefined,
		phone: p.phone,
		email: p.email,
		compte: p.compte ?? undefined
	})));

	let searchText = $state('');
	let dialogOpen = $state(false);
	let submitting = $state(false);
	let success = $state(false);
	let searchQuery = $state('');
	let selectedPersonne = $state<Personne | null>(null);
	let matricule = $state('');

	const listFiltered = $derived(
		listProfesseur.filter((p) =>
			`${p.name}${p.lastname}${p.email}${p.phone}`.toLowerCase().includes(searchText.toLowerCase())
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
	}

	function onSearchChange(value: string) {
		searchQuery = value.replaceAll(' ','').toLowerCase();
	}

	function selectPersonne(p: Personne) {
		selectedPersonne = p;
		searchQuery = p.name;
		matricule = p.compte?.matricule || '';
	}
</script>

<main class="flex min-h-[100dvh] flex-col bg-background text-foreground">
	<div class="flex-1 overflow-y-auto">
		<div class="sticky top-0 z-10 border-b border-sidebar-border bg-background p-4 md:p-6">
			<div class="space-y-4">
				<div
					class="animate-slide-down flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="flex items-center gap-3">
						<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
							<UserCog class="size-5 text-primary" />
						</div>
						<div>
							<h1 class="text-xl font-bold tracking-tight">Enseignants</h1>
							<p class="text-xs text-muted-foreground">
								{listFiltered.length} enseignant{listFiltered.length > 1 ? 's' : ''}
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
					<SearchInput bind:value={searchText} placeholder="Rechercher un professeur" />
				</Card>
			</div>
		</div>

		<div class="p-4 md:p-6">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each listFiltered as prof, i (i)}
					<div
						class="animate-slide-up opacity-0"
						style="animation-delay: {Math.min(i * 50, 400)}ms"
					>
						<PersonCard
						personne={prof}
						role="ENSEIGNANT"
						detail={`Matière - ${[...new Set(prof.cours?.map((c) => c.matiereNom) || [])].join(', ') || '—'}`}
						email={prof.email}
						phone={prof.phone}
						domicile={prof.domicile}
						hrefProfil={`/profil/${prof.compte?.id || prof.personneId}`}
						onDelete={supprimerProf}
					/>
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
					const newProf = result.data?.result;
					if (newProf?.professeur && newProf?.personne) {
						const mappedProf = {
							id: newProf.professeur.id,
							name: newProf.personne.name,
							lastname: newProf.personne.lastname,
							domicile: newProf.personne.domicile || '',
							fokontany: newProf.personne.fokontany || '',
							commune: newProf.personne.commune || '',
							phone: newProf.personne.phone,
							email: newProf.personne.email,
							matiere: newProf.professeur.matiere,
							compte: newProf.compte,
							stats: {
								retards: newProf.professeur.retards,
								absences: newProf.professeur.absences,
								nbCours: newProf.professeur.nbCours,
								incidents: newProf.professeur.incidents,
								notesPositives: newProf.professeur.notesPositives,
								notesNegatives: newProf.professeur.notesNegatives
							}
						};
						listProfesseur = [...listProfesseur, mappedProf];
					}
					success = true;
					setTimeout(() => { dialogOpen = false; resetForm(); }, 800);
				}
			};
		}}>
			<Dialog.Header class="mb-1 space-y-1">
				<Dialog.Title class="text-xl font-semibold">Ajouter un professeur</Dialog.Title>
				<Dialog.Description>
					Recherchez un personnel existant et associez-lui un profil enseignant.
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
									class="flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left hover:bg-muted transition-colors"
									onclick={() => selectPersonne(p)}
								>
									<PersonAvatar imageUrl={p.imageUrl} name={p.name} lastname={p.lastname} sizeClass="size-9" />
									<div class="min-w-0">
										<p class="text-sm font-medium">{p.name} {p.lastname}</p>
										<p class="text-xs text-muted-foreground">{p.email || ''}</p>
										<p class="text-xs text-muted-foreground">{p.phone || ''}</p>
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				{#if selectedPersonne}
					<div class="flex items-center justify-between gap-2 rounded-md border p-3">
						<div class="flex min-w-0 items-center gap-3">
							<PersonAvatar imageUrl={selectedPersonne.imageUrl} name={selectedPersonne.name} lastname={selectedPersonne.lastname} sizeClass="size-9" />
							<div class="min-w-0">
								<p class="text-sm font-medium">{selectedPersonne.name} {selectedPersonne.lastname}</p>
								<p class="text-xs text-muted-foreground">{selectedPersonne.email || ''}</p>
								<p class="text-xs text-muted-foreground">{selectedPersonne.phone || ''}</p>
							</div>
						</div>
						<button
							type="button"
							class="rounded-full p-1 hover:bg-muted"
							onclick={() => { selectedPersonne = null; searchQuery = ''; matricule = ''; }}
						>
							<X class="size-4 text-muted-foreground" />
						</button>
					</div>
				{/if}

				{#if selectedPersonne}
					<div class="grid gap-2">
						<Label for="matricule">Matricule</Label>
						<Input id="matricule" name="matricule" bind:value={matricule} placeholder="Ex: ENS-047" />
					</div>
				{/if}
			</div>

			<input type="hidden" name="personneId" value={selectedPersonne?.id || ''} />
			<input type="hidden" name="matricule" value={matricule} />

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