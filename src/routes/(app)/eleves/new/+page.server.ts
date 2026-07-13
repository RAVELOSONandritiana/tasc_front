import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { createEleve, getActiveAnneeScolaire, updateEleveInfos, prisma } from '$lib/server/prisma';
import { logActivity } from '$lib/server/activity';
import { broadcastRealtime } from '$lib/server/realtime';

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();

		const nom = (data.get('nom') as string | null)?.trim() || '';
		const prenom = (data.get('prenom') as string | null)?.trim() || '';
		const dateNaissance = (data.get('dateNaissance') as string | null)?.trim() || '';
		const lieuNaissance = (data.get('lieuNaissance') as string | null)?.trim() || '';
		const communeNaissance = (data.get('communeNaissance') as string | null)?.trim() || '';
		const regionNaissance = (data.get('regionNaissance') as string | null)?.trim() || '';
		const provinceNaissance = (data.get('provinceNaissance') as string | null)?.trim() || '';
		const domicile = (data.get('domicile') as string | null)?.trim() || '';
		const fokontany = (data.get('fokontany') as string | null)?.trim() || '';
		const communeResidence = (data.get('communeResidence') as string | null)?.trim() || '';
		const regionResidence = (data.get('regionResidence') as string | null)?.trim() || '';
		const provinceResidence = (data.get('provinceResidence') as string | null)?.trim() || '';
		const cin = (data.get('cin') as string | null)?.trim() || '';
		const telephoneEleve = (data.get('telephoneEleve') as string | null)?.trim() || '';
		const emailEleve = (data.get('emailEleve') as string | null)?.trim() || '';
		const nomPere = (data.get('nomPere') as string | null)?.trim() || '';
		const prenomPere = (data.get('prenomPere') as string | null)?.trim() || '';
		const telephonePere = (data.get('telephonePere') as string | null)?.trim() || '';
		const nomMere = (data.get('nomMere') as string | null)?.trim() || '';
		const prenomMere = (data.get('prenomMere') as string | null)?.trim() || '';
		const telephoneMere = (data.get('telephoneMere') as string | null)?.trim() || '';
		const nomTuteur = (data.get('nomTuteur') as string | null)?.trim() || '';
		const prenomTuteur = (data.get('prenomTuteur') as string | null)?.trim() || '';
		const telephoneTuteur = (data.get('telephoneTuteur') as string | null)?.trim() || '';
		const im = (data.get('im') as string | null)?.trim() || '';
		const sexe = (data.get('sexe') as string | null)?.trim() || '';
		const redoublant = data.get('statut') === 'true';

		const errors: Record<string, string> = {};

		if (!nom) errors.nom = 'Le nom est obligatoire';
		if (!prenom) errors.prenom = 'Le prénom est obligatoire';
		if (!dateNaissance) errors.dateNaissance = 'La date de naissance est obligatoire';
		if (!sexe) errors.sexe = 'Le sexe est obligatoire';
		if (!lieuNaissance) errors.lieuNaissance = 'Le lieu de naissance est obligatoire';
		if (!domicile) errors.domicile = 'Le domicile est obligatoire';
		if (!fokontany) errors.fokontany = 'Le fokontany est obligatoire';
		if (!communeResidence) errors.communeResidence = 'La commune de résidence est obligatoire';
		if (telephoneEleve && !/^(\+261|0)[0-9]{9,10}$/.test(telephoneEleve))
			errors.telephoneEleve = 'Format invalide';
		if (emailEleve && !/^[\w.-]+@[\w.-]+\.\w+$/.test(emailEleve))
			errors.emailEleve = 'Format invalide';
		if (cin && !/^[0-9]{12}$/.test(cin.replace(/\s/g, ''))) errors.cin = '12 chiffres requis';

		const pereComplet = Boolean(nomPere && prenomPere);
		const mereComplet = Boolean(nomMere && prenomMere);
		const tuteurComplet = Boolean(nomTuteur && prenomTuteur);

		if (nomPere && !prenomPere) errors.prenomPere = 'Le prénom du père est obligatoire';
		if (!nomPere && prenomPere) errors.nomPere = 'Le nom du père est obligatoire';
		if (telephonePere && !/^(\+261|0)[0-9]{9,10}$/.test(telephonePere))
			errors.telephonePere = 'Format invalide';

		if (nomMere && !prenomMere) errors.prenomMere = 'Le prénom de la mère est obligatoire';
		if (!nomMere && prenomMere) errors.nomMere = 'Le nom de la mère est obligatoire';
		if (telephoneMere && !/^(\+261|0)[0-9]{9,10}$/.test(telephoneMere))
			errors.telephoneMere = 'Format invalide';

		if (nomTuteur && !prenomTuteur) errors.prenomTuteur = 'Le prénom du tuteur est obligatoire';
		if (!nomTuteur && prenomTuteur) errors.nomTuteur = 'Le nom du tuteur est obligatoire';
		if (telephoneTuteur && !/^(\+261|0)[0-9]{9,10}$/.test(telephoneTuteur))
			errors.telephoneTuteur = 'Format invalide';

		if (!pereComplet && !mereComplet && !tuteurComplet) {
			errors.responsable =
				'Au moins un responsable (père, mère ou tuteur) avec nom et prénom est obligatoire';
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors });
		}

		// Re-inscription : si un eleve avec le meme IM existe deja, on met a jour
		// sa fiche et on cree une nouvelle inscription pour l'annee active, au lieu
		// de dupliquer la personne (l'email est unique et provoquerait une erreur).
		if (im) {
			const existant = await prisma.eleve.findFirst({
				where: { im: { equals: im, mode: 'insensitive' as const } },
				include: { personne: true }
			});

			if (existant) {
				const annee = await getActiveAnneeScolaire();
				await updateEleveInfos(existant.id, {
					name: nom,
					lastname: prenom,
					email: emailEleve || undefined,
					phone: telephoneEleve || undefined,
					domicile: domicile || null,
					fokontany: fokontany || null,
					commune: communeResidence || null,
					dateNaissance,
					im: im || null,
					sexe: sexe || null,
					redoublant,
					cin: cin || null,
					lieuNaissance: lieuNaissance || null,
					communeNaissance: communeNaissance || null,
					regionNaissance: regionNaissance || null,
					provinceNaissance: provinceNaissance || null,
					regionResidence: regionResidence || null,
					provinceResidence: provinceResidence || null,
					nomPere: nomPere || null,
					prenomPere: prenomPere || null,
					telephonePere: telephonePere || null,
					nomMere: nomMere || null,
					prenomMere: prenomMere || null,
					telephoneMere: telephoneMere || null,
					nomTuteur: nomTuteur || null,
					prenomTuteur: prenomTuteur || null,
					telephoneTuteur: telephoneTuteur || null
				});

				if (annee) {
					const inscription = await prisma.inscription.findFirst({
						where: { eleveId: existant.id, anneeId: annee.id }
					});
					if (!inscription) {
						await prisma.inscription.create({
							data: { eleveId: existant.id, anneeId: annee.id, actif: true }
						});
					} else {
						await prisma.inscription.update({
							where: { id: inscription.id },
							data: { actif: true }
						});
					}
				}

				broadcastRealtime({ entity: 'eleve', action: 'update', id: existant.id });
				broadcastRealtime({ entity: 'personne', action: 'update', id: existant.personneId });
				logActivity(
					locals.user,
					'creation_eleve',
					`Ré-inscription de l'élève ${nom} ${prenom}`
				).catch(() => {});

				return { success: true };
			}
		}

		try {
			const annee = await getActiveAnneeScolaire();
			const cree = await createEleve(
				{
					name: nom,
					lastname: prenom,
					email: emailEleve || `${Date.now()}@tmp.com`,
					phone: telephoneEleve || '',
					domicile: domicile.toUpperCase(),
					fokontany: fokontany.toUpperCase(),
					commune: communeResidence.toUpperCase(),
					dateNaissance,
					lieuNaissance: lieuNaissance || undefined,
					communeNaissance: communeNaissance || undefined,
					regionNaissance: regionNaissance || undefined,
					provinceNaissance: provinceNaissance || undefined,
					regionResidence: regionResidence || undefined,
					provinceResidence: provinceResidence || undefined,
					cin: cin || undefined,
					nomPere: nomPere || null,
					prenomPere: prenomPere || null,
					telephonePere: telephonePere || null,
					nomMere: nomMere || null,
					prenomMere: prenomMere || null,
					telephoneMere: telephoneMere || null,
					nomTuteur: nomTuteur || null,
					prenomTuteur: prenomTuteur || null,
					telephoneTuteur: telephoneTuteur || null,
					im: im || null,
					sexe: sexe || null,
					redoublant
				},
				annee?.id
			);
			broadcastRealtime({ entity: 'eleve', action: 'create', id: cree.eleve.id });
			broadcastRealtime({ entity: 'personne', action: 'create', id: cree.eleve.personneId });
		} catch (e: unknown) {
			console.error('ERREUR create eleve:', e);
			const msg = (e as Error)?.message || 'Erreur inconnue';
			return fail(500, {
				errors: { _form: `Erreur lors de la création : ${msg}`, error: msg }
			});
		}

		logActivity(locals.user, 'creation_eleve', `Création de l'élève ${nom} ${prenom}`).catch(
			() => {}
		);

		return { success: true };
	}
};
