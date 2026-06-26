import type { Eleve } from '$lib/types/Personne.type';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const eleve: Eleve = {
        id: params.id,
        nom: 'RANDRIANANTENAINA',
        prenom: 'Tsitoarimanjakely',
        dateNaissance: '2008-05-15',
        classe: '2nd S',
        stats: {
            retards: 2,
            absences: 1,
            incidents: 0,
            notesPositives: 15,
            notesNegatives: 3,
            heuresCours: 38
        }
    };
    return { eleve };
};
