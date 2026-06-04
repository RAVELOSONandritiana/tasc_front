import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {

    const listClasse = [
        {
            id: 1,
            name: '2nd',
        },
        {
            id: 2,
            name: '2nd',
        },
        {
            id: 3,
            name: '2nd',
        },
        {
            id: 4,
            name: '2nd',
        }
    ];

    return {
        listClasse
    }
}