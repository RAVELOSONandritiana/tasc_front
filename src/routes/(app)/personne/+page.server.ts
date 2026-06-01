import type { Personne } from "$lib/types/Personne.type";
import type { ServerLoad } from "@sveltejs/kit";

export const load: ServerLoad = async () => {
    const personnes: Personne[] = [
        {
            name: 'RAKOTO',
            lastname: 'Soa Beva',
            domicile: 'Lot C125',
            fokontany: 'Ambtatomalaza',
            commune: 'Alasora',
            phone: '0337329204',
            email: 'hgbmichel@gmail.com',
            connected: true
        },
        {
            name: 'RAKOTO',
            lastname: 'Soa Beva',
            domicile: 'Lot C125',
            fokontany: 'Ambtatomalaza',
            commune: 'Alasora',
            phone: '0337329205',
            email: 'hgbmichel@gmail.com',
            connected: true
        },
        {
            name: 'RAKOTO',
            lastname: 'Soa Beva',
            domicile: 'Lot C125',
            fokontany: 'Ambtatomalaza',
            commune: 'Alasora',
            phone: '0337329206',
            email: 'hgbmichel@gmail.com',
            connected: true
        },
        {
            name: 'RAKOTO',
            lastname: 'Soa Beva',
            domicile: 'Lot C125',
            fokontany: 'Ambtatomalaza',
            commune: 'Alasora',
            phone: '0337329207',
            email: 'hgbmichel@gmail.com',
            connected: true
        }
    ];
    return {
        personnes
    }
}