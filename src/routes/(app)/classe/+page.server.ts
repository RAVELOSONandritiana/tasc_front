import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {

    const listClasse = [
        {
            id: 1,
            niveau: '1',
            series: 's',
            titulaire: 'RAVELOSON Andritiana Michel',
            eleves: 40
        },
        {
            id: 2,
            niveau: 't',
            titulaire: 'RAVELOSON Andritiana Michel',
            eleves: 45,
            series: 's',
        },
        {
            id: 3,
            niveau: '2',
            titulaire: 'RAVELOSON Andritiana Michel',
            eleves: 50
        },
    ];

    return {
        listClasse
    }
}