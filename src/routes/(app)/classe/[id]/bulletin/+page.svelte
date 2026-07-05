<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { Plus, Printer, School } from '@lucide/svelte/icons';
	import type { EleveCours, Note, Examen, Cours } from '$lib/types/Materiel.type';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let listeCours = $state<Cours[]>([...data.listeCours]);
	let listeExamens = $state<Examen[]>([...data.listeExamens]);
	let elevesClasse = $state<EleveCours[]>([...data.elevesClasse]);

	let nouvelExamen = $state({
		nom: '',
		date: '',
		periode: ''
	});

	let bulletinEleve = $state<EleveCours | null>(null);
	let bulletinExamenIds = $state<string[]>([]);
	let bulletinTousEleves = $state(false);
	let examensActifs = $state<string[]>(['e1']);
	let examenDialogOpen = $state(false);

	const notesBulletin = $derived(getNotesEleveExamens(bulletinEleve, bulletinExamenIds));

	function ajouterExamen() {
		if (!nouvelExamen.nom || !nouvelExamen.date) return;
		const examen: Examen = {
			id: Date.now().toString(),
			nom: nouvelExamen.nom,
			date: nouvelExamen.date,
			classeId: data.classe?.id || '',
			periode: nouvelExamen.periode
		};
		listeExamens = [...listeExamens, examen];
		nouvelExamen = { nom: '', date: '', periode: '' };
		examenDialogOpen = false;
	}

	function toggleExamen(examenId: string) {
		if (examensActifs.includes(examenId)) {
			examensActifs = examensActifs.filter((id) => id !== examenId);
		} else {
			examensActifs = [...examensActifs, examenId];
		}
	}

	function getExamen(examenId: string): Examen | undefined {
		return listeExamens.find((e) => e.id === examenId);
	}

	function getCoefficientCours(coursId: string): number {
		return listeCours.find((c) => c.id === coursId)?.coefficient ?? 0;
	}

	function getNoteCoefficient(note: Note): number {
		return note.coefficient || getCoefficientCours(note.coursId);
	}

	function formatNombre(valeur: number): string {
		return Number.isInteger(valeur) ? valeur.toString() : valeur.toFixed(2);
	}

	function getNotesEleveExamens(e: EleveCours | null, examenIds: string[]): Note[] {
		if (!e || examenIds.length === 0) return [];
		return e.notes?.filter((n) => n.examenId && examenIds.includes(n.examenId)) || [];
	}

	function getNotesMatiere(eleve: EleveCours, coursId: string, examenIds: string[]): Note[] {
		return getNotesEleveExamens(eleve, examenIds).filter((n) => n.coursId === coursId);
	}

	function calculerMoyenneMatiere(notes: Note[]): number {
		if (notes.length === 0) return 0;
		const totalPoints = notes.reduce((sum, n) => sum + n.valeur * getNoteCoefficient(n), 0);
		const totalCoef = notes.reduce((sum, n) => sum + getNoteCoefficient(n), 0);
		return totalCoef > 0 ? Math.round((totalPoints / totalCoef) * 100) / 100 : 0;
	}

	function calculerMoyenneNotes(notes: Note[]): number {
		if (notes.length === 0) return 0;
		const totalPoints = notes.reduce((sum, n) => sum + n.valeur * getNoteCoefficient(n), 0);
		const totalCoef = notes.reduce((sum, n) => sum + getNoteCoefficient(n), 0);
		return totalCoef > 0 ? Math.round((totalPoints / totalCoef) * 100) / 100 : 0;
	}

	function calculerMoyenneGenerale(eleve: EleveCours, examenIds: string[]): number {
		return calculerMoyenneNotes(getNotesEleveExamens(eleve, examenIds));
	}

	function calculerRang(eleveId: string, examenIds: string[]): number {
		if (examenIds.length === 0) return 0;
		const notes = elevesClasse.map((e) => ({
			id: e.id,
			moy: calculerMoyenneGenerale(e, examenIds)
		})).sort((a, b) => b.moy - a.moy);
		return notes.findIndex((n) => n.id === eleveId) + 1;
	}

	function getNomExamens(examenIds: string[]): string {
		const noms = examenIds.map((id) => getExamen(id)?.nom).filter((nom): nom is string => Boolean(nom));
		return noms.length > 0 ? noms.join(', ') : '—';
	}

	function ouvrirBulletin(e: EleveCours) {
		if (examensActifs.length === 0) return;
		bulletinTousEleves = false;
		bulletinEleve = e;
		bulletinExamenIds = [...examensActifs];
	}

	function ouvrirTousBulletins() {
		bulletinTousEleves = true;
		bulletinEleve = null;
		bulletinExamenIds = [...examensActifs];
	}

	function retourListe() {
		bulletinTousEleves = false;
		bulletinEleve = null;
		bulletinExamenIds = [];
	}

	function imprimerBulletin() {
		window.print();
	}
</script>