import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    let list_eleve = [
        { id: '1', nom: 'RANDRIANANTENAINA', prenom: 'Tsitoarimanjakely', dateNaissance: '2008-05-15', classe: '2nd S' },
        { id: '2', nom: 'RAKOTO', prenom: 'Fanomezamasy', dateNaissance: '2008-03-22', classe: '1ere L' },
        { id: '3', nom: 'ANDRIANTENAINA', prenom: 'Bako', dateNaissance: '2008-07-10', classe: 'Tle OSE' },
        { id: '4', nom: 'RABE', prenom: 'Mialy', dateNaissance: '2009-01-12', classe: '2nd S' },
    ];
    return { list_eleve };
};
