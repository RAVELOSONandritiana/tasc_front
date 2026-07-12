<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Plus } from '@lucide/svelte/icons';
	import type { Cours, EleveCours } from '$lib/types/Materiel.type';

	let {
		open = $bindable(false),
		matieres = [],
		enseignants = [],
		elevesClasse = [],
		onCreate
	}: {
		open?: boolean;
		matieres: { id: string; nom: string }[];
		enseignants: { id: string; name: string; lastname: string }[];
		elevesClasse: EleveCours[];
		onCreate?: (cours: Cours) => void;
	} = $props();

	let submitting = $state(false);
	let success = $state(false);
	let errors = $state<Record<string, string>>({});

	let nouveauCours = $state({
		matiereId: '',
		professeurId: '',
		coefficient: 1,
		participants: [] as string[]
	});

	let participantsSelectionnes = $state<string[]>([]);

	let nouvelleMatiereNom = $state('');
	let matiereSelection = $state('');

	$effect(() => {
		if (open) {
			nouveauCours = { matiereId: '', professeurId: '', coefficient: 1, participants: [] };
			nouvelleMatiereNom = '';
			matiereSelection = '';
			participantsSelectionnes = elevesClasse.map((e) => e.id);
			errors = {};
			success = false;
		}
	});

	function toggleParticipant(eleveId: string) {
		if (participantsSelectionnes.includes(eleveId)) {
			participantsSelectionnes = participantsSelectionnes.filter((id) => id !== eleveId);
		} else {
			participantsSelectionnes = [...participantsSelectionnes, eleveId];
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Ajouter un cours</Dialog.Title>
			<Dialog.Description>Associer une matière et un professeur</Dialog.Description>
		</Dialog.Header>

		{#if success}
			<div class="mb-4 rounded-md border border-emerald-500 bg-emerald-500/10 p-3 text-center">
				<p class="text-sm font-medium text-emerald-500">Cours créé avec succès !</p>
			</div>
		{/if}
		{#if errors._form}
			<div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3">
				<p class="text-sm text-destructive">{errors._form}</p>
			</div>
		{/if}

		<form
			method="POST"
			action="?/createCours"
			use:enhance={() => {
				submitting = true;
				errors = {};
				return async ({ result }) => {
					submitting = false;
					const data = result.data as { cours?: Cours; error?: string; _form?: string } | undefined;
					if (result.type === 'success') {
						const cours = data?.cours;
						if (cours && onCreate) {
							onCreate({
								id: cours.id,
								nom: cours.matiere?.nom || 'Matière',
								coefficient: cours.coefficient,
								matiereId: cours.matiereId,
								professeur: cours.professeur
									? `${cours.professeur.personne?.name || ''} ${cours.professeur.personne?.lastname || ''}`.trim() || ''
									: '',
								participants: cours.participants || [],
								url: cours.imageUrl || undefined
							});
						}
						success = true;
						setTimeout(() => {
							open = false;
						}, 600);
					} else if (result.type === 'failure') {
						const err = data?.error || data?._form || 'Erreur lors de la création';
						errors = { _form: err };
					}
				};
			}}
			class="space-y-4"
		>
			<div class="grid gap-2">
				<Label>Matière *</Label>
				<NativeSelect.Root bind:value={matiereSelection}>
					<option value="">Choisir une matière</option>
					{#each matieres as matiere (matiere.id)}
						<NativeSelect.Option value={matiere.id}>{matiere.nom}</NativeSelect.Option>
					{/each}
					<NativeSelect.Option value="__new__">+ Nouvelle matière</NativeSelect.Option>
				</NativeSelect.Root>
				{#if matiereSelection === '__new__'}
					<Input name="matiereNom" placeholder="Nom de la nouvelle matière" required />
				{:else if matiereSelection}
					<input type="hidden" name="matiereId" value={matiereSelection} />
				{/if}
			</div>

			<div class="grid gap-2">
				<Label for="professeurId">Professeur *</Label>
				<NativeSelect.Root name="professeurId" required>
					<option value="">Choisir un professeur</option>
					{#each enseignants as prof (prof.id)}
						<NativeSelect.Option value={prof.id}>
							{prof.name} {prof.lastname}
						</NativeSelect.Option>
					{/each}
				</NativeSelect.Root>
			</div>

			<div class="grid gap-2">
				<Label for="coefficient">Coefficient</Label>
				<Input
					id="coefficient"
					name="coefficient"
					type="number"
					min="1"
					max="20"
					value="1"
				/>
			</div>

			<div class="grid gap-2">
				<Label>Participants (élèves)</Label>
				<div class="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
					{#each elevesClasse as eleve (eleve.id)}
						<div class="flex items-center gap-2">
							<Checkbox
								id={`eleve-${eleve.id}`}
								checked={participantsSelectionnes.includes(eleve.id)}
								onCheckedChange={() => toggleParticipant(eleve.id)}
							/>
							<label for={`eleve-${eleve.id}`} class="text-sm">
								{eleve.nom} {eleve.prenom}
							</label>
						</div>
					{/each}
				</div>
				{#each participantsSelectionnes as participantId}
					<input type="hidden" name="participants" value={participantId} />
				{/each}
			</div>

			<div class="flex items-center gap-2">
				<Button type="submit" disabled={submitting || success}>
					{#if submitting}
						<Spinner class="mr-2 size-4" />
						Création...
					{:else if success}
						Créé !
					{:else}
						<Plus class="mr-2 size-4" />
						Créer le cours
					{/if}
				</Button>
				<Button type="button" variant="outline" onclick={() => (open = false)}>Annuler</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
