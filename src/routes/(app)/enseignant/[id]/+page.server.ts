import type { Professeur } from '$lib/types/Personne.type';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const professeur: Professeur = {
        name: 'RANDRIANANTENAINA',
        lastname: 'Tsitoarimanjakely',
        domicile: 'Lot I125 Ambohimiandra',
        fokontany: 'Ambohimiandra',
        commune: 'Antananarivo',
        phone: '034 00 000 00',
        email: 'tsitoarimanjakely@gmail.com',
        matiere: ['Mathématiques', 'Physique'],
        stats: {
            retards: 3,
            absences: 1,
            heuresCours: 42,
            incidents: 2,
            notesPositives: 15,
            notesNegatives: 2
        }
    };
    return { professeur };
};