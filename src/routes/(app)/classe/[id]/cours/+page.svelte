<script lang="ts">
	import CourseCard from '$lib/components/user/classe/CourseCard.svelte';
	import CoursePageHeader from '$lib/components/user/classe/CoursePageHeader.svelte';
	import CreateCourseDialog from '$lib/components/user/classe/CreateCourseDialog.svelte';
	import CreateExamenDialog from '$lib/components/user/classe/CreateExamenDialog.svelte';
	import CoefficientDialog from '$lib/components/user/classe/CoefficientDialog.svelte';
	import ParticipantsDialog from '$lib/components/user/classe/ParticipantsDialog.svelte';
	import NotesDialog from '$lib/components/user/classe/NotesDialog.svelte';
	import UploadFile from '$lib/components/user/form/UploadFile.svelte';
	import { page } from '$app/stores';
	import { deserialize } from '$app/forms';
	import { BookOpen } from '@lucide/svelte/icons';
	import type { Cours, Examen, EleveCours, Note } from '$lib/types/Materiel.type';
	import type { PageProps } from './$types';
	import pb, { auth } from '$lib/pocketbase/pocketbase';

	const { data }: PageProps = $props();

	let searchCours = $state('');

	let listeCours = $state<Cours[]>([...(data.listeCours || [])]);
	let listeExamens = $state<Examen[]>([...(data.listeExamens || [])]);
	let elevesClasse = $state<EleveCours[]>([...(data.elevesClasse || [])]);
	let matieres = $state<{ id: string; nom: string; couleur?: string }[]>([
		...(data.matieres || [])
	]);
	let enseignants = $state<{ id: string; name: string; lastname: string }[]>([
		...(data.enseignants || [])
	]);

	let openCoursDialog = $state(false);
	let openCoeffDialog = $state(false);
	let openParticipantsDialog = $state(false);
	let openExamenDialog = $state(false);
	let openNoteDialog = $state(false);

	let selectedCours: Cours | null = $state(null);

	let notesCours = $state<Note[]>([]);
	let notesLoading = $state(false);

	let openImageDialog = $state(false);
	let selectedCoursForImage: Cours | null = $state(null);
	let coursImageFiles = $state<FileList | null>(null);

	const DEFAULT_MATIERE_COLOR = '#3b82f6';

	const matiereMap = $derived(
		matieres.reduce((acc, m) => {
			acc[m.id] = m;
			return acc;
		}, {} as Record<string, { id: string; nom: string; couleur?: string }>)
	);

	async function loadNotes(coursId: string) {
		notesLoading = true;
		try {
			const res = await fetch(
				`/classe/${$page.params.id}/cours?/getNotes&coursId=${encodeURIComponent(coursId)}`,
				{
					method: 'POST',
					headers: { 'x-sveltekit-action': 'true' },
					body: new FormData()
				}
			);
			const result = deserialize(await res.text());
			if (result.type === 'success' && (result.data as any)?.success) {
				notesCours = (result.data as any).notes || [];
			}
		} catch (e) {
			console.error('Failed to load notes:', e);
		} finally {
			notesLoading = false;
		}
	}

	function openNotes(cours: Cours) {
		selectedCours = cours;
		loadNotes(cours.id);
		openNoteDialog = true;
	}

	function formaterParticipants(cours: Cours): string {
		const n = cours.participants?.length ?? 0;
		if (n === 0) return 'Aucun participant';
		return `${n} participant${n > 1 ? 's' : ''}`;
	}

	function ouvrirModifierCoefficient(cours: Cours) {
		selectedCours = cours;
		openCoeffDialog = true;
	}

	function ouvrirModifierParticipants(cours: Cours) {
		selectedCours = cours;
		openParticipantsDialog = true;
	}

	function sauvegarderCoefficient(coursId: string, coefficient: number, matiereId: string, matiereNom: string, matiereCouleur: string) {
		listeCours = listeCours.map((c) => {
			if (c.id === coursId && matiereId && matiereNom) {
				return {
					...c,
					coefficient,
					nom: matiereNom
				};
			}
			return c;
		});
		if (matiereId && matiereNom) {
			matieres = matieres.map((m) =>
				m.id === matiereId ? { ...m, nom: matiereNom, couleur: matiereCouleur } : m
			);
		}
	}
	function sauvegarderParticipants(coursId: string, participants: string[]) {
		listeCours = listeCours.map((c) =>
			c.id === coursId ? { ...c, participants } : c
		);
	}

	function onCreateCours(cours: Cours) {
		listeCours = [...listeCours, cours];
	}

	function onCreateExamen(examen: Examen) {
		listeExamens = [...listeExamens, examen];
	}

	async function handleUploadCoursImage() {
		if (!selectedCoursForImage || !coursImageFiles || coursImageFiles.length === 0) return;
		try {
			await auth();
			const formdata = new FormData();
			formdata.append('file', coursImageFiles[0]);
			const record = await pb.collection('tasc_statics').create(formdata);
			if (record && record.file) {
				const url = pb.files.getURL(record, record.file);
				// Mise a jour immediate (optimiste) comme pour les classes : la carte
				// se rafraichit sans attendre la reponse du serveur.
				const oldImageUrl = listeCours.find((c) => c.id === selectedCoursForImage!.id)?.url;
				listeCours = listeCours.map((c) =>
					c.id === selectedCoursForImage!.id ? { ...c, url } : c
				);
				try {
					const fd = new FormData();
					fd.append('coursId', selectedCoursForImage.id);
					fd.append('imageUrl', url);
					const res = await fetch(`/classe/${$page.params.id}/cours?/updateCoursImage`, {
						method: 'POST',
						body: fd,
						credentials: 'same-origin'
					});
					const result = await res.json().catch(() => null);
					const payload = (result && 'data' in result ? result.data : result) ?? {};
					if (payload?.success && oldImageUrl && oldImageUrl !== url) {
						const segments = oldImageUrl.split('/');
						const recordId = segments[segments.length - 2];
						if (recordId) {
							await pb.collection('tasc_statics').delete(recordId).catch(() => {});
						}
					}
				} catch (e) {
					console.error('Failed to save image to DB:', e);
				}
			}
		} catch (e) {
			console.error('Upload failed:', e);
		} finally {
			coursImageFiles = null;
			selectedCoursForImage = null;
		}
	}

	const coursFiltres = $derived(
		listeCours.filter(
			(c) =>
				c.nom.toLowerCase().includes(searchCours.toLowerCase()) ||
				(c.professeur?.toLowerCase() || '').includes(searchCours.toLowerCase())
		)
	);
</script>

<div class="flex min-h-full flex-col bg-sidebar text-sidebar-foreground">
	<div class="sticky top-16 z-50 border-b border-sidebar-border bg-sidebar p-4">
		<CoursePageHeader
			classe={data.classe}
			listeExamens={listeExamens.map((e) => ({ id: e.id, nom: e.nom, date: e.date, periode: e.periode }))}
			bind:openCreateCours={openCoursDialog}
			bind:openCreateExamen={openExamenDialog}
		/>
	</div>

	<div class="flex-1 p-4">
		{#if listeCours.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<BookOpen class="mb-4 size-12 text-muted-foreground" />
				<p class="text-lg font-medium text-muted-foreground">Aucun cours configuré</p>
				<p class="text-sm text-muted-foreground">
					Commencez par ajouter des matières et des cours à cette classe.
				</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each coursFiltres as cours (cours.id)}
					{@const matiere = matiereMap[cours.matiereId || '']}
					{@const estTitulaire =
						!!data.currentProfesseurId && cours.professeurId === data.currentProfesseurId}
					{@const peutModifierParticipants =
						data.userRole === 'SURVEILLANT' || data.userRole === 'ADMINISTRATEUR'}
					<CourseCard
						{cours}
						{matiere}
						{estTitulaire}
						{peutModifierParticipants}
						defaultMatiereColor={DEFAULT_MATIERE_COLOR}
						formatParticipants={formaterParticipants}
						onEditCoefficient={ouvrirModifierCoefficient}
						onEditParticipants={ouvrirModifierParticipants}
						onOpenNotes={openNotes}
						onOpenImageDialog={(c) => {
							selectedCoursForImage = c;
							openImageDialog = true;
						}}
					/>
				{/each}
			</div>
		{/if}
	</div>

	<CreateCourseDialog
		bind:open={openCoursDialog}
		{matieres}
		{enseignants}
		{elevesClasse}
		onCreate={onCreateCours}
	/>

	<CreateExamenDialog
		bind:open={openExamenDialog}
		classeNom={data.classe?.name || ''}
		onCreate={onCreateExamen}
	/>

	<CoefficientDialog
		bind:open={openCoeffDialog}
		cours={selectedCours}
		onSave={sauvegarderCoefficient}
	/>

	<ParticipantsDialog
		bind:open={openParticipantsDialog}
		cours={selectedCours}
		{elevesClasse}
		onSave={sauvegarderParticipants}
	/>

	<NotesDialog
		bind:open={openNoteDialog}
		cours={selectedCours}
		{elevesClasse}
		{listeExamens}
		{notesCours}
		{notesLoading}
		onLoadNotes={loadNotes}
	/>

	<UploadFile bind:open={openImageDialog} bind:files={coursImageFiles} header="Image du cours" onSubmit={handleUploadCoursImage} />
</div>
