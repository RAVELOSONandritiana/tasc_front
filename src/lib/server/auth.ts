import crypto from 'crypto';
import { prisma } from './prisma';

const SESSION_SECRET = process.env.SESSION_SECRET || 'tasc-secret-change-in-production';
export const SESSION_COOKIE = 'tasc_session';

export function hashPassword(password: string): string {
	return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
	return hashPassword(password) === hash;
}

export interface Session {
	userId: string;
	matricule: string;
	role: string;
	nom: string;
	prenom: string;
}

export function createSessionToken(session: Session): string {
	const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
	const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
	return `${payload}.${signature}`;
}

export function parseSessionToken(token: string): Session | null {
	try {
		const [payload, signature] = token.split('.');
		const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
		if (signature !== expected) return null;
		return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
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
		include: { personne: true }
	});

	if (!compte || compte.statut !== 'ACTIF') return null;
	return session;
}

export async function authenticate(matricule: string, password: string): Promise<Session | null> {
	const compte = await prisma.compte.findUnique({
		where: { matricule },
		include: { personne: true }
	});

	if (!compte || !verifyPassword(password, compte.password)) return null;
	if (compte.statut !== 'ACTIF') return null;

	const session = {
		userId: compte.id,
		matricule: compte.matricule,
		role: compte.role,
		nom: compte.personne.lastname,
		prenom: compte.personne.name
	};

	return session;
}
