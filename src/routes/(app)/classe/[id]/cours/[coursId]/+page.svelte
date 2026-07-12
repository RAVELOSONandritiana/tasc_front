<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import CardUI from '$lib/components/ui/card-ui.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Plus, Calendar, Save, FileText, Lock } from '@lucide/svelte/icons';
	import type { EleveCours, Note, Examen, Cours } from '$lib/types/Materiel.type';
	import { page } from '$app/stores';
	import type { PageProps } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { formatExamenNom } from '$lib/utils';

	const { data }: PageProps = $props();

	const classeId = $page.params.id;
	const coursId = $page.params.coursId;

	let listeCours = $state<Cours[]>([...data.listeCours]);
	let listeExamens = $state<Examen[]>([...data.listeExamens]);
	let elevesClasse = $state<EleveCours[]>([...data.elevesClasse]);

	let notesTemp = $state<Record<string, number>>({});
	let saving = $state(false);

	$effect(() => {
		listeCours = [...data.listeCours];
		listeExamens = [...data.listeExamens];
		elevesClasse = [...data.elevesClasse];
	});

	function setNote(eleveId: string, valeur: number) {
		notesTemp[eleveId] = valeur;
	}

	async function sauvegarderNotes() {
		if (!examenSelectionne || !coursInfo) return;
		saving = true;

		const formData = new FormData();
		formData.append('examenId', examenSelectionne.id);
		formData.append('notes', JSON.stringify(notesTemp));

		try {
			const res = await fetch(`?/sauvegarderNotes`, {
				method: 'POST',
				body: formData,
				credentials: 'same-origin'
			});
			const result = await res.json();
			const isSuccess = result.success || result.type === 'success' || (result.status === 200 && !result.error);
			if (isSuccess) {
				notesTemp = {};
				await invalidateAll();
			} else {
				alert(result.error || result._form || 'Erreur lors de la sauvegarde');
			}
		} catch (e) {
			console.error(e);
			alert('Erreur réseau lors de la sauvegarde');
		} finally {
			saving = false;
		}
	}

	function getNoteExistante(eleveId: string): number | undefined {
		const eleve = elevesClasse.find((e) => e.id === eleveId);
		return eleve?.notes?.find(
			(n) => n.examenId === examenSelectionne?.id && n.coursId === coursInfo?.id
		)?.valeur;
	}

	const coursInfo = $derived(listeCours.find((c) => c.id === coursId));

		const elevesParticipants = $derived(
			elevesClasse.filter(
				(e) => e.actif && (coursInfo?.participants?.length ? coursInfo.participants.includes(e.id) : false)
			)
		);

	let examenSelectionne = $derived<Examen | null>(
		(() => {
			const examenId = $page.url.searchParams.get('examen');
			return listeExamens.find((e) => e.id === examenId) || null;
		})()
	);

	function calculerMoyenne(eleve: EleveCours): number {
		const notes =
			eleve.notes?.filter(
				(n) => n.coursId === coursInfo?.id && n.examenId === examenSelectionne?.id
			) || [];
		if (notes.length === 0) {
			const notesTempVals = Object.entries(notesTemp)
				.filter(([id]) => {
					const e = elevesClasse.find((e) => e.id === id);
					return e && notesTemp[id] > 0;
				})
				.map(([_, v]) => v);
			if (notesTempVals.length === 0) return 0;
			return notesTempVals[0];
		}
		return notes[0].valeur;
	}
</script>

<div class="min-h-full bg-sidebar p-4 text-sidebar-foreground">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">{coursInfo?.nom || 'Cours'}</h1>
			<p class="text-sm text-muted-foreground">
				Professeur : {coursInfo?.professeur || '—'} • Coefficient : {coursInfo?.coefficient} • Participants
				: {elevesParticipants.length}
			</p>
			{#if examenSelectionne}
				<p class="mt-1 text-xs text-muted-foreground">
					Examen : {formatExamenNom(examenSelectionne)} • {examenSelectionne.date}
				</p>
			{/if}
		</div>
		{#if examenSelectionne}
			<Button variant="default" class="gap-2" onclick={sauvegarderNotes} disabled={saving}>
				<Save class="size-4" />
				{saving ? 'Sauvegarde...' : 'Sauvegarder'}
			</Button>
		{/if}
	</div>

	{#if !examenSelectionne}
		<div class="rounded-md border p-8 text-center">
			<FileText class="mx-auto mb-4 size-12 text-muted-foreground" />
			<p class="mb-4 text-muted-foreground">Sélectionnez un examen depuis la page des cours</p>
			<div class="flex justify-center gap-2">
				{#each listeExamens as examen (examen.id)}
					<a href="/classe/{classeId}/cours/{coursId}?examen={examen.id}">
						<Button size="sm" variant="outline">{formatExamenNom(examen)}</Button>
					</a>
				{/each}
			</div>
		</div>
	{:else}
		<CardUI>
			<div class="p-4">
				<h2 class="mb-4 font-semibold">Notes des élèves pour {formatExamenNom(examenSelectionne)}</h2>
				<div class="overflow-x-auto">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Élève</Table.Head>
								<Table.Head class="text-center">{coursInfo?.nom}</Table.Head>
								<Table.Head class="text-center">Autres matières</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each elevesParticipants as eleve (eleve.id)}
								<Table.Row>
									<Table.Cell>
										<div class="font-medium">{eleve.nom} {eleve.prenom}</div>
										<div class="text-xs text-muted-foreground">
											{eleve.dateNaissance
												? new Date(eleve.dateNaissance).toLocaleDateString()
												: '—'}
										</div>
									</Table.Cell>
									<Table.Cell class="text-center">
										<Input
											type="number"
											min="0"
											max="20"
											step="0.25"
											class="h-8 w-16 px-2 text-sm"
											value={getNoteExistante(eleve.id) ?? notesTemp[eleve.id] ?? ''}
											oninput={(e) => setNote(eleve.id, parseFloat(e.currentTarget.value) || 0)}
											placeholder="0"
										/>
									</Table.Cell>
									<Table.Cell class="text-center">
										<Lock class="mx-auto size-4 text-muted-foreground" />
										<span class="text-xs text-muted-foreground">Verrouillé</span>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</div>
		</CardUI>
	{/if}
</div>
