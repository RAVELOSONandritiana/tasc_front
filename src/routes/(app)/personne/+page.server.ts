import type { Personne } from "$lib/types/Personne.type";
import type { ServerLoad } from "@sveltejs/kit";

export const load: ServerLoad = async () => {
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
        },
        {
            name: 'TOEAVINA',
            lastname: 'Mamy',
            domicile: 'Lot V12 Betong',
            fokontany: 'Betong',
            commune: 'Farafangaana',
            phone: '032 23 456 78',
            email: 'm.tosaina@gmail.com'
        },
        {
            name: 'NOMENJANAHARY',
            lastname: 'Liva',
            domicile: 'Immeuble D45 Ankorondrano',
            fokontany: 'Ankorondrano',
            commune: 'Antananarivo',
            phone: '033 56 789 01',
            email: 'liva.nomenjanahary@edu.mg'
        }
    ];
    return {
        personnes
    }
}