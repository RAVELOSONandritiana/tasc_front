import type { PageServerLoad, Actions } from './$types';
import {
	getClasseById,
	getMatieres,
	getProfesseurs,
	getCours,
	createCours,
	createMatiere,
	updateCours,
	updateCoursImage,
	deleteCours,
	createExamen,
	createNote,
	getNotesByCoursIdSorted,
	deleteNote,
	updateNote,
	updateMatiere,
	getActiveAnneeScolaire,
	prisma
} from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import type { Cours, Examen, EleveCours } from '$lib/types/Materiel.type';

export const load: PageServerLoad = async ({ params }) => {
	const classe = await getClasseById(params.id);
	if (!classe) {
		throw fail(404, { error: 'Classe introuvable' });
	}

	const mappedClasse = {
		id: classe.id,
		name: classe.nom || `Niveau ${classe.niveau}`,
		niveau: classe.niveau,
		series: classe.serie || '',
		eleves: classe.elevesCount,
		titulaire: classe.titulaire
			? {
					id: classe.titulaire.id,
					personne: {
						id: classe.titulaire.personne.id,
						name: classe.titulaire.personne.name,
						lastname: classe.titulaire.personne.lastname
					}
				}
			: null
	};

	const [allMatieres, profs, coursList, examens, inscriptions] = await Promise.all([
		getMatieres(classe.anneeId),
		getProfesseurs(),
		getCours(classe.anneeId),
		prisma.examen.findMany({
			where: { classeId: params.id },
			orderBy: { date: 'asc' }
		}),
		prisma.inscription.findMany({
			where: { classeId: params.id, actif: true },
			include: {
				eleve: {
					include: {
						personne: true
					}
				}
			}
		})
	]);

	const matieres = allMatieres.map((m) => ({
		id: m.id,
		nom: m.nom,
		couleur: m.couleur || undefined
	}));

	const enseignants = profs.map((p) => ({
		id: p.id,
		name: p.personne.name,
		lastname: p.personne.lastname,
		email: p.personne.email,
		phone: p.personne.phone
	}));

	const listeCours: Cours[] = coursList
		.filter((c) => c.classeId === params.id)
		.map((c) => ({
			id: c.id,
			nom: c.matiere?.nom || 'Matière inconnue',
			coefficient: c.coefficient,
			professeur: c.professeur
				? `${c.professeur.personne.name} ${c.professeur.personne.lastname}`
				: '',
			participants: c.participants || [],
			matiereId: c.matiereId,
		matiere: c.matiere
			? {
					id: c.matiere.id,
					nom: c.matiere.nom,
					couleur: c.matiere.couleur || undefined
				}
			: undefined,
			url: c.imageUrl || undefined
		}));

	const listeExamens: Examen[] = examens.map((e) => ({
		id: e.id,
		nom: e.nom,
		date: e.date.toISOString().split('T')[0],
		classeId: e.classeId,
		periode: e.periode || undefined
	}));

	const elevesClasse: EleveCours[] = inscriptions.map((i) => ({
		id: i.eleve.id,
		nom: i.eleve.personne.name,
		prenom: i.eleve.personne.lastname,
		dateNaissance: i.eleve.dateNaissance?.toISOString().split('T')[0] || '',
		actif: i.actif,
		notes: []
	}));

	return {
		classe: mappedClasse,
		matieres,
		enseignants,
		listeCours,
		listeExamens,
		elevesClasse
	};
};

export const actions: Actions = {
	createCours: async ({ request, locals, params }) => {
		const data = await request.formData();
		const matiereId = (data.get('matiereId') as string | null)?.trim() || '';
		const matiereNom = (data.get('matiereNom') as string | null)?.trim() || '';
		const professeurId = data.get('professeurId') as string;
		const coefficient = parseInt((data.get('coefficient') as string) || '1', 10);
		const participants = data.getAll('participants') as string[];

		if (!professeurId) {
			return fail(400, { error: 'Professeur requis' });
		}

		if (!matiereId && !matiereNom) {
			return fail(400, { error: 'Matière requise' });
		}

		try {
			const classeCourante = await prisma.classe.findUnique({
				where: { id: params.id },
				select: { anneeId: true }
			});
			const anneeId = classeCourante?.anneeId;
			if (!anneeId) {
				return fail(400, { error: 'Année scolaire introuvable pour cette classe' });
			}

			let finalMatiereId = matiereId;

			if (matiereNom) {
				let matiere = await prisma.matiere.findFirst({
					where: { nom: matiereNom, anneeId }
				});

				if (!matiere) {
					const colors = [
						'#3b82f6',
						'#10b981',
						'#f59e0b',
						'#ef4444',
						'#8b5cf6',
						'#ec4899',
						'#06b6d4'
					];
					const randomColor = colors[Math.floor(Math.random() * colors.length)];
					matiere = await createMatiere({ nom: matiereNom, couleur: randomColor }, anneeId);
				}

				finalMatiereId = matiere.id;
			}

			const cours = await createCours({
				classeId: params.id,
				matiereId: finalMatiereId,
				professeurId,
				coefficient: Number.isFinite(coefficient) && coefficient > 0 ? coefficient : 1,
				participants
			});

			logActivity(
				locals.user,
				'creation_cours' as any,
				`Création du cours ${cours.matiere?.nom || ''}`
			).catch(() => {});

			return { success: true, cours };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la création du cours' });
		}
	},

	updateCoefficient: async ({ request }) => {
		const data = await request.formData();
		const coursId = data.get('coursId') as string;
		const coefficient = parseInt((data.get('coefficient') as string) || '1', 10);
		const matiereId = data.get('matiereId') as string | null;
		const matiereNom = (data.get('matiereNom') as string | null)?.trim() || '';
		const matiereCouleur = (data.get('matiereCouleur') as string | null)?.trim() || '';

		if (!coursId) {
			return fail(400, { error: 'coursId requis' });
		}

		try {
			const cours = await updateCours(coursId, {
				coefficient: Number.isFinite(coefficient) ? coefficient : 1
			});

			if (matiereId && matiereNom) {
				await updateMatiere(matiereId, {
					nom: matiereNom,
					couleur: matiereCouleur || undefined
				});
			}

			return { success: true, cours };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la mise à jour' });
		}
	},

	updateParticipants: async ({ request }) => {
		const data = await request.formData();
		const coursId = data.get('coursId') as string;
		const participants = data.getAll('participants') as string[];

		if (!coursId) {
			return fail(400, { error: 'coursId requis' });
		}

		try {
			const cours = await updateCours(coursId, { participants });
			return { success: true, cours };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la mise à jour' });
		}
	},

	deleteCours: async ({ request, locals }) => {
		const data = await request.formData();
		const coursId = data.get('coursId') as string;

		if (!coursId) {
			return fail(400, { error: 'coursId requis' });
		}

		try {
			await deleteCours(coursId);
			logActivity(locals.user, 'suppression_cours' as any, "Suppression d'un cours").catch(
				() => {}
			);
			return { success: true };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la suppression' });
		}
	},

	createExamen: async ({ request, locals, params }) => {
		const data = await request.formData();
		const nom = (data.get('nom') as string | null)?.trim() || '';
		const date = data.get('date') as string;
		const periode = (data.get('periode') as string | null)?.trim() || '';

		if (!nom || !date) {
			return fail(400, { error: 'Nom et date requis' });
		}

		try {
			const examen = await createExamen({
				classeId: params.id,
				nom,
				date,
				periode
			});

			logActivity(locals.user, 'creation_examen' as any, `Examen créé : ${examen.nom}`).catch(
				() => {}
			);

			return { success: true, examen };
		} catch (e: any) {
			return fail(500, { error: e?.message || "Erreur lors de la création de l'examen" });
		}
	},

	createNote: async ({ request, locals, params }) => {
		const data = await request.formData();
		const valeur = parseFloat((data.get('valeur') as string) || '0');
		const libelle = (data.get('libelle') as string | null)?.trim() || '';
		const eleveId = data.get('eleveId') as string;
		const coursId = data.get('coursId') as string;
		const examenId = (data.get('examenId') as string | null)?.trim() || undefined;

		const errors: Record<string, string> = {};
		if (isNaN(valeur)) {
			errors.valeur = 'La note doit être un nombre valide';
		}
		if (!eleveId) {
			errors.eleveId = 'Veuillez sélectionner un élève';
		}
		if (!coursId) {
			errors.coursId = 'Cours introuvable';
		}
		if (Object.keys(errors).length > 0) {
			return fail(400, { errors, valeur, eleveId, libelle });
		}

		try {
			const cours = await prisma.cours.findUnique({
				where: { id: coursId },
				select: { classeId: true }
			});
			if (!cours) {
				return fail(404, { errors: { coursId: 'Cours introuvable' } });
			}

			if (valeur < 0 || valeur > 20) {
				return fail(400, {
					errors: { valeur: 'La note doit être comprise entre 0 et 20' },
					valeur,
					eleveId,
					libelle
				});
			}

			const coefficient = 1;

			const annee = await getActiveAnneeScolaire();
			if (!annee) {
				return fail(500, { errors: { _form: 'Aucune année scolaire active' } });
			}

			const inscription = await prisma.inscription.findFirst({
				where: {
					eleveId,
					classeId: cours.classeId,
					anneeId: annee.id,
					actif: true
				},
				select: { id: true }
			});

			const noteExistante = await prisma.note.findFirst({
				where: {
					eleveId,
					coursId,
					valeur,
					coefficient,
					examenId: examenId || null,
					libelle: libelle || null
				}
			});
			if (noteExistante) {
				return { success: true, note: noteExistante, duplicate: true };
			}

			const note = await createNote({
				valeur,
				coefficient,
				libelle: libelle || undefined,
				eleveId,
				coursId,
				examenId: examenId || undefined,
				inscriptionId: inscription?.id || undefined
			});

			logActivity(
				locals.user,
				'creation_note' as any,
				`Note créée : ${valeur}/20`
			).catch(() => {});

			return { success: true, note };
		} catch (e: any) {
			return fail(500, {
				errors: { _form: e?.message || 'Erreur lors de la création de la note' }
			});
		}
	},

	createNoteAll: async ({ request, locals }) => {
		const data = await request.formData();
		const valeur = parseFloat((data.get('valeur') as string) || '0');
		const libelle = (data.get('libelle') as string | null)?.trim() || '';
		const coursId = data.get('coursId') as string;
		const examenId = (data.get('examenId') as string | null)?.trim() || undefined;

		if (isNaN(valeur) || !coursId) {
			return fail(400, { error: 'Valeur et cours requis' });
		}

		try {
			const cours = await prisma.cours.findUnique({
				where: { id: coursId },
				select: { classeId: true }
			});
			if (!cours) {
				return fail(404, { error: 'Cours introuvable' });
			}

			if (valeur < 0 || valeur > 20) {
				return fail(400, { error: 'La note doit être comprise entre 0 et 20' });
			}

			const coefficient = 1;

			const annee = await getActiveAnneeScolaire();
			if (!annee) {
				return fail(500, { error: 'Aucune année scolaire active' });
			}

			const inscriptions = await prisma.inscription.findMany({
				where: { classeId: cours.classeId, anneeId: annee.id, actif: true },
				select: { id: true, eleveId: true }
			});

			let creees = 0;
			for (const ins of inscriptions) {
				const existante = await prisma.note.findFirst({
					where: {
						eleveId: ins.eleveId,
						coursId,
						valeur,
						coefficient,
						examenId: examenId || null,
						libelle: libelle || null
					}
				});
				if (existante) continue;
				await createNote({
					valeur,
					coefficient,
					libelle: libelle || undefined,
					eleveId: ins.eleveId,
					coursId,
					examenId: examenId || undefined,
					inscriptionId: ins.id
				});
				creees++;
			}

			logActivity(
				locals.user,
				'creation_note' as any,
				`Notes créées pour la classe (${creees})`
			).catch(() => {});

			return { success: true, creees };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la création des notes' });
		}
	},

	updateNote: async ({ request, locals }) => {
		const data = await request.formData();
		const noteId = data.get('noteId') as string;
		const valeur = parseFloat((data.get('valeur') as string) || '0');
		const libelle = (data.get('libelle') as string | null)?.trim() || '';

		if (!noteId) {
			return fail(400, { error: 'noteId requis' });
		}
		if (isNaN(valeur) || valeur < 0 || valeur > 20) {
			return fail(400, { error: 'La note doit être comprise entre 0 et 20' });
		}

		try {
			const note = await updateNote(noteId, { valeur, libelle });
			logActivity(locals.user, 'modification_note' as any, `Note modifiée : ${valeur}/20`).catch(
				() => {}
			);
			return { success: true, note };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la modification de la note' });
		}
	},

	createNotesBatch: async ({ request, locals }) => {
		const data = await request.formData();
		const coursId = data.get('coursId') as string;
		const examenId = (data.get('examenId') as string | null)?.trim() || undefined;
		const libelle = (data.get('libelle') as string | null)?.trim() || '';
		const notesRaw = data.get('notes') as string;

		if (!coursId) {
			return fail(400, { error: 'Cours introuvable' });
		}
		if (!notesRaw) {
			return fail(400, { error: 'Aucune note à enregistrer' });
		}

		let notesMap: Record<string, number | string>;
		try {
			notesMap = JSON.parse(notesRaw);
		} catch {
			return fail(400, { error: 'Données de notes invalides' });
		}

		try {
			const cours = await prisma.cours.findUnique({
				where: { id: coursId },
				select: { classeId: true }
			});
			if (!cours) {
				return fail(404, { error: 'Cours introuvable' });
			}

			const annee = await getActiveAnneeScolaire();
			if (!annee) {
				return fail(500, { error: 'Aucune année scolaire active' });
			}

			const inscriptions = await prisma.inscription.findMany({
				where: { classeId: cours.classeId, anneeId: annee.id, actif: true },
				select: { id: true, eleveId: true }
			});
			const inscriptionByEleve = new Map(inscriptions.map((i) => [i.eleveId, i.id]));

			let enregistrees = 0;
			for (const [eleveId, rawValeur] of Object.entries(notesMap)) {
				if (rawValeur === '' || rawValeur === null || rawValeur === undefined) continue;
				const valeur = typeof rawValeur === 'number' ? rawValeur : parseFloat(rawValeur);
				if (isNaN(valeur) || valeur < 0 || valeur > 20) continue;

				const noteExistante = await prisma.note.findFirst({
					where: {
						eleveId,
						coursId,
						examenId: examenId || null
					}
				});

				if (noteExistante) {
					await updateNote(noteExistante.id, { valeur, libelle });
				} else {
					await createNote({
						valeur,
						coefficient: 1,
						libelle: libelle || undefined,
						eleveId,
						coursId,
						examenId: examenId || undefined,
						inscriptionId: inscriptionByEleve.get(eleveId) || undefined
					});
				}
				enregistrees++;
			}

			logActivity(
				locals.user,
				'creation_note' as any,
				`Notes enregistrées (${enregistrees})`
			).catch(() => {});

			return { success: true, enregistrees };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la sauvegarde des notes' });
		}
	},

	deleteNote: async ({ request, locals }) => {
		const data = await request.formData();
		const noteId = data.get('noteId') as string;

		if (!noteId) {
			return fail(400, { error: 'noteId requis' });
		}

		try {
			await deleteNote(noteId);
			logActivity(locals.user, 'suppression_note' as any, 'Note supprimée').catch(() => {});
			return { success: true, noteId };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la suppression de la note' });
		}
	},

	getNotes: async ({ request, params }) => {
		try {
			const url = new URL(request.url);
			const coursId = url.searchParams.get('coursId');
			if (!coursId) {
				return fail(400, { error: 'coursId requis' });
			}
			const notes = await getNotesByCoursIdSorted(coursId);
			return {
				success: true,
				notes: notes.map((n) => ({
					id: n.id,
					valeur: n.valeur,
					coefficient: n.coefficient,
					libelle: n.libelle || '',
					eleveId: n.eleveId,
					eleveNom: `${n.eleve.personne.name} ${n.eleve.personne.lastname}`,
					coursId: n.coursId,
					examenId: n.examenId || undefined,
					date: n.date.toISOString()
				}))
			};
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la récupération des notes' });
		}
	},

	updateMatiere: async ({ request }) => {
		const data = await request.formData();
		const matiereId = data.get('matiereId') as string;
		const nom = (data.get('nom') as string | null)?.trim() || '';
		const couleur = (data.get('couleur') as string | null)?.trim() || null;

		if (!matiereId) {
			return fail(400, { error: 'Matiere requise' });
		}

		try {
			const matiere = await updateMatiere(matiereId, {
				nom: nom || undefined,
				couleur: couleur || undefined
			});
			return { success: true, matiere };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la mise à jour' });
		}
	},

	updateCoursImage: async ({ request }) => {
		const formData = await request.formData();
		const coursId = formData.get('coursId') as string;
		const imageUrl = formData.get('imageUrl') as string;

		if (!coursId || !imageUrl) {
			return fail(400, { error: 'coursId et imageUrl requis' });
		}

		try {
			await updateCoursImage(coursId, imageUrl);
			return { success: true, url: imageUrl };
		} catch (e: any) {
			return fail(500, { error: e?.message || "Erreur lors de la mise à jour de l'image" });
		}
	}
};
