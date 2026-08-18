import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const eleve = await prisma.eleve.findUnique({
		where: { id: params.id },
		include: {
			personne: true,
			notes: {
				include: {
					cours: { include: { matiere: true } },
					examen: { select: { id: true, nom: true, periode: true, date: true, classeId: true } },
					sousExamen: { select: { id: true, nom: true } }
				}
			},
			absences: true,
			retards: true,
			incidents: { orderBy: { date: 'desc' } }
		}
	});

	if (!eleve) throw error(404, 'Élève introuvable');

	const inscriptions = await prisma.inscription.findMany({
		where: { eleveId: params.id },
		include: {
			classe: { select: { id: true, nom: true, niveau: true, serie: true } },
			anneeScolaire: { select: { id: true, nom: true } }
		},
		orderBy: { anneeId: 'desc' }
	});

	const notes = (eleve.notes || []).map((n) => ({
		id: n.id,
		valeur: n.valeur,
		coefficient: n.coefficient,
		date: n.date.toISOString(),
		matiereId: n.cours.matiereId,
		matiereNom: n.cours.matiere.nom,
		matiereCouleur: n.cours.matiere.couleur || null,
		coursId: n.coursId,
		examenId: n.examenId || null,
		examenNom: n.examen?.nom || null,
		examenPeriode: n.examen?.periode || null,
		examenDate: n.examen?.date.toISOString().split('T')[0] || null,
		classeId: n.examen?.classeId || null,
		sousExamenId: n.sousExamenId || null,
		sousExamenNom: n.sousExamen?.nom || null
	}));

	const absences = (eleve.absences || []).map((a) => ({
		id: a.id,
		date: a.date.toISOString().split('T')[0],
		justifie: a.justifie,
		motif: (a as any).motif || null
	}));
	const retards = (eleve.retards || []).map((r) => ({
		id: r.id,
		date: r.date.toISOString().split('T')[0],
		duree: r.duree,
		justifie: r.justifie,
		motif: (r as any).motif || null
	}));
	const incidents = (eleve.incidents || []).map((i) => ({
		id: i.id,
		type: i.type,
		message: i.message,
		date: i.date.toISOString().split('T')[0]
	}));

	return {
		eleve: {
			id: eleve.id,
			nom: eleve.personne.name,
			prenom: eleve.personne.lastname,
			im: eleve.im ?? null,
			sexe: eleve.sexe ?? null,
			dateNaissance: eleve.dateNaissance?.toISOString().split('T')[0] || '',
			situation: eleve.situation ?? 'P'
		},
		inscriptions: inscriptions.map((ins) => ({
			id: ins.id,
			classeNom: ins.classe?.nom ?? null,
			classeNiveau: ins.classe?.niveau ?? 0,
			serie: ins.classe?.serie ?? null,
			anneeNom: ins.anneeScolaire.nom,
			actif: ins.actif,
			resultat: ins.resultat
		})),
		notes,
		absences,
		retards,
		incidents
	};
};
