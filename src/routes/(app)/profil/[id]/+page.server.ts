import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ params }) => {
	let compte = await prisma.compte.findUnique({
		where: { id: params.id },
		include: {
			personne: true,
			profil: true
		}
	});

	if (!compte) {
		compte = await prisma.compte.findFirst({
			where: { personneId: params.id },
			include: {
				personne: true,
				profil: true
			}
		});
	}

	if (!compte) {
		throw new Error('Utilisateur non trouvé');
	}

	const roleMap: Record<string, string> = {
		ADMINISTRATEUR: 'Administrateur',
		ENSEIGNANT: 'Enseignant',
		SURVEILLANT: 'Surveillant',
		PERSONNEL: 'Personnel'
	};

	return {
		user: {
			id: compte.id,
			matricule: compte.matricule,
			role: roleMap[compte.role] || compte.role,
			nom: compte.personne.lastname,
			prenom: compte.personne.name,
			email: compte.personne.email,
			phone: compte.personne.phone,
			domicile: compte.personne.domicile || '',
			commune: compte.personne.commune || '',
			fokontany: compte.personne.fokontany || '',
			dateCreation: compte.dateCreation.toISOString().split('T')[0],
			bio: compte.profil?.bio || '',
			adresse: compte.profil?.adresse || compte.personne.domicile || ''
		}
	};
};
