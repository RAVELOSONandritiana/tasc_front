<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as NativeSelect from '$lib/components/ui/native-select/index.js';
	import { loadingForm } from '$lib/actions/loadingForm';
	import { Trash2, CheckCircle2 } from '@lucide/svelte';
	import ConfirmDeleteDialog from '$lib/components/user/ConfirmDeleteDialog.svelte';
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

	let errorMsg = $state('');
	let success = $state(false);
	let selectedExamenId = $state('');
	let libelleSaisi = $state('');
	let batchNotes = $state<Record<string, string>>({});
	let noteToDelete = $state<string | null>(null);
	let noteConfirmOpen = $state(false);
	let deletingNote = $state(false);

	$effect(() => {
		if (open) {
			resetForm();
		}
	});

	function resetForm() {
		selectedExamenId = '';
		libelleSaisi = '';
		errorMsg = '';
		success = false;
	}

	$effect(() => {
		if (open && cours) {
			onLoadNotes?.(cours.id);
		}
	});

	// Note existante par élève pour l'examen sélectionné
	const noteParEleve = $derived(
		new Map<string, Note | undefined>(
			elevesClasse.map((e) => [
				e.id,
				notesCours.find((n) => n.eleveId === e.id && (n.examenId || '') === selectedExamenId)
			])
		)
	);

	// Préremplir les champs quand l'examen ou les notes chargées changent
	$effect(() => {
		const map: Record<string, string> = {};
		for (const eleve of elevesClasse) {
			const note = notesCours.find(
				(n) => n.eleveId === eleve.id && (n.examenId || '') === selectedExamenId
			);
			map[eleve.id] = note ? String(note.valeur) : '';
		}
		batchNotes = map;
	});

	const notesJson = $derived(JSON.stringify(batchNotes));
	const nbSaisies = $derived(
		Object.values(batchNotes).filter((v) => v !== '' && v !== null && v !== undefined).length
	);

	async function supprimerNote(noteId: string) {
		const fd = new FormData();
		fd.append('noteId', noteId);
		try {
			await fetch('?/deleteNote', { method: 'POST', body: fd, credentials: 'same-origin' });
			if (cours) onLoadNotes?.(cours.id);
		} catch (e) {
			console.error('Suppression note échouée', e);
		}
	}

	async function confirmerSuppressionNote() {
		if (!noteToDelete) return;
		deletingNote = true;
		try {
			await supprimerNote(noteToDelete);
		} finally {
			deletingNote = false;
			noteToDelete = null;
			noteConfirmOpen = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Notes - {cours?.nom}</Dialog.Title>
			<Dialog.Description>
				Sélectionnez un examen puis saisissez les notes des élèves (sur 20).
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			{#if success}
				<div
					class="flex items-center gap-2 rounded-md border border-emerald-500 bg-emerald-500/10 p-3"
				>
					<CheckCircle2 class="size-4 text-emerald-500" />
					<p class="text-sm font-medium text-emerald-500">Notes enregistrées avec succès</p>
				</div>
			{/if}

			{#if errorMsg}
				<div class="rounded-md border border-destructive bg-destructive/10 p-3">
					<p class="text-sm text-destructive">{errorMsg}</p>
				</div>
			{/if}

			<form
				method="POST"
				action="?/createNotesBatch"
				use:loadingForm={{
					handler: () => {
						errorMsg = '';
						success = false;
						return async ({ result }) => {
							if (result.type === 'success' && cours) {
								onLoadNotes?.(cours.id);
								success = true;
								setTimeout(() => (success = false), 2000);
							} else if (result.type === 'failure') {
								const data = result.data as { error?: string } | undefined;
								errorMsg = data?.error || 'Erreur lors de la sauvegarde des notes';
							}
						};
					}
				}}
				class="space-y-4"
			>
				<input type="hidden" name="coursId" value={cours?.id || ''} />
				<input type="hidden" name="examenId" value={selectedExamenId} />
				<input type="hidden" name="libelle" value={libelleSaisi} />
				<input type="hidden" name="notes" value={notesJson} />

				<div class="grid gap-3 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="examenId">Examen</Label>
						{#if listeExamens.length > 0}
							<NativeSelect.Root class="w-full" bind:value={selectedExamenId}>
								<option value="">Sans examen</option>
								{#each listeExamens as examen (examen.id)}
									<NativeSelect.Option value={examen.id}
										>{formatExamenNom(examen)}</NativeSelect.Option
									>
								{/each}
							</NativeSelect.Root>
						{:else}
							<p class="text-xs text-muted-foreground">Aucun examen créé pour cette classe</p>
						{/if}
					</div>
					<div class="grid gap-2">
						<Label for="libelle">Libellé</Label>
						<Input
							placeholder="Devoir, Interrogation..."
							bind:value={libelleSaisi}
							class="w-full"
						/>
					</div>
				</div>

				<div class="space-y-1">
					<div class="flex items-center justify-between">
						<h3 class="text-sm font-semibold">Élèves ({elevesClasse.length})</h3>
						<span class="text-xs text-muted-foreground">{nbSaisies} note(s) saisie(s)</span>
					</div>

					{#if notesLoading}
						<p class="text-sm text-muted-foreground">Chargement...</p>
					{:else if elevesClasse.length === 0}
						<p class="text-sm text-muted-foreground">Aucun élève dans cette classe</p>
					{:else}
						<div class="max-h-[45vh] space-y-1 overflow-y-auto rounded-md border p-2">
							{#each elevesClasse as eleve (eleve.id)}
								{@const noteEx = noteParEleve.get(eleve.id)}
								<div class="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/40">
									<span class="min-w-0 flex-1 truncate text-sm">
										{eleve.nom}
										{eleve.prenom}
									</span>
									<Input
										type="number"
										step="0.5"
										min="0"
										max="20"
										placeholder="—"
										bind:value={batchNotes[eleve.id]}
										class="h-8 w-20 text-center"
									/>
									<span class="w-6 text-xs text-muted-foreground">/20</span>
									{#if noteEx}
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											class="size-7 text-destructive hover:bg-destructive/10"
											title="Supprimer la note"
											onclick={() => {
												noteToDelete = noteEx.id;
												noteConfirmOpen = true;
											}}
										>
											<Trash2 class="size-3.5" />
										</Button>
									{:else}
										<span class="size-7"></span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<Button type="submit" size="sm" class="w-full" disabled={elevesClasse.length === 0}>
					Enregistrer les notes
				</Button>
			</form>
		</div>

		<Dialog.Footer class="gap-2 sm:justify-end">
			<Button type="button" variant="outline" size="sm" onclick={() => (open = false)}>
				Fermer
			</Button>
		</Dialog.Footer>
	</Dialog.Content>

	<ConfirmDeleteDialog
		bind:open={noteConfirmOpen}
		title="Supprimer la note"
		description="Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible."
		loading={deletingNote}
		onConfirm={confirmerSuppressionNote}
	/>
</Dialog.Root>
