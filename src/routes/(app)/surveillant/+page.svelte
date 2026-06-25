<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import SurveillantCard from '$lib/components/user/profil/SurveillantCard.svelte';
	import FindPersonne from '$lib/components/user/profil/FindPersonne.svelte';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';
	import type { Personne, Surveillant } from '$lib/types/Personne.type';
	import type { PageProps } from './$types';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { UserSquare2, Plus } from '@lucide/svelte/icons';

	const { data }: PageProps = $props();

	const listSurveillant = $state(data.listSurveillant);
	const { personnes } = data;

	let searchText = $state('');
	let searchPersonnes = $state('');
	let setPerson: Personne | null = $state(null);
	let poste = $state('Surveillant');

	const findPersonnes = $derived(
		personnes.filter((p) =>
			`${p.name}${p.lastname}`
				.replaceAll(' ', '')
				.toLowerCase()
				.startsWith(searchPersonnes.replaceAll(' ', '').toLowerCase())
		)
	);

	const listFiltered = $derived(
		listSurveillant.filter((p) =>
			`${p.name}${p.lastname}${p.email}${p.phone}${p.poste}`.toLowerCase().includes(searchText.toLowerCase())
		)
	);

	function setPersonne(personne: Personne) {
		setPerson = personne;
	}

	function removeFindPersonne() {
		setPerson = null;
	}

	function onSubmit() {
		if (!setPerson) return;
		listSurveillant.push({ ...setPerson, poste } as Surveillant);
		setPerson = null;
		close();
	}

	let open = $state(false);
</script>

<main class="bg-background text-foreground">
	<div class="mx-auto max-w-7xl p-4 md:p-6 space-y-6">
		<!-- Header -->
		<div class="animate-slide-down flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-3">
				<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
					<UserSquare2 class="size-5 text-primary" />
				</div>
				<div>
					<h1 class="text-xl font-bold tracking-tight">Surveillants</h1>
					<p class="text-xs text-muted-foreground">{listFiltered.length} surveillant{listFiltered.length > 1 ? 's' : ''}</p>
				</div>
			</div>
			<Button class="h-9 rounded-lg px-5 text-sm font-medium gap-2" onclick={() => (open = true)}>
				<Plus class="size-3.5" />
				Nouveau
			</Button>
		</div>

		<!-- Search -->
		<Card class="animate-slide-up stagger-1 opacity-0 p-4">
			<SearchInput bind:value={searchText} placeholder="Rechercher un surveillant" />
		</Card>

		<!-- List -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
			{#each listFiltered as p, i (p.phone || `${p.name}${p.lastname}`)}
				<div class="animate-slide-up opacity-0" style="animation-delay: {Math.min(i * 50, 400)}ms">
					<SurveillantCard
						personne={p}
						tags={[p.poste]}
						hrefProfil={`/surveillant/${encodeURIComponent(p.phone)}`}
					/>
				</div>
			{/each}
		</div>
	</div>

	<Dialog.Root bind:open>
		<Dialog.Content class="sm:max-w-lg">
			<Dialog.Header class="mb-1 space-y-1">
				<Dialog.Title class="text-xl font-semibold">Ajouter un surveillant</Dialog.Title>
				<Dialog.Description>Rapprochez un personnel existant ou créez un nouveau profil de surveillance.</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-4 py-2">
				<div class="grid gap-3">
					<Label for="n">Nom complet</Label>
					<Input
						id="n"
						placeholder="Rechercher par nom ou téléphone"
						value={searchPersonnes}
						oninput={(e) => (searchPersonnes = e.currentTarget.value)}
					/>

					{#if setPerson == null && searchPersonnes.length > 1}
						<div class="mt-1 max-h-36 space-y-1 overflow-y-auto rounded-md border p-1">
							{#each findPersonnes as fp (fp.phone)}
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
						<div class="grid gap-3 sm:grid-cols-2">
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
							<Input id="matricule" placeholder="Ex : SRV-012" />
						</div>
						<div class="grid gap-2">
							<Label for="poste">Poste</Label>
							<NativeSelect.Root bind:value={poste}>
								<NativeSelect.Option value="Surveillant">Surveillant</NativeSelect.Option>
								<NativeSelect.Option value="Surveillant General">Surveillant Général</NativeSelect.Option>
								<NativeSelect.Option value="Surveillant Principal">Surveillant Principal</NativeSelect.Option>
							</NativeSelect.Root>
						</div>
					</div>
				{/if}
			</div>

			<Dialog.Footer class="mt-2 gap-2 sm:justify-end">
				<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}> Annuler </Dialog.Close>
				<Dialog.Close type="button" class={buttonVariants({ variant: 'default' })} onclick={onSubmit} disabled={!setPerson}>
					Confirmer
				</Dialog.Close>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</main>
