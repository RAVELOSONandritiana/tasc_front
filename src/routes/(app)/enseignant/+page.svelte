<script lang="ts">
	import { enhance } from '$app/forms';
	import { Input } from '$lib/components/ui/input';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import PersonnelCard from '$lib/components/user/profil/PersonnelCard.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import type { PageProps } from './$types';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import { Card } from '$lib/components/ui/card';
	import { UserCog, Plus, X } from '@lucide/svelte/icons';

	const { data }: PageProps = $props();

	const listProfesseur = $state(data.professeur);

	let searchText = $state('');
	let dialogOpen = $state(false);
	let submitting = $state(false);
	let success = $state(false);

	let name = $state('');
	let lastname = $state('');
	let email = $state('');
	let phone = $state('');
	let matiereInput = $state('');
	let matieres = $state<string[]>([]);

	function toTitle(value: string): string {
		return value
			.split(' ')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
			.join(' ');
	}

	const listFiltered = $derived(
		listProfesseur.filter((p) =>
			`${p.name}${p.lastname}${p.email}${p.phone}`.toLowerCase().includes(searchText.toLowerCase())
		)
	);

	function addMatiere() {
		if (matiereInput.trim() && !matieres.includes(matiereInput.trim())) {
			matieres = [...matieres, matiereInput.trim()];
			matiereInput = '';
		}
	}

	function removeMatiere(m: string) {
		matieres = matieres.filter((x) => x !== m);
	}

	function resetForm() {
		name = '';
		lastname = '';
		email = '';
		phone = '';
		matieres = [];
		matiereInput = '';
	}
</script>

<main class="flex h-screen flex-col bg-background text-foreground">
	<div class="flex-1 overflow-y-auto">
		<div class="sticky top-0 z-10 border-b border-sidebar-border bg-background p-4 md:p-6">
			<div class="mx-auto max-w-7xl space-y-4">
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
						onclick={() => (dialogOpen = true)}
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

		<div class="mx-auto max-w-7xl p-4 md:p-6">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each listFiltered as prof, i (i)}
					<div
						class="animate-slide-up opacity-0"
						style="animation-delay: {Math.min(i * 50, 400)}ms"
					>
						<PersonnelCard personne={prof} role="Enseignant" hrefProfil={`/enseignant/${prof.id}`} />
					</div>
				{/each}
			</div>
		</div>
	</div>
</main>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<form method="POST" action="?/create" use:enhance={() => {
			submitting = true;
			return async () => {
				submitting = false;
			};
		}}>
			<Dialog.Header class="mb-1 space-y-1">
				<Dialog.Title class="text-xl font-semibold">Ajouter un professeur</Dialog.Title>
				<Dialog.Description
					>Créer un nouveau profil enseignant et associez-lui des matières.</Dialog.Description
				>
			</Dialog.Header>

			<div class="space-y-4 py-2">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="name">Nom *</Label>
						<Input id="name" name="name" bind:value={name} placeholder="Nom"  required />
					</div>
					<div class="grid gap-2">
						<Label for="lastname">Prénom *</Label>
						<Input id="lastname" name="lastname" bind:value={lastname} placeholder="Prénom"  required />
					</div>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="email">Email *</Label>
						<Input id="email" name="email" type="email" bind:value={email} placeholder="exemple@email.com" required />
					</div>
					<div class="grid gap-2">
						<Label for="phone">Téléphone *</Label>
						<Input id="phone" name="phone" type="tel" bind:value={phone} placeholder="+261xxxxxxxx" required />
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="matiere">Matières (séparées par des virgules)</Label>
					<Input
						id="matiere"
						name="matiere"
						bind:value={matiereInput}
						placeholder="Mathématiques, Physiques"
						onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addMatiere())}
					/>
					{#if matieres.length > 0}
						<div class="flex flex-wrap gap-2 mt-2">
							{#each matieres as m}
								<span class="inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold">
									{m}
									<button type="button" onclick={() => removeMatiere(m)} class="ml-1 text-muted-foreground hover:text-foreground">
										<X class="size-3" />
									</button>
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<Dialog.Footer class="mt-2 gap-2 sm:justify-end">
				<Button type="button" variant="outline" size="sm" onclick={() => { resetForm(); dialogOpen = false; }}>Annuler</Button>
				<Button type="submit" variant="default" size="sm" disabled={submitting || success}>
					{success ? 'Créé !' : 'Confirmer'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
