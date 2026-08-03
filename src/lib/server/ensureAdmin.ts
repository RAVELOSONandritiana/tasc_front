import { prisma } from './prisma';
import { hashPassword } from './auth';

const ADMIN_PASSWORD = '666666';

export async function ensureAdmin() {
	const DEFAULT_MATRICULE = '666666';

	const defaultAdmin = await prisma.compte.findUnique({
		where: { matricule: DEFAULT_MATRICULE }
	});
	if (defaultAdmin) return defaultAdmin;

	// Si le matricule par défaut a été modifié mais qu'un compte admin existe déjà,
	// on ne le recrée pas.
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
			matricule: DEFAULT_MATRICULE,
			password: hashPassword(ADMIN_PASSWORD),
			role: 'ADMINISTRATEUR',
			statut: 'ACTIF',
			personneId: personne.id
		}
	});

	return compte;
}
