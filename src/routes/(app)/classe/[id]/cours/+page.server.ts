import type { PageServerLoad, Actions } from './$types';
import {
	getClasseById,
	getMatieres,
	getProfesseurs,
	getCours,
	createCours,
	updateCours,
	deleteCours,
	createExamen,
	createNote,
	getNotesByCoursId,
	prisma
} from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import type { Cours, Examen, EleveCours, Note } from '$lib/types/Materiel.type';

export const load: PageServerLoad = async ({ params }) => {
	const classe = await getClasseById(params.id);
	if (!classe) {
		throw fail(404, { error: 'Classe introuvable' });
	}

	const [allMatieres, profs, coursList, examens, inscriptions] = await Promise.all([
		getMatieres(),
		getProfesseurs(),
		getCours(),
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
			participants: c.participants || []
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
		classe,
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
			let finalMatiereId = matiereId;

			if (matiereNom) {
				let matiere = await prisma.matiere.findUnique({
					where: { nom: matiereNom }
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
					matiere = await prisma.matiere.create({
						data: {
							nom: matiereNom,
							couleur: randomColor
						}
					});
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

	updateCoefficient: async ({ request, params }) => {
		const data = await request.formData();
		const coursId = data.get('coursId') as string;
		const coefficient = parseInt((data.get('coefficient') as string) || '1', 10);

		if (!coursId) {
			return fail(400, { error: 'coursId requis' });
		}

		try {
			const cours = await updateCours(coursId, {
				coefficient: Number.isFinite(coefficient) ? coefficient : 1
			});
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
		const coefficient = parseInt((data.get('coefficient') as string) || '1', 10);
		const libelle = (data.get('libelle') as string | null)?.trim() || '';
		const eleveId = data.get('eleveId') as string;
		const coursId = data.get('coursId') as string;
		const examenId = (data.get('examenId') as string | null)?.trim() || undefined;

		if (isNaN(valeur) || !eleveId || !coursId) {
			return fail(400, { error: 'Valeur, élève et cours requis' });
		}

		try {
			const note = await createNote({
				valeur,
				coefficient: Number.isFinite(coefficient) && coefficient > 0 ? coefficient : 1,
				libelle: libelle || undefined,
				eleveId,
				coursId,
				examenId
			});

			logActivity(locals.user, 'creation_note' as any, `Note créée : ${valeur}/20`).catch(() => {});

			return { success: true, note };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la création de la note' });
		}
	},

	getNotes: async ({ params }) => {
		try {
			const coursId = params.id;
			const notes = await getNotesByCoursId(coursId);
			return {
				success: true,
				notes: notes.map((n) => ({
					id: n.id,
					valeur: n.valeur,
					coefficient: n.coefficient,
					libelle: n.libelle || '',
					eleveId: n.eleveId,
					eleveNom: `${n.eleve.personne.name} ${n.eleve.personne.lastname}`,
					coursId: n.coursId
				}))
			};
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la récupération des notes' });
		}
	}
};
