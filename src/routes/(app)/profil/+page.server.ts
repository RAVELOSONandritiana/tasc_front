import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const profil = {
        nom: 'ADMIN',
        prenom: 'Super',
        email: 'admin@tasc.mg',
        phone: '+261 34 00 00 00',
        role: 'Administrateur',
        dateInscription: '2024-01-15',
        adresse: 'Lot IV Bis Ambatobe, Antananarivo',
        bio: '',
        stats: {
            retards: 0,
            absences: 0,
            heuresCours: 0,
            incidents: 0,
            notesPositives: 0,
            notesNegatives: 0
        }
    };
    return { profil };
};
