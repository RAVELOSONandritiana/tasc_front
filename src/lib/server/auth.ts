import crypto from 'crypto';
import { prisma } from './prisma';

// Le secret de signature de session ne doit JAMAIS être une valeur devinable.
// S'il n'est pas défini (ou trop court) dans l'environnement, on génère un
// secret aléatoire pour ce processus uniquement (les sessions existantes sont
// invalidées au redémarrage) et on avertit fortement. On ne garde jamais de
// défaut codé en dur pour éviter la contrefaçon de session.
const SESSION_SECRET = (() => {
	const secret = process.env.SESSION_SECRET;
	if (secret && secret.length >= 16) return secret;
	const generated = crypto.randomBytes(32).toString('hex');
	console.warn(
		'[SECURITE] SESSION_SECRET n est pas defini (ou trop court) dans l environnement. ' +
			'Un secret aleatoire est utilise pour ce processus uniquement : les sessions seront ' +
			'invalidees au redemarrage. Definissez SESSION_SECRET avec une valeur stable et ' +
			'aleatoire (>= 16 caracteres).'
	);
	return generated;
})();

export const SESSION_COOKIE = 'tasc_session';

// Duree de validite d'un jeton de session (7 jours).
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// --- Hachage des mots de passe : scrypt salte (resistant aux attaques) -------
// Les anciens mots de passe etaient en sha256 non sale ; verifyPassword gere
// les deux formats pour permettre une migration transparente.
const SCRYPT_PREFIX = 'scrypt$';

export function hashPassword(password: string): string {
	const salt = crypto.randomBytes(16);
	const derived = crypto.scryptSync(password, salt, 64);
	return `${SCRYPT_PREFIX}${salt.toString('hex')}$${derived.toString('hex')}`;
}

export function verifyPassword(password: string, hash: string | null | undefined): boolean {
	if (!hash) return false;
	if (hash.startsWith(SCRYPT_PREFIX)) {
		const [saltHex, hashHex] = hash.slice(SCRYPT_PREFIX.length).split('$');
		if (!saltHex || !hashHex) return false;
		try {
			const salt = Buffer.from(saltHex, 'hex');
			const expected = Buffer.from(hashHex, 'hex');
			const derived = crypto.scryptSync(password, salt, expected.length);
			return crypto.timingSafeEqual(derived, expected);
		} catch {
			return false;
		}
	}
	// Legacy : sha256 non sale. A conserver pour la migration.
	try {
		const legacy = crypto.createHash('sha256').update(password).digest('hex');
		return crypto.timingSafeEqual(Buffer.from(legacy), Buffer.from(hash));
	} catch {
		return false;
	}
}

export interface Session {
	userId: string;
	matricule: string;
	role: string;
	nom: string;
	prenom: string;
	isSurveillantGeneral: boolean;
	exp?: number;
}

function toSession(compte: {
	id: string;
	matricule: string;
	role: string;
	personne: { lastname: string; name: string; surveillant?: { poste: string } | null } | null;
}): Session {
	const isSurveillantGeneral =
		compte.role === 'SURVEILLANT' &&
		compte.personne?.surveillant?.poste === 'Surveillant General';
	return {
		userId: compte.id,
		matricule: compte.matricule,
		role: compte.role,
		nom: compte.personne?.lastname ?? '',
		prenom: compte.personne?.name ?? '',
		isSurveillantGeneral
	};
}

export function createSessionToken(session: Session): string {
	const withExp: Session = { ...session, exp: Date.now() + SESSION_TTL_MS };
	const payload = Buffer.from(JSON.stringify(withExp)).toString('base64url');
	const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
	return `${payload}.${signature}`;
}

export function parseSessionToken(token: string): Session | null {
	try {
		const [payload, signature] = token.split('.');
		if (!payload || !signature) return null;
		const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
		// Comparaison en temps constant pour eviter une attaque par chronometrage.
		const a = Buffer.from(signature);
		const b = Buffer.from(expected);
		if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
		const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as Session;
		// Rejet des jetons expires.
		if (session.exp && session.exp < Date.now()) return null;
		return session;
	} catch {
		return null;
	}
}

export async function validateSession(token: string | undefined | null): Promise<Session | null> {
	if (!token) return null;
	const session = parseSessionToken(token);
	if (!session) return null;

	const compte = await prisma.compte.findUnique({
		where: { id: session.userId },
		include: { personne: { include: { surveillant: true } } }
	});

	if (!compte || compte.statut !== 'ACTIF') return null;
	return toSession(compte);
}

export async function authenticate(matricule: string, password: string): Promise<Session | null> {
	const compte = await prisma.compte.findUnique({
		where: { matricule },
		include: { personne: { include: { surveillant: true } } }
	});

	if (!compte || !verifyPassword(password, compte.password)) return null;
	if (compte.statut !== 'ACTIF') return null;

	return toSession(compte);
}
