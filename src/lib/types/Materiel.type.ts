export type Salle = {
    id: number;
    num: number;
    place: number;
    used?: boolean,
    url?: string
}

export type Classe = {
    id: number;
    niveau: number;
    name: string;
    eleves: number;
}