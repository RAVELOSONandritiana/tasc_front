import type { PageServerLoad, Actions } from './$types';
import { getAnneeScolaires, createAnneeScolaire, setActiveAnneeScolaire, prisma } from '$lib/server/prisma';
import type { StatutCompte, RoleCompte } from '@prisma/client';
import { fail, redirect } from '@sveltejs/kit';

interface CompteView {
	id: string;
	nom: string;
	prenom: string;
	email: string;
	role: string;
	dateCreation: string;
	statut: 'en_attente' | 'actif' | 'bloque';
}

export const load: PageServerLoad = async () => {
	const annees = await getAnneeScolaires();
	const listeAnnees = annees.map(a => ({
		id: a.id,
		nom: a.nom,
		dateCreation: a.dateCreation.toISOString().split('T')[0],
		active: a.active
	}));

	const comptesRaw = await prisma.compte.findMany({
		include: {
			personne: true,
			profil: true
		},
		orderBy: {
			dateCreation: 'desc'
		}
	});

	const comptes: CompteView[] = comptesRaw.map(c => ({
		id: c.id,
		nom: c.personne.lastname,
		prenom: c.profil?.prenom || c.personne.name,
		email: c.personne.email,
		role: c.role,
		dateCreation: c.dateCreation.toISOString().split('T')[0],
		statut: c.statut === 'EN_ATTENTE' ? 'en_attente' : c.statut === 'ACTIF' ? 'actif' : 'bloque'
	}));

	return { comptes, listeAnnees };
};

export const actions: Actions = {
	validerCompte: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) return fail(400, { error: 'ID requis' });

		try {
			await prisma.compte.update({
				where: { id },
				data: { statut: 'ACTIF' }
			});
		} catch (error) {
			return fail(500, { error: 'Erreur lors de la validation' });
		}
		throw redirect(303, '/parametre');
	},

	bloquerCompte: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) return fail(400, { error: 'ID requis' });

		try {
			await prisma.compte.update({
				where: { id },
				data: { statut: 'BLOQUE' }
			});
		} catch (error) {
			return fail(500, { error: 'Erreur lors du blocage' });
		}
		throw redirect(303, '/parametre');
	},

	debloquerCompte: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) return fail(400, { error: 'ID requis' });

		try {
			await prisma.compte.update({
				where: { id },
				data: { statut: 'ACTIF' }
			});
		} catch (error) {
			return fail(500, { error: 'Erreur lors du déblocage' });
		}
		throw redirect(303, '/parametre');
	},

	creerAnnee: async ({ request }) => {
		const data = await request.formData();
		const nom = data.get('nom') as string;

		if (!nom?.trim()) return fail(400, { error: 'Nom requis' });

		try {
			await createAnneeScolaire(nom.trim());
		} catch (error) {
			return fail(500, { error: 'Erreur lors de la création' });
		}
		throw redirect(303, '/parametre');
	},

	activerAnnee: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) return fail(400, { error: 'ID requis' });

		try {
			await setActiveAnneeScolaire(id);
		} catch (error) {
			return fail(500, { error: 'Erreur lors de l\'activation' });
		}
		throw redirect(303, '/parametre');
	}
};