<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as SwitchPrimitive from '$lib/components/ui/switch/index.js';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';
	import { loadingForm } from '$lib/actions/loadingForm';
	import type { ActionResult } from '@sveltejs/kit';
	import { Trash2, CheckCircle2 } from '@lucide/svelte';
	import type { Cours, EleveCours, Examen, Note } from '$lib/types/Materiel.type';
	import { formatExamenNom } from '$lib/utils';

	let {
		open = $bindable(false),
		cours,
		elevesClasse = [],
		listeExamens = [],
		notesCours = [],
		notesLoading = false,
		onLoadNotes
	}: {
		open?: boolean;
		cours: Cours | null;
		elevesClasse: EleveCours[];
		listeExamens: Examen[];
		notesCours: Note[];
		notesLoading: boolean;
		onLoadNotes?: (coursId: string) => void;
	} = $props();

	let errors = $state<Record<string, string>>({});
	let success = $state(false);

	let selectedEleveId = $state('');
	let valeurSaisie = $state(0);
	let typeNotation = $state<'sur_20' | 'sur_10' | 'sur_100' | 'sur_5'>('sur_20');
	let libelleSaisi = $state('');
	let bonusSaisie = $state(0);
	let selectedExamenId = $state('');
	let utiliserCoefficientCours = $state(false);
	let appliquerTous = $state(false);
	let apercuSur20 = $state(0);

	$effect(() => {
		if (open) {
			resetForm();
		}
	});

	function resetForm() {
		selectedEleveId = '';
		valeurSaisie = 0;
		typeNotation = 'sur_20';
		libelleSaisi = '';
		bonusSaisie = 0;
		selectedExamenId = '';
		utiliserCoefficientCours = false;
		appliquerTous = false;
		apercuSur20 = 0;
		errors = {};
		success = false;
	}

	$effect(() => {
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
	});

	$effect(() => {
		if (open && cours) {
			onLoadNotes?.(cours.id);
		}
	});

	const moyenneParEleve = $derived(
		elevesClasse
			.map((eleve) => {
				const notesEleve = notesCours.filter((n) => n.eleveId === eleve.id);
				if (notesEleve.length === 0) return null;
				const total = notesEleve.reduce((s, n) => s + n.valeur * n.coefficient, 0);
				const coeff = notesEleve.reduce((s, n) => s + n.coefficient, 0);
				return {
					id: eleve.id,
					nom: `${eleve.nom} ${eleve.prenom}`,
					moyenne: coeff > 0 ? total / coeff : 0,
					nombre: notesEleve.length
				};
			})
			.filter((m): m is { id: string; nom: string; moyenne: number; nombre: number } => m !== null)
			.sort((a, b) => b.moyenne - a.moyenne)
	);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-3xl">
		<Dialog.Header>
			<Dialog.Title>Gérer les notes - {cours?.nom}</Dialog.Title>
			<Dialog.Description>Ajouter et consulter les notes pour ce cours</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-4">
			{#if success}
				<div class="flex items-center gap-2 rounded-md border border-emerald-500 bg-emerald-500/10 p-3">
					<CheckCircle2 class="size-4 text-emerald-500" />
					<p class="text-sm font-medium text-emerald-500">Note enregistrée avec succès</p>
				</div>
			{/if}

			{#if errors._form}
				<div class="rounded-md border border-destructive bg-destructive/10 p-3">
					<p class="text-sm text-destructive">{errors._form}</p>
				</div>
			{/if}

			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-3 rounded-md border p-4">
					<h3 class="text-sm font-semibold">Ajouter une note</h3>

					<form
						method="POST"
					action={appliquerTous ? '?/createNoteAll' : '?/createNote'}
					use:loadingForm={{
						handler: () => {
							errors = {};
							success = false;
							return async ({ result }) => {
								if (result.type === 'success' && cours) {
									onLoadNotes?.(cours.id);
									resetForm();
									success = true;
									setTimeout(() => (success = false), 2000);
							} else if (result.type === 'failure') {
								const data = result.data as {
									errors?: Record<string, string>;
									error?: string;
									eleveId?: string;
									valeur?: number;
									libelle?: string;
								} | undefined;
								errors = data?.errors || { _form: data?.error || 'Erreur lors de la création de la note' };
								selectedEleveId = data?.eleveId || '';
								valeurSaisie = typeof data?.valeur === 'number' ? data.valeur : valeurSaisie;
								libelleSaisi = data?.libelle || '';
							}
							};
						}
					}}
						class="space-y-3"
					>
						<input type="hidden" name="coursId" value={cours?.id || ''} />
						<input type="hidden" name="coefficientMode" value={utiliserCoefficientCours ? 'cours' : 'unitaire'} />
						<input type="hidden" name="bonus" value={bonusSaisie} />

						<div class="grid gap-2 w-full">
							<Label for="eleveId">Élève *</Label>
							<NativeSelect.Root name="eleveId" required={!appliquerTous} disabled={appliquerTous} class="w-full" bind:value={selectedEleveId}>
								<option value="">Choisir un élève</option>
								{#each elevesClasse as eleve (eleve.id)}
									<NativeSelect.Option value={eleve.id}>
										{eleve.nom} {eleve.prenom}
									</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
							{#if errors.eleveId}
								<p class="text-xs text-destructive">{errors.eleveId}</p>
							{/if}
						</div>

						<div class="grid gap-2 w-full">
							<div class="flex items-center justify-between rounded-md border p-2">
								<div class="space-y-0.5">
									<Label class="text-sm">Appliquer à tous les élèves</Label>
									<p class="text-xs text-muted-foreground">
										{appliquerTous ? `Note pour ${elevesClasse.length} élèves` : 'Note pour un élève'}
									</p>
								</div>
								<SwitchPrimitive.Root
									checked={appliquerTous}
									onCheckedChange={(checked: boolean) => {
										appliquerTous = checked;
									}}
								/>
							</div>
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
							{#if errors.valeur}
								<p class="text-xs text-destructive">{errors.valeur}</p>
							{/if}
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
								<SwitchPrimitive.Root
									checked={utiliserCoefficientCours}
									onCheckedChange={(checked: boolean) => {
										utiliserCoefficientCours = checked;
									}}
								/>
							</div>
						</div>

						<div class="grid gap-2 w-full">
							<Label for="libelle">Libellé</Label>
							<Input
								id="libelle"
								name="libelle"
								placeholder="Devoir, Interrogation..."
								bind:value={libelleSaisi}
								class="w-full"
							/>
						</div>

						<div class="grid gap-2 w-full">
							<Label for="bonus">Bonus (points ajoutés)</Label>
							<Input
								id="bonus"
								name="bonus"
								type="number"
								step="0.5"
								min="0"
								bind:value={bonusSaisie}
								class="w-full"
							/>
						</div>

						{#if listeExamens.length > 0}
							<div class="grid gap-2 w-full">
								<Label for="examenId">Examen</Label>
								<NativeSelect.Root name="examenId" class="w-full" bind:value={selectedExamenId}>
									<option value="">Sans examen</option>
									{#each listeExamens as examen (examen.id)}
										<NativeSelect.Option value={examen.id}>{formatExamenNom(examen)}</NativeSelect.Option>
									{/each}
								</NativeSelect.Root>
							</div>
						{/if}

						<Button type="submit" size="sm" class="w-full">Ajouter la note</Button>
					</form>
				</div>

				<div class="space-y-4">
					{#if moyenneParEleve.length > 0}
						<div class="space-y-2">
							<h3 class="text-sm font-semibold">Moyennes</h3>
							<div class="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
								{#each moyenneParEleve as m (m.id)}
									<div class="flex items-center justify-between text-sm">
										<span class="truncate">{m.nom} <span class="text-xs text-muted-foreground">({m.nombre})</span></span>
										<span class="font-semibold">{m.moyenne.toFixed(2)}/20</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

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
										<div class="flex items-center gap-2">
											<span class="text-sm font-semibold">{note.valeur}/20</span>
											<form
												method="POST"
											action="?/deleteNote"
											use:loadingForm={{
												handler: () => {
													return async ({ result }) => {
														if (result.type === 'success' && cours) {
															onLoadNotes?.(cours.id);
														}
													};
												}
											}}
											>
												<input type="hidden" name="noteId" value={note.id} />
												<Button
													type="submit"
													variant="ghost"
													size="icon-sm"
													class="size-7 text-destructive hover:bg-destructive/10"
													title="Supprimer"
												>
													<Trash2 class="size-3.5" />
												</Button>
											</form>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
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
