<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import PersonnelCard from '$lib/components/user/profil/PersonnelCard.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import type { Personne, Professeur } from '$lib/types/Personne.type';
	import type { PageProps } from './$types';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';
	import { X } from '@lucide/svelte/icons';

	const { data }: PageProps = $props();

	const listProfesseur = $state(data.professeur);
	const { personnes } = data;

	let searchText = $state('');
	let searchPersonnes = $state('');
	let setPerson: Personne | null = $state(null);
	let matiere = $state<string[]>([]);
	let currentMatiere = $state('');

	const filteredMatieres = $derived(
		personnes.filter((p) =>
			`${p.name}${p.lastname}`.replaceAll(' ', '').toLowerCase().startsWith(searchPersonnes.replaceAll(' ', '').toLowerCase())
		)
	);

	const listFiltered = $derived(
		listProfesseur.filter((p) =>
			`${p.name}${p.lastname}${p.email}${p.phone}`.toLowerCase().includes(searchText.toLowerCase())
		)
	);

	function setPersonne(personne: Personne) {
		setPerson = personne;
	}

	function removeFindPersonne() {
		setPerson = null;
	}

	function addMatiere() {
		if (currentMatiere && !matiere.includes(currentMatiere)) {
			matiere = [...matiere, currentMatiere];
			currentMatiere = '';
		}
	}

	function removeMatiere(m: string) {
		matiere = matiere.filter((x) => x !== m);
	}

	function onSubmit() {
		if (!setPerson) return;
		const personne: Professeur = { ...setPerson, matiere };
		listProfesseur.push({ ...personne, domicile: setPerson.domicile || '', fokontany: setPerson.fokontany || '', commune: setPerson.commune || '', connected: setPerson.connected ?? false } as Professeur);
		setPerson = null;
		matiere = [];
		currentMatiere = '';
		close();
	}

	let open = $state(false);
</script>

<main class="min-h-full bg-sidebar text-sidebar-foreground">
	<div class="flex justify-between p-4 top-16 sticky z-50 bg-sidebar">
		<SearchInput bind:value={searchText} placeholder="Rechercher un professeur" />
		<Button class="h-9 rounded-lg px-5 text-sm font-medium" onclick={() => (open = true)}> Nouveau </Button>
	</div>

	<div class="p-4">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
			{#each listFiltered as p (p.phone || `${p.name}${p.lastname}`)}
				<PersonnelCard
					personne={p}
					role="Enseignant"
					matieres={p.matiere}
					hrefProfil={`/enseignant/${encodeURIComponent(p.phone)}`}
					hrefContact={`mailto:${p.email}`}
				/>
			{/each}
		</div>
	</div>

	<Dialog.Root bind:open>
		<Dialog.Content class="sm:max-w-lg">
			<Dialog.Header class="mb-1 space-y-1">
				<Dialog.Title class="text-xl font-semibold">Ajouter un professeur</Dialog.Title>
				<Dialog.Description>Créez un nouveau profil enseignant et associez-lui des matières.</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-4 py-2">
				<div class="grid gap-3">
					<Label for="n">Nom complet</Label>
					<Input
						id="n"
						placeholder="Entrer un nom ou un numéro de téléphone"
						value={searchPersonnes}
						oninput={(e) => (searchPersonnes = e.currentTarget.value)}
					/>

					{#if setPerson == null && searchPersonnes.length > 1}
						<div class="mt-1 max-h-36 space-y-1 overflow-y-auto rounded-md border p-1">
							{#each filteredMatieres as fp (fp.phone)}
								<button
									class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60"
									onclick={() => setPersonne(fp)}
								>
									<span class="font-medium">{fp.name} {fp.lastname}</span>
									<span class="text-xs text-muted-foreground">{fp.phone}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				{#if setPerson != null}
					<div class="rounded-xl border border-sidebar-border bg-muted/40 p-4">
						<div class="grid gap-4">
							<div class="grid gap-2">
								<Label for="nom">Nom</Label>
								<Input id="nom" value={setPerson.name} disabled />
							</div>
							<div class="grid gap-2">
								<Label for="prenom">Prénom</Label>
								<Input id="prenom" value={setPerson.lastname} disabled />
							</div>
						</div>
						<Button
							variant="ghost"
							size="sm"
							class="mt-3 h-8 rounded-lg text-xs text-destructive hover:text-destructive"
							onclick={removeFindPersonne}
						>
							Supprimer la sélection
						</Button>
					</div>

					<div class="grid gap-4 sm:grid-cols-2">
						<div class="grid gap-2">
							<Label for="matricule">Matricule</Label>
							<Input id="matricule" placeholder="Ex : ENS-047" />
						</div>
						<div class="grid gap-2">
							<Label for="poste">Poste</Label>
							<NativeSelect.Root>
								<NativeSelect.Option value="Enseignant">Enseignant</NativeSelect.Option>
								<NativeSelect.Option value="Professeur Principal">Professeur Principal</NativeSelect.Option>
							</NativeSelect.Root>
						</div>
					</div>

					<div class="grid gap-2">
						<Label for="matiere">Matières</Label>
						<div class="flex gap-2">
							<Input
								id="matiere"
								bind:value={currentMatiere}
								placeholder="Ajouter une matière"
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										addMatiere();
									}
								}}
							/>
							<Button type="button" variant="secondary" onclick={addMatiere}>Ajouter</Button>
						</div>
						{#if matiere.length}
							<div class="flex flex-wrap gap-2 pt-1">
								{#each matiere as m (m)}
									<Badge variant="secondary" class="gap-1 px-2.5 py-1">
										{m}
										<button type="button" class="ml-1 inline-flex rounded-md p-0.5 hover:bg-sidebar-border/60" onclick={() => removeMatiere(m)}>
											<X class="size-3" />
										</button>
									</Badge>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<Dialog.Footer class="mt-2 gap-2 sm:justify-end">
				<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
					Annuler
				</Dialog.Close>
				<Dialog.Close type="button" class={buttonVariants({ variant: 'default' })} onclick={onSubmit} disabled={!setPerson}>
					Confirmer
				</Dialog.Close>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</main>
