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
	import { Card } from '$lib/components/ui/card';
	import { UserCog, Plus, X } from '@lucide/svelte/icons';

	const { data }: PageProps = $props();

	const listProfesseur = $state(data.professeur);
	const { personnes } = data;

	let searchText = $state('');
	let searchPersonnes = $state('');
	let setPerson: Personne | null = $state(null);
	let matiere = $state<string[]>([]);
	let currentMatiere = $state('');
	let dialogOpen = $state(false);

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
		listProfesseur.push({ ...personne, domicile: setPerson.domicile || '', fokontany: setPerson.fokontany || '', commune: setPerson.commune || '' });
		setPerson = null;
		matiere = [];
		currentMatiere = '';
		dialogOpen = false;
	}
</script>

<main class="bg-background text-foreground h-screen flex flex-col">
	<div class="flex-1 overflow-y-auto">
		<div class="sticky top-0 z-10 bg-background p-4 md:p-6 border-b border-sidebar-border">
			<div class="mx-auto max-w-7xl space-y-4">
				<div class="animate-slide-down flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex items-center gap-3">
						<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
							<UserCog class="size-5 text-primary" />
						</div>
						<div>
							<h1 class="text-xl font-bold tracking-tight">Enseignants</h1>
							<p class="text-xs text-muted-foreground">{listFiltered.length} enseignant{listFiltered.length > 1 ? 's' : ''}</p>
						</div>
					</div>
					<Button class="h-9 rounded-lg px-5 text-sm font-medium gap-2" onclick={() => (dialogOpen = true)}>
						<Plus class="size-3.5" />
						Nouveau
					</Button>
				</div>

				<Card class="animate-slide-up stagger-1 opacity-0 p-4">
					<SearchInput bind:value={searchText} placeholder="Rechercher un professeur" />
				</Card>
			</div>
		</div>

		<div class="mx-auto max-w-7xl p-4 md:p-6">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each listFiltered as prof, i (prof.id)}
					<div class="animate-slide-up opacity-0" style="animation-delay: {Math.min(i * 50, 400)}ms">
						<PersonnelCard personnel={prof} />
					</div>
				{/each}
			</div>
		</div>
	</div>
</main>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Trigger type="button" class="hidden">Nouveau professeur</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
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
					bind:value={searchPersonnes}
				/>

				{#if !setPerson && searchPersonnes.length > 1}
					<div class="mt-1 max-h-36 space-y-1 overflow-y-auto rounded-md border p-1">
						{#each filteredMatieres as fp (fp.id)}
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

			{#if setPerson}
				<div class="rounded-xl border border-sidebar-border bg-muted/40 p-4">
					<div class="mb-3 flex items-center gap-2">
						<div class="flex size-8 items-center justify-center rounded-full bg-primary/10">
							<span class="text-sm font-bold text-primary">{setPerson.name[0]}{setPerson.lastname[0]}</span>
						</div>
						<div>
							<p class="font-medium">{setPerson.name} {setPerson.lastname}</p>
							<p class="text-xs text-muted-foreground">{setPerson.phone}</p>
						</div>
					</div>
					<Button variant="outline" size="sm" onclick={removeFindPersonne}>Changer de personne</Button>
				</div>
			{/if}

			<div class="grid gap-2">
				<Label for="matiere">Matières (optionnel)</Label>
				<div class="flex flex-wrap gap-2">
					{#each matiere as m (m)}
						<span class="inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold">
							{m}
							<button onclick={() => removeMatiere(m)} class="ml-1 text-muted-foreground hover:text-foreground">
								<X class="size-3" />
							</button>
						</span>
					{/each}
				</div>
				<div class="flex gap-2">
					<Input
						value={currentMatiere}
						oninput={(e) => (currentMatiere = e.currentTarget.value)}
						placeholder="Ajouter une matière"
						class="flex-1"
					/>
					<Button variant="outline" size="sm" onclick={addMatiere}>Ajouter</Button>
				</div>
			</div>
		</div>

		<Dialog.Footer class="mt-2 gap-2 sm:justify-end">
			<Button variant="outline" size="sm" onclick={() => (dialogOpen = false)}>Annuler</Button>
			<Button variant="default" size="sm" onclick={onSubmit}>Créer</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>