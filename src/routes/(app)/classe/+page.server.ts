import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {

    let listClasse = [
        {
            id: 1,
            niveau: 1,
            series: 's',
            titulaire: 'RAVELOSON Andritiana Michel',
            eleves: 40
        },
        {
            id: 2,
            niveau: 2,
            titulaire: 'RAVELOSON Andritiana Michel',
            eleves: 45,
            series: 's',
        },
        {
            id: 3,
            niveau: 0,
            titulaire: 'RAVELOSON Andritiana Michel',
            eleves: 50
        },
    ];
    listClasse = listClasse.sort((a, b) => a.niveau - b.niveau)
    return {
        listClasse
    }
}