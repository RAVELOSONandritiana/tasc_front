import type { PageServerLoad, Actions } from './$types';
import { getClasses, createClasse } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';

export const load: PageServerLoad = async () => {
	const classes = await getClasses();
	const listClasse = classes.map(
		(c): { id: string; nom: string; niveau: number; series: string; titulaire: string; eleves: number } => ({
			id: c.id,
			nom: c.nom || '',
			niveau: c.niveau,
			series: c.serie || '',
			titulaire: c.titulaire ? `${c.titulaire.personne.name} ${c.titulaire.personne.lastname}` : '',
			eleves: c.elevesCount
		})
	);
	return {
		listClasse
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();

		const nom = (data.get('nom') as string | null)?.trim() || '';
		const niveau = parseInt((data.get('niveau') as string) || '0', 10);
		const serie = (data.get('serie') as string | null)?.trim() || '';
		const titulaireId = (data.get('titulaireId') as string | null)?.trim() || undefined;

		const errors: Record<string, string> = {};

		if (isNaN(niveau) || niveau < 0 || niveau > 2) {
			errors.niveau = 'Niveau invalide';
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors });
		}

		try {
			const classe = await createClasse({
				nom: nom || undefined,
				niveau,
				serie: serie || undefined,
				titulaireId
			});

			logActivity(
				locals.user,
				'creation_classe',
				`Création de la classe ${classe.nom || niveau + (serie ? ' ' + serie.toUpperCase() : '')}`
			).catch(() => {});

			return { success: true, classe };
		} catch (e) {
			return fail(500, { errors: { _form: "Erreur lors de la création" } });
		}
	}
};
