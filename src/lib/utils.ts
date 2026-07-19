import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatClasseNom(niveau: number | undefined | null, nom: string | undefined | null): string {
	if (niveau === null || niveau === undefined) return 'Non affecté';
	const label = niveau === 0 ? '2nd' : niveau === 1 ? '1ere' : 'Tle';
	return `${label} ${nom || ''}`.trim();
}

/**
 * Calcule l'âge (en années révolues) à partir d'une date de naissance et de la
 * date actuelle. Le résultat est dynamique : il n'est jamais sauvegardé.
 * Retourne `null` si la date est absente ou invalide.
 */
export function calculerAge(dateNaissance: string | Date | null | undefined): number | null {
	if (!dateNaissance) return null;
	const naissance = new Date(dateNaissance);
	if (isNaN(naissance.getTime())) return null;

	const maintenant = new Date();
	let age = maintenant.getFullYear() - naissance.getFullYear();
	const moisDiff = maintenant.getMonth() - naissance.getMonth();
	if (moisDiff < 0 || (moisDiff === 0 && maintenant.getDate() < naissance.getDate())) {
		age--;
	}
	return age >= 0 ? age : null;
}

/**
 * Formate l'âge sous la forme "12 ans" (dynamique). Retourne une chaîne vide si
 * la date de naissance est absente ou invalide.
 */
export function formatAge(dateNaissance: string | Date | null | undefined): string {
	const age = calculerAge(dateNaissance);
	if (age === null) return '';
	return `${age} an${age > 1 ? 's' : ''}`;
}

export function formatExamenNom(examen: { nom?: string | null; periode?: string | null } | null | undefined): string {
	if (!examen) return '';
	const periode = examen.periode?.trim();
	const nom = examen.nom?.trim() || '';
	return periode ? `${periode} ${nom}`.trim() : nom;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
