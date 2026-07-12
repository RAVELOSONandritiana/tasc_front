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
