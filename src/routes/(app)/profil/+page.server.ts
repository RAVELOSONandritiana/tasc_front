import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const profil = {
        nom: 'ADMIN',
        prenom: 'Super',
        email: 'admin@tasc.mg',
        phone: '+261 34 000 00 00',
        role: 'Administrateur',
        dateInscription: '2024-01-15'
    };
    return { profil };
};
