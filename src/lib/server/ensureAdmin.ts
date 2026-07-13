import { prisma } from './prisma';
import { hashPassword } from './auth';

const ADMIN_PASSWORD = '666666';

export async function ensureAdmin() {
	const existing = await prisma.compte.findFirst({
		where: { role: 'ADMINISTRATEUR' }
	});

	if (existing) return existing;

	const personne = await prisma.personne.create({
		data: {
			name: 'Admin',
			lastname: 'Admin',
			email: 'admin@tasc.mg',
			phone: '0000000000'
		}
	});

	const compte = await prisma.compte.create({
		data: {
			matricule: '666666',
			password: hashPassword(ADMIN_PASSWORD),
			role: 'ADMINISTRATEUR',
			statut: 'ACTIF',
			personneId: personne.id
		}
	});

	return compte;
}
