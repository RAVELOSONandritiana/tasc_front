import type { PageServerLoad, Actions } from './$types';
import { prisma, getActiveAnneeScolaire } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import { registerPointage, PointageError } from '$lib/server/pointage';
import { numeroClasse } from '$lib/utils';

type ElevePresence = {
	id: string;
	nom: string;
	prenom: string;
	sexe: string;
	numero: string;
	dateNaissance: string;
	actif: boolean;
	photoUrl?: string | null;
	imageUrl?: string | null;
};

function heuresPrevuesCalc(
	seanceEDT: { heureDebut?: string | null; heureFin?: string | null } | null
): number | null {
	if (!seanceEDT?.heureDebut || !seanceEDT?.heureFin) return null;
	const [h1, m1] = seanceEDT.heureDebut.split(':').map(Number);
	const [h2, m2] = seanceEDT.heureFin.split(':').map(Number);
	if ([h1, m1, h2, m2].some((n) => Number.isNaN(n))) return null;
	const diff = h2 * 60 + m2 - (h1 * 60 + m1);
	return diff > 0 ? Math.round((diff / 60) * 100) / 100 : null;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const classeId = params.id;
	const coursId = params.coursId;

	const classe = await prisma.classe.findUnique({
		where: { id: classeId },
		include: {
			inscriptions: {
				where: { actif: true },
				include: { eleve: { include: { personne: true } } }
			}
		}
	});

	const cours = await prisma.cours.findUnique({
		where: { id: coursId },
		include: { matiere: true, professeur: { include: { personne: true } } }
	});

	if (!classe || !cours) {
		throw redirect(303, `/classe/${classeId}/cours`);
	}

	const seanceEDT = await prisma.seanceEDT.findFirst({
		where: { coursId: coursId },
		include: { salle: true }
	});

	const elevesBruts = classe.inscriptions.map((inscription) => ({
		id: inscription.eleve.id,
		nom: inscription.eleve.personne.lastname,
		prenom: inscription.eleve.personne.name,
		sexe: inscription.eleve.sexe || 'G',
		dateNaissance: inscription.eleve.dateNaissance.toISOString().split('T')[0],
		actif: inscription.actif,
		photoUrl: inscription.eleve.photoUrl,
		imageUrl: inscription.eleve.personne.imageUrl || null
	}));

	const eleves: ElevePresence[] = elevesBruts.map((e) => ({
		...e,
		numero: numeroClasse(e, elevesBruts)
	}));

	const annee = await getActiveAnneeScolaire();

	const currentProfesseurId = locals.user
		? ((
				await prisma.compte.findUnique({
					where: { id: locals.user.userId },
					include: { personne: { include: { professeur: true } } }
				})
			)?.personne?.professeur?.id ?? null)
		: null;

	const historique = await prisma.pointage.findMany({
		where: { coursId: coursId },
		orderBy: { date: 'desc' },
		take: 15,
		include: {
			professeur: { include: { personne: true } },
			absences: { include: { eleve: { include: { personne: true } } } },
			retards: { include: { eleve: { include: { personne: true } } } }
		}
	});

	return {
		eleves,
		classeId,
		coursId,
		coursNom: cours.matiere.nom,
		coefficient: cours.coefficient,
		professeur: cours.professeur
			? `${cours.professeur.personne.name} ${cours.professeur.personne.lastname}`
			: '—',
		professeurId: cours.professeurId ?? null,
		salleNom: seanceEDT?.salle?.nom || 'Non définie',
		heureDebut: seanceEDT?.heureDebut || '08:00',
		heureFin: seanceEDT?.heureFin || '10:00',
		heuresPrevues: heuresPrevuesCalc(seanceEDT),
		seuilAbsence: annee?.seuilAbsenceConvoc ?? 3,
		canEdit:
			!!annee &&
			(locals.user?.role === 'SURVEILLANT' ||
				locals.user?.role === 'OPERATEUR' ||
				locals.user?.role === 'ADMINISTRATEUR' ||
				(locals.user?.role === 'ENSEIGNANT' && cours.professeurId === currentProfesseurId)),
		historique: historique.map((p) => ({
			id: p.id,
			date: p.date.toISOString(),
			professeur: p.professeur
				? `${p.professeur.personne.name} ${p.professeur.personne.lastname}`
				: '—',
			heuresEffectuees: p.heuresEffectuees,
			heuresPrevues: p.heuresPrevues ?? null,
			causeIncomplet: p.causeIncomplet || null,
			absents: p.absences.map((a) => `${a.eleve.personne.name} ${a.eleve.personne.lastname}`),
			retards: p.retards.map((r) => `${r.eleve.personne.name} ${r.eleve.personne.lastname}`)
		}))
	};
};

export const actions: Actions = {
	enregistrer: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const dateRaw = (formData.get('date') as string) || '';
		const heuresEffectueesRaw = formData.get('heuresEffectuees') as string;
		const causeIncomplet = (formData.get('causeIncomplet') as string)?.trim() || null;
		const absentIds = formData.getAll('absentIds').map(String).filter(Boolean);
		const retardIds = formData.getAll('retardIds').map(String).filter(Boolean);
		const profAbsent = formData.get('profAbsent') === 'true';
		const motifProfAbsent = (formData.get('motifAbsence') as string)?.trim() || null;

		const heuresEffectuees = parseFloat(heuresEffectueesRaw);

		try {
			const result = await registerPointage({
				classeId: params.id,
				coursId: params.coursId,
				dateRaw,
				heuresEffectuees,
				causeIncomplet,
				absentIds,
				retardIds,
				profAbsent,
				motifProfAbsent,
				locals
			});
			return { success: true, alertes: result.alertes };
		} catch (e) {
			if (e instanceof PointageError) {
				return fail(e.status, { error: e.message });
			}
			console.error('Erreur pointage:', e);
			return fail(500, { error: 'Erreur lors de l’enregistrement' });
		}
	}
};
