import type { Personne, Professeur } from "$lib/types/Personne.type";
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

    const listProfesseur: Professeur[] = [
        {
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
        },
        {
            name: 'RAKOTO',
            lastname: 'Fanomezamasy',
            domicile: 'Lot C125 Anosy',
            fokontany: 'Anosy',
            commune: 'Antananarivo',
            phone: '033 73 292 05',
            email: 'fanomezamasy.rakoto@yahoo.fr',
            matiere: ['Français', 'Philosophie', 'Lettres'],
            stats: {
                retards: 1,
                absences: 0,
                heuresCours: 38,
                incidents: 0,
                notesPositives: 22,
                notesNegatives: 1
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
            matiere: ['SVT', 'Chimie'],
            stats: {
                retards: 5,
                absences: 2,
                heuresCours: 35,
                incidents: 4,
                notesPositives: 18,
                notesNegatives: 5
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
            matiere: ['Histoire-Géographie', 'ECM'],
            stats: {
                retards: 2,
                absences: 1,
                heuresCours: 40,
                incidents: 1,
                notesPositives: 12,
                notesNegatives: 0
            }
        },
        {
            name: 'HERINDRINA',
            lastname: 'Fitahiana',
            domicile: 'Rue P345 Analakely',
            fokontany: 'Analakely',
            commune: 'Antananarivo',
            phone: '033 45 678 90',
            email: 'fitahiana.herindrina@intra.ices.gov.mg',
            matiere: ['Informatique', 'Mathématiques'],
            stats: {
                retards: 0,
                absences: 0,
                heuresCours: 45,
                incidents: 0,
                notesPositives: 25,
                notesNegatives: 0
            }
        }
    ];

    return {
        personnes,
        professeur: listProfesseur
    }
}