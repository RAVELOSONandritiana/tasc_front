export type Professeur = {
    name: string;
    lastname: string;
    domicile: string;
    fokontany: string;
    commune: string;
    phone: string;
    email: string;
    matiere: string[];
};

export type Personne = {
    name: string;
    lastname: string;
    domicile: string;
    fokontany: string;
    commune: string;
    phone: string;
    email: string;
};

export type Surveillant = Personne & {
    poste: string;
};