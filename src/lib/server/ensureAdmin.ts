import crypto from 'crypto';
import { prisma } from './prisma';
import { hashPassword } from './auth';

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

	// Mot de passe initial : fourni par variable d'environnement, sinon généré
	// aléatoirement et journalisé une fois pour la première configuration. On ne
	// garde jamais un mot de passe codé en dur et devinable.
	const ADMIN_PASSWORD =
		process.env.ADMIN_PASSWORD ||
		(() => {
			const gen = crypto.randomBytes(9).toString('base64url');
			console.warn(
				`[SECURITE] Compte administrateur initial cree. Mot de passe genere : ${gen} ` +
					`— connectez-vous (matricule ${DEFAULT_MATRICULE}) et changez-le immediatement.`
			);
			return gen;
		})();

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
