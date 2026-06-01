import type { Personne, Surveillant } from "$lib/types/Personne.type";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {

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
            name: 'RAVELOSON',
            lastname: 'Andritiana Michel',
            domicile: 'Lot C125',
            fokontany: 'Ambtatomalaza',
            commune: 'Alasora',
            phone: '0337329209',
            email: 'hgbmichel@gmail.com',
            connected: true
        }
    ];

    const listSurveillant: Surveillant[] = [
        {
            name: 'RAKOTO',
            lastname: 'Soa Beva',
            domicile: 'Lot C125',
            fokontany: 'Ambtatomalaza',
            commune: 'Alasora',
            phone: '0337329206',
            email: 'hgbmichel@gmail.com',
            connected: true,
            poste: 'Surveillant General'
        },
        {
            name: 'RAKOTO',
            lastname: 'Soa Beva',
            domicile: 'Lot C125',
            fokontany: 'Ambtatomalaza',
            commune: 'Alasora',
            phone: '0337329207',
            email: 'hgbmichel@gmail.com',
            connected: true,
            poste: 'Surveillant Principale Seconde'
        }
    ]
    return {
        personnes,
        listSurveillant
    }
}