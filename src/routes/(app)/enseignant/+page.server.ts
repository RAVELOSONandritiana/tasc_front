import type { Personne, Professeur } from "$lib/types/Personne.type";
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
        },
        {
            name: 'RAKOTO',
            lastname: 'Soa Beva',
            domicile: 'Lot C125',
            fokontany: 'Ambtatomalaza',
            commune: 'Alasora',
            phone: '0337329205',
            email: 'hgbmichel@gmail.com',
        },
        {
            name: 'RAKOTO',
            lastname: 'Soa Beva',
            domicile: 'Lot C125',
            fokontany: 'Ambtatomalaza',
            commune: 'Alasora',
            phone: '0337329206',
            email: 'hgbmichel@gmail.com',
        },
        {
            name: 'RAVELOSON',
            lastname: 'Andritiana Michel',
            domicile: 'Lot C125',
            fokontany: 'Ambtatomalaza',
            commune: 'Alasora',
            phone: '0337329209',
            email: 'hgbmichel@gmail.com',
        }
    ];

    const listProfesseur: Professeur[] = [
        {
            name: 'RAKOTO',
            lastname: 'Soa Beva',
            domicile: 'Lot C125',
            fokontany: 'Ambtatomalaza',
            commune: 'Alasora',
            phone: '0337329206',
            email: 'hgbmichel@gmail.com',
            matiere: []
        },
        {
            name: 'RAKOTO',
            lastname: 'Soa Beva',
            domicile: 'Lot C125',
            fokontany: 'Ambtatomalaza',
            commune: 'Alasora',
            phone: '0337329207',
            email: 'hgbmichel@gmail.com',
            matiere: []
        }, {
            name: 'RAKOTO',
            lastname: 'Soa Beva',
            domicile: 'Lot C125',
            fokontany: 'Ambtatomalaza',
            commune: 'Alasora',
            phone: '0337329208',
            email: 'hgbmichel@gmail.com',
            matiere: []
        },
        {
            name: 'RAKOTO',
            lastname: 'Soa Beva',
            domicile: 'Lot C125',
            fokontany: 'Ambtatomalaza',
            commune: 'Alasora',
            phone: '0337329209',
            email: 'hgbmichel@gmail.com',
            matiere: []
        }
    ];

    return {
        personnes: personnes,
        professeur: listProfesseur
    }
}