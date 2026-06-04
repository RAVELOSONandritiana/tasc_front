import type { Classe } from "$lib/types/Materiel.type";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    let list_classe: Classe[] = [
        {
            id: 1,
            num: 5,
            place: 50
        },
        {
            id: 2,
            num: 6,
            place: 50
        },
        {
            id: 3,
            num: 7,
            place: 50
        },
        {
            id: 4,
            num: 8,
            place: 50
        }, {
            id: 5,
            num: 9,
            place: 50
        }
    ];
    list_classe = list_classe.sort((a, b) => a.num - b.num);
    return {
        list_classe
    }
}