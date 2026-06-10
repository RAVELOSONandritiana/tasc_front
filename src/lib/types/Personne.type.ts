export type Professeur = Personne & {
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
    connected?: boolean;
};

export type Surveillant = Personne & {
    poste: string;
};