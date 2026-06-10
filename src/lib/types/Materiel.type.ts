export type Salle = {
	id: number;
	num: number;
	place: number;
	used?: boolean;
	url?: string;
};

export type Classe = {
	id: number;
	niveau: number;
	name: string;
	series: string;
	eleves: number;
	titulaire: string;
	url?: string;
};

export type Cours = {
	id: string;
	nom: string;
	coefficient: number;
	professeur?: string;
	eleves?: EleveCours[];
};

export type EleveCours = {
	id: string;
	nom: string;
	prenom: string;
	dateNaissance: string;
	actif: boolean;
	notes?: Note[];
};

export type Note = {
	id: string;
	valeur: number;
	coefficient: number;
	date: string;
	libelle: string;
};

export type Examen = {
	id: string;
	nom: string;
	date: string;
	coursId: string;
	coefficient: number;
};

export type SeanceEDT = {
	id: string;
	jour: string;
	heureDebut: string;
	heureFin: string;
	coursId: string;
	salleId?: number;
};

export type EmploiDuTemps = {
	id: string;
	classeId: string;
	seances: SeanceEDT[];
};