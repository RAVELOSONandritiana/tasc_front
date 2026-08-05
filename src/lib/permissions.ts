export interface AdminPowerUser {
	role: string;
	isSurveillantGeneral?: boolean;
}

/**
 * Un « Surveillant Général » dispose des mêmes pouvoirs qu'un administrateur :
 * réinitialisation des mots de passe, blocage/déblocage de comptes, création
 * d'année scolaire, etc.
 */
export function hasAdminPower(user: AdminPowerUser | null | undefined): boolean {
	if (!user) return false;
	if (user.role === 'ADMINISTRATEUR') return true;
	if (user.role === 'SURVEILLANT' && user.isSurveillantGeneral) return true;
	return false;
}
