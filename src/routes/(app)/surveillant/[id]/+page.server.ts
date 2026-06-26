import type { Surveillant } from '$lib/types/Personne.type';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const surveillant: Surveillant = {
        name: 'RANDRIANANTENAINA',
        lastname: 'Tsitoarimanjakely',
        domicile: 'Lot I125 Ambohimiandra',
        fokontany: 'Ambohimiandra',
        commune: 'Antananarivo',
        phone: '034 00 000 00',
        email: 'tsitoarimanjakely@gmail.com',
        poste: 'Surveillant General',
        stats: {
            retards: 2,
            absences: 0,
            heuresCours: 50,
            incidents: 1,
            notesPositives: 8,
            notesNegatives: 0
        }
    };
    return { surveillant };
};