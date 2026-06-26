import type { Eleve } from "$lib/types/Personne.type";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    let list_eleve: Eleve[] = [
        { 
            id: '1', 
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
        },
        { 
            id: '2', 
            nom: 'RAKOTO', 
            prenom: 'Fanomezamasy', 
            dateNaissance: '2008-03-22', 
            classe: '1ere L',
            stats: {
                retards: 0,
                absences: 0,
                incidents: 1,
                notesPositives: 18,
                notesNegatives: 2,
                heuresCours: 42
            }
        },
        { 
            id: '3', 
            nom: 'ANDRIANTENAINA', 
            prenom: 'Bako', 
            dateNaissance: '2008-07-10', 
            classe: 'Tle OSE',
            stats: {
                retards: 1,
                absences: 2,
                incidents: 2,
                notesPositives: 12,
                notesNegatives: 5,
                heuresCours: 35
            }
        },
        { 
            id: '4', 
            nom: 'RABE', 
            prenom: 'Mialy', 
            dateNaissance: '2009-01-12', 
            classe: '2nd S',
            stats: {
                retards: 3,
                absences: 0,
                incidents: 0,
                notesPositives: 16,
                notesNegatives: 1,
                heuresCours: 40
            }
        },
    ];
    return { list_eleve };
};
