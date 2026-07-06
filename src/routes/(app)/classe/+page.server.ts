import type { PageServerLoad, Actions } from './$types';
import { getClasses, getProfesseurs, createClasse, updateClasseImage, deleteClasse, prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';

export const load: PageServerLoad = async () => {
	const classes = await getClasses();
	const listClasse = classes.map(
		(c): { id: string; nom: string; niveau: number; series: string; titulaire: string; titulaireId: string | null; eleves: number; url?: string } => ({
			id: c.id,
			nom: c.nom || '',
			niveau: c.niveau,
			series: c.serie || '',
			titulaire: c.titulaire ? `${c.titulaire.personne.name} ${c.titulaire.personne.lastname}` : '',
			titulaireId: c.titulaireId,
			eleves: c.elevesCount,
			url: c.imageUrl || undefined
		})
	);
	const profs = await getProfesseurs();
	const enseignants = profs.map((p) => ({
		id: p.id,
		name: p.personne.name,
		lastname: p.personne.lastname,
		email: p.personne.email,
		phone: p.personne.phone
	}));
	return {
		listClasse,
		enseignants
	};
};

export const actions: Actions = {
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
		} catch (e: any) {
			return fail(500, { errors: { _form: e?.message || "Erreur lors de la création" } });
		}
	},
	updateImage: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const imageUrl = formData.get('imageUrl') as string;
		if (!id || !imageUrl) {
			return fail(400, { error: 'id et imageUrl requis' });
		}
		try {
			const oldClasse = await prisma.classe.findUnique({
				where: { id },
				select: { imageUrl: true }
			});
			await updateClasseImage(id, imageUrl);
			return { success: true, oldImageUrl: oldClasse?.imageUrl || null };
		} catch (e: any) {
			return fail(500, { error: e?.message || "Erreur lors de la mise à jour de l'image" });
		}
	},
	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'ID requis' });
		try {
			await deleteClasse(id);
			logActivity(
				locals.user,
				'suppression_classe',
				'Suppression de la classe'
			).catch(() => {});
			return { success: true };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la suppression' });
		}
	}
};
