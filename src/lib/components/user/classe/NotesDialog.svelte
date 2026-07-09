<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Switch as SwitchPrimitive
	} from '$lib/components/ui/switch/index.js';
	import type { WithoutChildrenOrChild } from '$lib/utils.js';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import type { Cours, EleveCours, Examen, Note } from '$lib/types/Materiel.type';

	let {
		open = $bindable(false),
		cours,
		elevesClasse = [],
		listeExamens = [],
		notesCours = [],
		notesLoading = false,
		onCreateNote,
		onLoadNotes
	}: {
		open?: boolean;
		cours: Cours | null;
		elevesClasse: EleveCours[];
		listeExamens: Examen[];
		notesCours: Note[];
		notesLoading: boolean;
		onCreateNote?: (note: {
			valeur: number;
			coefficient: number;
			libelle: string;
			eleveId: string;
			coursId: string;
			examenId?: string;
		}) => void;
		onLoadNotes?: (coursId: string) => void;
	} = $props();

	let errors = $state<Record<string, string>>({});

	let nouvelleNote = $state({
		valeur: 0,
		coefficient: 1,
		libelle: '',
		eleveId: '',
		coursId: '',
		examenId: ''
	});

	let utiliserCoefficientCours = $state(false);
	let typeNotation = $state<'sur_20' | 'sur_10' | 'sur_100' | 'sur_5'>('sur_20');
	let valeurSaisie = $state(0);
	let apercuSur20 = $state(0);

	$effect(() => {
		if (open) {
			nouvelleNote = {
				valeur: 0,
				coefficient: 1,
				libelle: '',
				eleveId: '',
				coursId: '',
				examenId: ''
			};
			utiliserCoefficientCours = false;
			typeNotation = 'sur_20';
			valeurSaisie = 0;
			apercuSur20 = 0;
			errors = {};
		}
	});

	function calculerApercu() {
		if (!open) {
			apercuSur20 = 0;
			return;
		}
		const v = Number(valeurSaisie);
		switch (typeNotation) {
			case 'sur_10':
				apercuSur20 = Number.isFinite(v) ? v * 2 : 0;
				break;
			case 'sur_100':
				apercuSur20 = Number.isFinite(v) ? v / 5 : 0;
				break;
			case 'sur_5':
				apercuSur20 = Number.isFinite(v) ? v * 4 : 0;
				break;
			case 'sur_20':
			default:
				apercuSur20 = Number.isFinite(v) ? v : 0;
		}
	}

	$effect(() => {
		calculerApercu();
	});

	function openNotesDialog() {
		if (cours) {
			onLoadNotes?.(cours.id);
		}
	}

	$effect(() => {
		if (open && cours) {
			openNotesDialog();
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-3xl">
		<Dialog.Header>
			<Dialog.Title>Gérer les notes - {cours?.nom}</Dialog.Title>
			<Dialog.Description>Ajouter et consulter les notes pour ce cours</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-4">
			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-3 rounded-md border p-4">
					<h3 class="text-sm font-semibold">Ajouter une note</h3>

					{#if errors._form}
						<div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3">
							<p class="text-sm text-destructive">{errors._form}</p>
						</div>
					{/if}

					<form
						method="POST"
						action="?/createNote"
						use:enhance={() => {
							errors = {};
							return async ({ result }) => {
								if (result.type === 'success' && cours) {
									onLoadNotes?.(cours.id);
									nouvelleNote = {
										valeur: 0,
										coefficient: 1,
										libelle: '',
										eleveId: '',
										coursId: '',
										examenId: ''
									};
									valeurSaisie = 0;
									typeNotation = 'sur_20';
									apercuSur20 = 0;
									utiliserCoefficientCours = false;
								} else if (result.type === 'failure') {
									const error =
										(result.data as any)?.error ||
										(result.data as any)?._form ||
										'Erreur lors de la création de la note';
									errors = { _form: error };
								}
							};
						}}
						class="space-y-3"
					>
						<input type="hidden" name="coursId" value={cours?.id || ''} />
						<input type="hidden" name="coefficientMode" value={utiliserCoefficientCours ? 'cours' : 'unitaire'} />

						<div class="grid gap-2 w-full">
							<Label for="eleveId">Élève *</Label>
							<NativeSelect.Root name="eleveId" required class="w-full">
								<option value="">Choisir un élève</option>
								{#each elevesClasse as eleve (eleve.id)}
									<NativeSelect.Option value={eleve.id}>
										{eleve.nom} {eleve.prenom}
									</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>

						<div class="grid gap-2 w-full">
							<Label for="typeNotation">Type de notation</Label>
							<NativeSelect.Root name="typeNotation" bind:value={typeNotation} class="w-full">
								<option value="sur_20">Sur 20</option>
								<option value="sur_10">Sur 10</option>
								<option value="sur_100">Sur 100</option>
								<option value="sur_5">Sur 5</option>
							</NativeSelect.Root>
						</div>

						<div class="grid gap-2 w-full">
							<Label for="valeur">Note *</Label>
							<Input
								id="valeur"
								name="valeur"
								type="number"
								step="0.5"
								min="0"
								max="20"
								required
								bind:value={valeurSaisie}
								class="w-full"
							/>
							{#if typeNotation !== 'sur_20'}
								<p class="text-xs text-muted-foreground">
									Aperçu sur 20 : {apercuSur20.toFixed(2)}/20
								</p>
							{/if}
						</div>

						<div class="grid gap-2 w-full">
							<div class="flex items-center justify-between rounded-md border p-2">
								<div class="space-y-0.5">
									<Label class="text-sm">Coefficient du cours</Label>
									<p class="text-xs text-muted-foreground">
										{utiliserCoefficientCours ? `Coeff. ${cours?.coefficient}` : 'Coeff. 1'}
									</p>
								</div>
								<SwitchPrimitive
									checked={utiliserCoefficientCours}
									onCheckedChange={(checked: boolean) => {
										utiliserCoefficientCours = checked;
									}}
								/>
							</div>
						</div>

						<div class="grid gap-2 w-full">
							<Label for="libelle">Libellé</Label>
							<Input id="libelle" name="libelle" placeholder="Devoir, Interrogation..." class="w-full" />
						</div>
						{#if listeExamens.length > 0}
							<div class="grid gap-2 w-full">
								<Label for="examenId">Examen</Label>
								<NativeSelect.Root name="examenId" class="w-full">
									<option value="">Sans examen</option>
									{#each listeExamens as examen (examen.id)}
										<NativeSelect.Option value={examen.id}>{examen.nom}</NativeSelect.Option>
									{/each}
								</NativeSelect.Root>
							</div>
						{/if}

						<Button type="submit" size="sm" class="w-full">Ajouter la note</Button>
					</form>
				</div>

				<div class="space-y-2">
					<h3 class="text-sm font-semibold">Notes enregistrées</h3>
					{#if notesLoading}
						<p class="text-sm text-muted-foreground">Chargement...</p>
					{:else if notesCours.length === 0}
						<p class="text-sm text-muted-foreground">Aucune note enregistrée</p>
					{:else}
						<div class="max-h-80 space-y-2 overflow-y-auto rounded-md border p-2">
							{#each notesCours as note (note.id)}
								<div class="flex items-center justify-between rounded-md bg-muted/30 p-2">
									<div>
										<p class="text-sm font-medium">{note.eleveNom}</p>
										<p class="text-xs text-muted-foreground">
											{note.libelle || 'Note'}
											{note.examenId ? '(examen)' : ''} - Coeff. {note.coefficient}
										</p>
									</div>
									<span class="text-sm font-semibold">{note.valeur}/20</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
		<Dialog.Footer class="gap-2 sm:justify-end">
			<Button type="button" variant="outline" size="sm" onclick={() => (open = false)}>
				Fermer
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
