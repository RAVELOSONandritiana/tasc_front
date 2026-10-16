import { prisma } from './prisma';
import { logActivity } from './activity';
import { broadcastRealtime } from './realtime';

/** Rôles autorisés à modifier les informations d'un membre du personnel. */
export const ROLES_EDITEURS_PERSONNEL = ['ADMINISTRATEUR', 'OPERATEUR'];

export function peutEditerPersonnel(role: string | null | undefined): boolean {
	return ROLES_EDITEURS_PERSONNEL.includes(role ?? '');
}

export type PersonneEditData = {
	name: string;
	lastname: string;
	email: string;
	phone: string;
	domicile: string;
	fokontany: string;
	commune: string;
};

/**
 * Met à jour les informations personnelles d'un membre du personnel
 * (enseignant, surveillant, …) à partir des champs du formulaire.
 * Réservé à l'administrateur et à l'opérateur.
 */
export async function editerPersonne(
	locals: App.Locals,
	personneId: string,
	data: Record<string, FormDataEntryValue | null>
): Promise<{ ok: true; personneId: string } | { ok: false; status: number; error: string }> {
	if (!peutEditerPersonnel(locals.user?.role)) {
		return { ok: false, status: 403, error: 'Non autorisé à modifier ce personnel' };
	}
	if (!personneId) {
		return { ok: false, status: 400, error: 'personneId requis' };
	}

	const name = String(data.name ?? '').trim();
	const lastname = String(data.lastname ?? '').trim();
	const email = String(data.email ?? '')
		.trim()
		.toLowerCase();
	const phone = String(data.phone ?? '').trim();
	const domicile = String(data.domicile ?? '').trim() || null;
	const fokontany = String(data.fokontany ?? '').trim() || null;
	const commune = String(data.commune ?? '').trim() || null;

	if (!name || !lastname) {
		return { ok: false, status: 400, error: 'Nom et prénom sont obligatoires' };
	}
	if (!email) {
		return { ok: false, status: 400, error: 'Adresse email obligatoire' };
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return { ok: false, status: 400, error: 'Adresse email invalide' };
	}
	if (phone && !/^\d{6,20}$/.test(phone)) {
		return { ok: false, status: 400, error: 'Numéro de téléphone invalide' };
	}

	const personne = await prisma.personne.findUnique({ where: { id: personneId } });
	if (!personne) return { ok: false, status: 404, error: 'Personne introuvable' };

	try {
		await prisma.personne.update({
			where: { id: personneId },
			data: { name, lastname, email, phone, domicile, fokontany, commune }
		});
	} catch (e: unknown) {
		const code = (e as { code?: string })?.code;
		if (code === 'P2002') {
			return { ok: false, status: 409, error: 'Cette adresse email est déjà utilisée' };
		}
		return { ok: false, status: 500, error: 'Erreur lors de la mise à jour' };
	}

	logActivity(
		locals.user,
		'modification_personnel',
		`Modification des informations de ${name} ${lastname}`
	).catch(() => {});

	broadcastRealtime({ entity: 'personne', action: 'update', id: personneId });

	return { ok: true, personneId };
}
