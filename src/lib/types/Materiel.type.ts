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
	coursId: string;
	examenId?: string;
};

export type Examen = {
	id: string;
	nom: string;
	date: string;
	classeId: string;
	periode?: string;
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

export type EleveDetail = {
	id: string;
	nom: string;
	prenom: string;
	dateNaissance: string;
	classe: string;
	serie?: string;
	notes?: Note[];
	moyenne?: number;
	rang?: number;
};