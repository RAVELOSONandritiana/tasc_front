import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {

    const listClasse = [
        {
            id: 1,
            name: '2nd',
            niveau: 2,
            eleves: 50
        },
        {
            id: 2,
            name: '2nd',
            niveau: 2,
            eleves: 60
        },
        {
            id: 3,
            name: '1ere',
            niveau: 1,
            eleves: 29
        },
        {
            id: 4,
            name: 'Ts',
            niveau: 3,
            eleves: 47
        }
    ];

    return {
        listClasse
    }
}