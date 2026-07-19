import type { PageServerLoad, Actions } from './$types';
import { getEleveById, updateEleveInfos } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { Eleve, EleveStats } from '$lib/types/Personne.type';
import type { IncidentType } from '$lib/types/Incident.type';
import { formatClasseNom } from '$lib/utils';

function peutModifier(role?: string): boolean {
	return role === 'ADMINISTRATEUR' || role === 'SURVEILLANT';
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const prismaEleve = await getEleveById(params.id);
	if (!prismaEleve) {
		throw new Error('Élève non trouvé');
	}
	const inscription = prismaEleve.inscriptions?.[0];
	const notesPositives = prismaEleve.incidents?.filter((i) => i.type === 'NOTE').length || 0;
	const notesNegatives = prismaEleve.incidents?.filter((i) => i.type === 'ERREUR').length || 0;

	const incidents = (prismaEleve.incidents || []).map((inc) => ({
		id: inc.id,
		type: inc.type.toLowerCase() as IncidentType,
		message: inc.message,
		auteur: inc.auteur,
		date: inc.date.toISOString(),
		auteurId: inc.compteId || undefined
	}));

	const stats: EleveStats = {
		retards: 0,
		absences: 0,
		incidents: prismaEleve.incidents?.length || 0,
		notesPositives,
		notesNegatives,
		heuresCours: 0
	};

	const eleve: Eleve = {
		id: prismaEleve.id,
		nom: prismaEleve.personne.name,
		prenom: prismaEleve.personne.lastname,
		dateNaissance: prismaEleve.dateNaissance?.toISOString().split('T')[0] || '',
		classe: formatClasseNom(inscription?.classe?.niveau, inscription?.classe?.nom),
		email: prismaEleve.personne.email,
		telephone: prismaEleve.personne.phone || null,
		adresse:
			[prismaEleve.personne.domicile, prismaEleve.personne.fokontany, prismaEleve.personne.commune]
				.filter(Boolean)
				.join(', ') || null,
		personneId: prismaEleve.personne.id,
		imageUrl: prismaEleve.personne.imageUrl,
		domicile: prismaEleve.personne.domicile,
		fokontany: prismaEleve.personne.fokontany,
		commune: prismaEleve.personne.commune,
		redoublant: prismaEleve.redoublant,
		nomPere: prismaEleve.nomPere,
		prenomPere: prismaEleve.prenomPere,
		telephonePere: prismaEleve.telephonePere,
		nomMere: prismaEleve.nomMere,
		prenomMere: prismaEleve.prenomMere,
		telephoneMere: prismaEleve.telephoneMere,
		nomTuteur: prismaEleve.nomTuteur,
		prenomTuteur: prismaEleve.prenomTuteur,
		telephoneTuteur: prismaEleve.telephoneTuteur,
		im: prismaEleve.im,
		sexe: prismaEleve.sexe,
		stats
	};
	const canEdit = peutModifier(locals.user?.role);
	return { eleve, incidents, canEdit };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		if (!peutModifier(locals.user?.role)) {
			return fail(403, { error: 'Non autorisé' });
		}
		const form = await request.formData();
		const read = (k: string) => (form.get(k) as string | null)?.trim() ?? '';
		const name = read('nom');
		const lastname = read('prenom');
		const dateNaissance = read('dateNaissance');
		const sexe = read('sexe');
		const im = read('im');
		const email = read('email');
		const phone = read('telephone');
		const domicile = read('domicile');
		const fokontany = read('fokontany');
		const commune = read('commune');
		const redoublant = form.get('redoublant') === 'true';
		const nomPere = read('nomPere');
		const prenomPere = read('prenomPere');
		const telephonePere = read('telephonePere');
		const nomMere = read('nomMere');
		const prenomMere = read('prenomMere');
		const telephoneMere = read('telephoneMere');
		const nomTuteur = read('nomTuteur');
		const prenomTuteur = read('prenomTuteur');
		const telephoneTuteur = read('telephoneTuteur');

		if (!name) return fail(400, { error: 'Le nom est obligatoire' });
		if (!lastname) return fail(400, { error: 'Le prénom est obligatoire' });
		if (!dateNaissance) return fail(400, { error: 'La date de naissance est obligatoire' });
		if (sexe && sexe !== 'F' && sexe !== 'G') return fail(400, { error: 'Sexe invalide' });
		if (phone && !/^(\+261|0)[0-9]{9,10}$/.test(phone))
			return fail(400, { error: 'Numéro de téléphone invalide' });
		if (email && !/^[\w.-]+@[\w.-]+\.\w+$/.test(email))
			return fail(400, { error: 'Adresse email invalide' });

		try {
			await updateEleveInfos(params.id, {
				name,
				lastname,
				email: email || undefined,
				phone: phone || undefined,
				domicile: domicile || null,
				fokontany: fokontany || null,
				commune: commune || null,
				im: im || null,
				sexe: sexe || null,
				redoublant,
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
		} catch (e: unknown) {
			return fail(500, { error: 'Erreur lors de la mise à jour' });
		}
		return { success: true };
	}
};
