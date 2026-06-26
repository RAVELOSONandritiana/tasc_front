import type { Personne, Surveillant } from "$lib/types/Personne.type";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    const personnes: Personne[] = [
        {
            name: 'RANDRIANANTENAINA',
            lastname: 'Tsitoarimanjakely',
            domicile: 'Lot I125 Ambohimiandra',
            fokontany: 'Ambohimiandra',
            commune: 'Antananarivo',
            phone: '034 00 000 00',
            email: 'tsitoarimanjakely@gmail.com'
        },
        {
            name: 'RAKOTO',
            lastname: 'Fanomezamasy',
            domicile: 'Lot C125 Anosy',
            fokontany: 'Anosy',
            commune: 'Antananarivo',
            phone: '033 73 292 05',
            email: 'fanomezamasy.rakoto@yahoo.fr'
        },
        {
            name: 'ANDRIANTENAINA',
            lastname: 'Bako',
            domicile: 'Immeuble L256 Isoraka',
            fokontany: 'Isoraka',
            commune: 'Antananarivo',
            phone: '032 12 345 67',
            email: 'bako.andriantenaina@orange.mg'
        },
        {
            name: 'RASOAMANARIVO',
            lastname: 'Niris',
            domicile: 'Lot M78 Ambatonakanga',
            fokontany: 'Ambatonakanga',
            commune: 'Toamasina',
            phone: '034 98 765 43',
            email: 'niris.rasoamanarivo@gmail.com'
        },
        {
            name: 'HERINDRINA',
            lastname: 'Fitahiana',
            domicile: 'Rue P345 Analakely',
            fokontany: 'Analakely',
            commune: 'Antananarivo',
            phone: '033 45 678 90',
            email: 'fitahiana.herindrina@intra.ices.gov.mg'
        }
    ];

    const listSurveillant: Surveillant[] = [
        {
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
        },
        {
            name: 'RAKOTO',
            lastname: 'Fanomezamasy',
            domicile: 'Lot C125 Anosy',
            fokontany: 'Anosy',
            commune: 'Antananarivo',
            phone: '033 73 292 05',
            email: 'fanomezamasy.rakoto@yahoo.fr',
            poste: 'Surveillant Principale Seconde',
            stats: {
                retards: 0,
                absences: 0,
                heuresCours: 45,
                incidents: 0,
                notesPositives: 12,
                notesNegatives: 0
            }
        },
        {
            name: 'ANDRIANTENAINA',
            lastname: 'Bako',
            domicile: 'Immeuble L256 Isoraka',
            fokontany: 'Isoraka',
            commune: 'Antananarivo',
            phone: '032 12 345 67',
            email: 'bako.andriantenaina@orange.mg',
            poste: 'Surveillant Principale Première',
            stats: {
                retards: 1,
                absences: 1,
                heuresCours: 48,
                incidents: 2,
                notesPositives: 6,
                notesNegatives: 1
            }
        },
        {
            name: 'RASOAMANARIVO',
            lastname: 'Niris',
            domicile: 'Lot M78 Ambatonakanga',
            fokontany: 'Ambatonakanga',
            commune: 'Toamasina',
            phone: '034 98 765 43',
            email: 'niris.rasoamanarivo@gmail.com',
            poste: 'Surveillant Principale Terminale',
            stats: {
                retards: 3,
                absences: 0,
                heuresCours: 42,
                incidents: 1,
                notesPositives: 10,
                notesNegatives: 0
            }
        }
    ];

    return {
        personnes,
        listSurveillant
    }
}