import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/prisma';
import type { Cours, Examen, EleveCours } from '$lib/types/Materiel.type';
import { fail, redirect } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import { broadcastRealtime } from '$lib/server/realtime';

// Vérifie qu'un utilisateur a le droit d'accéder à la délibération d'une classe :
// admins, surveillants, ou le professeur titulaire (responsable) de la classe.
async function peutDeliberer(
	locals: App.Locals,
	titulairePersonneId?: string | null
): Promise<boolean> {
	const user = locals.user;
	if (!user) return false;
	if (user.role === 'ADMINISTRATEUR' || user.role === 'SURVEILLANT') return true;
	if (user.role === 'ENSEIGNANT') {
		if (!titulairePersonneId) return false;
		const compte = await prisma.compte.findUnique({
			where: { id: user.userId },
			select: { personneId: true }
		});
		return !!compte && compte.personneId === titulairePersonneId;
	}
	return false;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const classe = await prisma.classe.findUnique({
		where: { id: params.id },
		include: {
			anneeScolaire: true,
			titulaire: {
				include: {
					personne: true
				}
			},
			inscriptions: {
				include: {
					eleve: {
						include: {
							personne: true,
							notes: true,
							absences: true,
							retards: true,
							incidents: true
						}
					}
				}
			}
		}
	});

	if (!(await peutDeliberer(locals, classe?.titulaire?.personneId))) {
		throw redirect(303, '/classe');
	}

	const coursList = await prisma.cours.findMany({
		where: { classeId: params.id },
		include: {
			matiere: true,
			professeur: {
				include: {
					personne: true
				}
			}
		}
	});

	const listeCours: Cours[] = coursList.map((c) => ({
		id: c.id,
		nom: c.matiere.nom,
		coefficient: c.coefficient,
		professeur: c.professeur
			? `${c.professeur.personne.name} ${c.professeur.personne.lastname}`
			: '',
		participants: c.participants || [],
		matiereId: c.matiereId,
		matiere: c.matiere
			? { id: c.matiere.id, nom: c.matiere.nom, couleur: c.matiere.couleur || undefined }
			: undefined
	}));

	const examens = await prisma.examen.findMany({
		where: { classeId: params.id },
		orderBy: { date: 'asc' },
		include: { sousExamens: { orderBy: { createdAt: 'asc' } } }
	});

	const listeExamens: Examen[] = examens.map((e) => ({
		id: e.id,
		nom: e.nom,
		date: e.date.toISOString().split('T')[0],
		classeId: e.classeId,
		periode: e.periode || undefined,
		sousExamens: (e.sousExamens || []).map((s: any) => ({
			id: s.id,
			nom: s.nom,
			examenId: s.examenId
		}))
	}));

	// Justification des absences/retards (liées à un rapport)
	const allAbsenceIds = (classe?.inscriptions || []).flatMap(
		(i) => i.eleve.absences?.map((a) => a.id) ?? []
	);
	const allRetardIds = (classe?.inscriptions || []).flatMap(
		(i) => i.eleve.retards?.map((r) => r.id) ?? []
	);
	const lignesJustifiees = await prisma.rapportLigne.findMany({
		where: {
			OR: [{ absenceId: { in: allAbsenceIds } }, { retardId: { in: allRetardIds } }]
		},
		select: { absenceId: true, retardId: true }
	});
	const justifiedAbsenceIds = new Set(
		lignesJustifiees.filter((l) => l.absenceId).map((l) => l.absenceId as string)
	);
	const justifiedRetardIds = new Set(
		lignesJustifiees.filter((l) => l.retardId).map((l) => l.retardId as string)
	);

	const elevesClasse: EleveCours[] = (classe?.inscriptions || [])
		.filter((i: any) => i.actif)
		.map((i: any) => ({
			id: i.eleve.id,
			nom: i.eleve.personne.name,
			prenom: i.eleve.personne.lastname,
			dateNaissance: i.eleve.dateNaissance?.toISOString().split('T')[0] || '',
			domicile: i.eleve.personne.domicile || '',
			im: i.eleve.im ?? null,
			sexe: i.eleve.sexe ?? null,
			redoublant: i.eleve.redoublant ?? false,
			actif: i.actif,
			resultat: i.resultat || 'EN_ATTENTE',
			inscriptionId: i.id,
			url: i.eleve.personne.imageUrl || undefined,
			notes:
				i.eleve.notes?.map((n: any) => ({
					id: n.id,
					valeur: n.valeur,
					coefficient: n.coefficient,
					date: n.date.toISOString(),
					libelle: n.libelle || '',
					coursId: n.coursId,
					eleveId: n.eleveId,
					examenId: n.examenId || undefined,
					sousExamenId: n.sousExamenId || undefined
				})) || [],
			incidents:
				i.eleve.incidents?.map((inc: any) => ({
					id: inc.id,
					type: 'incident',
					date: inc.date.toISOString(),
					description: inc.motif || inc.message || ''
				})) || [],
			absences:
				i.eleve.absences?.map((a: any) => ({
					id: a.id,
					date: a.date.toISOString(),
					justifie: justifiedAbsenceIds.has(a.id)
				})) || [],
			retards:
				i.eleve.retards?.map((r: any) => ({
					id: r.id,
					date: r.date.toISOString(),
					duree: r.duree,
					justifie: justifiedRetardIds.has(r.id)
				})) || []
		}));

	// Tri alphabétique pour un défilement logique
	elevesClasse.sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'));

	const adminCompte = await prisma.compte.findFirst({
		where: { role: 'ADMINISTRATEUR', statut: 'ACTIF' },
		include: { personne: true }
	});
	const administrateurNom = adminCompte?.personne
		? `${adminCompte.personne.lastname ?? ''} ${adminCompte.personne.name ?? ''}`.trim() || null
		: null;

	return {
		classe,
		listeCours,
		listeExamens,
		elevesClasse,
		administrateurNom
	};
};

export const actions: Actions = {
	setResultat: async ({ request, locals }) => {
		const data = await request.formData();
		const inscriptionId = data.get('inscriptionId') as string;
		const resultat = (data.get('resultat') as string) || '';

		if (!inscriptionId) {
			return fail(400, { error: 'inscriptionId requis' });
		}

		const valeursValides = ['EN_ATTENTE', 'ADMIS', 'AJOURNE'];
		if (!valeursValides.includes(resultat)) {
			return fail(400, { error: 'Résultat invalide' });
		}

		const inscription = await prisma.inscription.findUnique({
			where: { id: inscriptionId },
			include: {
				classe: {
					include: {
						titulaire: true
					}
				}
			}
		});

		if (!inscription?.classe) {
			return fail(404, { error: 'Inscription introuvable' });
		}

		if (!(await peutDeliberer(locals, inscription.classe.titulaire?.personneId))) {
			return fail(403, {
				error: 'Vous n\'avez pas le droit de délibérer pour cette classe'
			});
		}

		try {
			const updated = await prisma.inscription.update({
				where: { id: inscriptionId },
				data: { resultat: resultat as 'EN_ATTENTE' | 'ADMIS' | 'AJOURNE' }
			});

			logActivity(
				locals.user,
				'deliberation' as any,
				`Délibération : résultat de l'élève mis à jour → ${resultat}`
			).catch(() => {});

			broadcastRealtime({ entity: 'eleve', action: 'update', id: inscriptionId });

			return { success: true, resultat: updated.resultat };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la délibération' });
		}
	}
};
