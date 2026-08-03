import type { LayoutServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load: LayoutServerLoad = async ({ params, locals }) => {
	const classe = await prisma.classe.findUnique({
		where: { id: params.id },
		select: { titulaireId: true, titulaire: { select: { personneId: true } } }
	});

	let peutDeliberer = false;
	const user = locals.user;
	if (user) {
		if (user.role === 'ADMINISTRATEUR' || user.role === 'SURVEILLANT') {
			peutDeliberer = true;
		} else if (user.role === 'ENSEIGNANT') {
			const compte = await prisma.compte.findUnique({
				where: { id: user.userId },
				select: { personneId: true }
			});
			peutDeliberer = !!compte && compte.personneId === classe?.titulaire?.personneId;
		}
	}

	return { peutDeliberer };
};
