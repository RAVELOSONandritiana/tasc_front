<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as NativeSelect from '$lib/components/ui/native-select';
	import { Search } from '@lucide/svelte/icons';
	import SearchInput from '$lib/components/user/SearchInput.svelte';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { matiere } from '$lib/variables/territoire';
	import { Pencil, Users } from '@lucide/svelte/icons';
	import type { Cours } from '$lib/types/Materiel.type';

	let searchCours = $state('');

	let nouveaCours: Partial<Cours> = $state({
		nom: '',
		coefficient: 1,
		professeur: ''
	});

	let nouveauCoeff = $state(1);

	let coursSelectionne = $state<Cours | null>(null);

	let listeCours = $state<Cours[]>([
		{
			id: '1',
			nom: 'Mathématiques',
			coefficient: 6,
			professeur: 'RANDRIANANTENAINA Tsitoarimanjakely',
			eleves: []
		},
		{
			id: '2',
			nom: 'Physique',
			coefficient: 4,
			professeur: 'ANDRIANTENAINA Bako',
			eleves: []
		},
		{
			id: '3',
			nom: 'Français',
			coefficient: 5,
			professeur: 'RAKOTO Fanomezamasy',
			eleves: []
		}
	]);

	const coursFiltres = $derived(
		listeCours.filter((c) => c.nom.toLowerCase().includes(searchCours.toLowerCase()) || (c.professeur?.toLowerCase() || '').includes(searchCours.toLowerCase()))
	);

	function ajouterCours() {
		if (!nouveaCours.nom || nouveaCours.coefficient! < 1) return;
		const nouveau: Cours = {
			id: Date.now().toString(),
			nom: nouveaCours.nom,
			coefficient: nouveaCours.coefficient || 1,
			professeur: nouveaCours.professeur,
			eleves: []
		};
		listeCours = [...listeCours, nouveau];
		nouveaCours = { nom: '', coefficient: 1, professeur: '' };
	}

	function modifierCoefficient(cours: Cours) {
		coursSelectionne = cours;
		nouveauCoeff = cours.coefficient;
	}

	function sauvegarderCoefficient() {
		if (coursSelectionne) {
			coursSelectionne.coefficient = nouveauCoeff;
			coursSelectionne = null;
		}
	}
</script>

<div class="min-h-full bg-sidebar text-sidebar-foreground">
	<div class="sticky top-16 z-50 flex justify-between bg-sidebar p-4">
		<SearchInput placeholder="Rechercher un cours" bind:value={searchCours} />

		<Dialog.Root>
			<form>
				<Dialog.Trigger type="button" class={buttonVariants({ variant: 'default' })}>
					Nouveau cours
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Ajouter un cours</Dialog.Title>
						<Dialog.Description>Créez un nouveau cours pour cette classe</Dialog.Description>
					</Dialog.Header>
					<div class="grid gap-4 py-4">
						<div class="grid gap-2">
							<Label for="nom_cours">Matière *</Label>
							<NativeSelect.Root bind:value={nouveaCours.nom}>
								{#each matiere as m (m)}
									<NativeSelect.Option value={m}>{m}</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>
						<div class="grid gap-2">
							<Label for="coeff">Coefficient *</Label>
							<Input
								id="coeff"
								type="number"
								min="1"
								max="20"
								bind:value={nouveaCours.coefficient}
								placeholder="Ex: 6"
							/>
						</div>
						<div class="grid gap-2">
							<Label for="prof">Professeur</Label>
							<Input
								id="prof"
								bind:value={nouveaCours.professeur}
								placeholder="Nom du professeur"
							/>
						</div>
					</div>
					<Dialog.Footer>
						<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
							Annuler
						</Dialog.Close>
						<Dialog.Close class={buttonVariants({ variant: 'default' })} onclick={ajouterCours}>
							Créer
						</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</form>
		</Dialog.Root>
	</div>

	<div class="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
		{#each coursFiltres as cours (cours.id)}
			<CardUI>
				<div class="p-4">
					<div class="flex items-start justify-between">
						<h3 class="text-lg font-semibold">{cours.nom}</h3>
						<div class="flex gap-1">
							<Button
								size="icon"
								variant="ghost"
								class="h-7 w-7"
								onclick={() => modifierCoefficient(cours)}
							>
								<Pencil class="size-4" />
							</Button>
						</div>
					</div>
					<div class="mt-3 space-y-2">
						<p class="text-sm">
							<span class="text-muted-foreground">Coefficient :</span>
							<span class="ml-1 font-medium">{cours.coefficient}</span>
						</p>
						{#if cours.professeur}
							<p class="text-sm">
								<span class="text-muted-foreground">Professeur :</span>
								<span class="ml-1 font-medium">{cours.professeur}</span>
							</p>
						{/if}
						<p class="text-sm">
							<span class="text-muted-foreground">Élèves :</span>
							<span class="ml-1 font-medium">{cours.eleves?.length || 0}</span>
						</p>
					</div>
					<div class="mt-4 flex gap-2">
						<Button
							size="sm"
							variant="secondary"
							class="flex-1"
							onclick={() => {
								/* Voir les élèves du cours */
							}}
						>
							<Users class="mr-1 size-3" />
							Élèves
						</Button>
					</div>
				</div>
			</CardUI>
		{/each}
	</div>
</div>

<AlertDialog.Root open={coursSelectionne !== null}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Modifier le coefficient</AlertDialog.Title>
			<AlertDialog.Description>
				Changez le coefficient du cours {coursSelectionne?.nom}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<div class="py-4">
			<Label for="new_coeff">Nouveau coefficient</Label>
			<Input
				id="new_coeff"
				type="number"
				min="1"
				max="20"
				bind:value={nouveauCoeff}
			/>
		</div>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => (coursSelectionne = null)}>
				Annuler
			</AlertDialog.Cancel>
			<AlertDialog.Action onclick={sauvegarderCoefficient}>
				Sauvegarder
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>