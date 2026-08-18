import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatClasseNom(
	niveau: number | undefined | null,
	nom: string | undefined | null
): string {
	if (niveau === null || niveau === undefined) return 'Non affecté';
	const label = niveau === 0 ? '2nd' : niveau === 1 ? '1ere' : 'Tle';

	const prefixes =
		niveau === 0 ? ['2nd', '2nde'] : niveau === 1 ? ['1ere', '1ère', '1er'] : ['tle', 'terminale'];

	let valeur = (nom || '').trim();

	while (true) {
		const normalized = valeur
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '');

		let stripped = false;
		for (const prefix of prefixes) {
			const prefixLower = prefix.toLowerCase();
			if (
				normalized === prefixLower ||
				normalized.startsWith(`${prefixLower} `) ||
				normalized.startsWith(`${prefixLower}-`)
			) {
				valeur = valeur.slice(prefix.length).trim();
				stripped = true;
				break;
			}
		}
		if (!stripped || valeur === '') break;
	}

	return `${label} ${valeur}`.trim();
}

/** Valeur sentinelle du `<select>` déclenchant la saisie d'une nouvelle série. */
export const NOUVELLE_SERIE = '__new__';

/** Séries proposées par défaut, même lorsqu'aucune classe n'en utilise encore. */
export const SERIES_PAR_DEFAUT = ['ose', 's', 'l'];

/**
 * Normalise une série pour le stockage : espaces compactés, minuscules.
 * Retourne une chaîne vide pour une valeur absente ou pour la sentinelle
 * « nouvelle série ».
 */
export function normalizeSerie(value: string | null | undefined): string {
	const valeur = (value || '').replace(/\s+/g, ' ').trim();
	if (!valeur || valeur === NOUVELLE_SERIE) return '';
	return valeur.toLowerCase();
}

/** Libellé d'affichage d'une série (ex: « ose » → « OSE »). */
export function formatSerie(value: string | null | undefined): string {
	return normalizeSerie(value).toUpperCase();
}

/**
 * Fusionne des séries (existantes + défauts), dédoublonne sans tenir compte de
 * la casse et trie alphabétiquement.
 */
export function mergeSeries(...listes: (string | null | undefined)[][]): string[] {
	const uniques = new Set<string>();
	for (const liste of listes) {
		for (const valeur of liste) {
			const serie = normalizeSerie(valeur);
			if (serie) uniques.add(serie);
		}
	}
	return [...uniques].sort((a, b) => a.localeCompare(b, 'fr'));
}

/**
 * Met la première lettre de chaque mot en majuscule (ex: « jean pierre » →
 * « Jean Pierre »). Ne touche pas au reste de la casse des mots.
 */
export function capitalizeWords(value: string | null | undefined): string {
	if (!value) return '';
	return value
		.trim()
		.split(/\s+/)
		.map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
		.join(' ');
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

/**
 * Numero de classe d'un eleve (ex: « 3F », « 12G »). L'ordre est calcule par
 * sexe, en triant sur « nom prenom » tels que fournis par l'appelant.
 */
export function numeroClasse<
	T extends { id: string; nom: string; prenom: string; sexe?: string | null }
>(eleve: T, tous: T[]): string {
	const sexe = eleve.sexe === 'F' ? 'F' : 'G';
	const ordre =
		tous
			.filter((e) => (e.sexe === 'F' ? 'F' : 'G') === sexe)
			.sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'))
			.findIndex((e) => e.id === eleve.id) + 1;
	return `${ordre}${sexe}`;
}

export function formatExamenNom(
	examen: { nom?: string | null; periode?: string | null } | null | undefined
): string {
	if (!examen) return '';
	const periode = examen.periode?.trim();
	const nom = examen.nom?.trim() || '';
	return periode ? `${periode} ${nom}`.trim() : nom;
}

/**
 * Normalise une adresse IP : convertit les IPv4 mapping en IPv6
 * (ex. "::ffff:172.18.0.2") en IPv4 classique ("172.18.0.2").
 */
export function normalizeIp(ip: string | null | undefined): string {
	if (!ip) return '';
	const trimmed = ip.trim();
	// IPv4-mapped IPv6 (::ffff: + a.b.c.d) ou IPv4-compatible (::a.b.c.d).
	const mapped = trimmed.match(/^::(ffff:)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
	if (mapped) return mapped[2];
	return trimmed;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
