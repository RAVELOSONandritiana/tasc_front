export type Salle = {
	id: string;
	num: number;
	name: string;
	place: number;
	occupe?: boolean;
	imageUrl?: string;
};

export type Classe = {
	id: string;
	niveau: number;
	name: string;
	series: string;
	eleves: number;
	titulaire?: {
		id: string;
		personne: {
			id: string;
			name: string;
			lastname: string;
		};
	} | null;
	url?: string;
};

export type Cours = {
	id: string;
	nom: string;
	coefficient: number;
	professeur?: string;
	professeurId?: string | null;
	participants?: string[];
	matiereId?: string;
	matiere?: { id: string; nom: string; couleur?: string };
	url?: string;
};

export type EleveCours = {
	id: string;
	nom: string;
	prenom: string;
	dateNaissance: string;
	domicile?: string;
	im?: string | null;
	sexe?: string | null;
	redoublant?: boolean;
	situation?: string;
	actif: boolean;
	resultat?: 'EN_ATTENTE' | 'ADMIS' | 'AJOURNE';
	inscriptionId?: string;
	notes?: Note[];
	incidents?: Incident[];
	absences?: Absence[];
	retards?: Retard[];
	url?: string;
};

export type Note = {
	id: string;
	valeur: number;
	coefficient: number;
	date: string;
	libelle: string;
	coursId: string;
	eleveId: string;
	examenId?: string;
	sousExamenId?: string;
	eleveNom?: string;
};

export type SousExamen = {
	id: string;
	nom: string;
	examenId: string;
};

export type Incident = {
	id: string;
	type: 'incident' | 'absence' | 'retard';
	date: string;
	description?: string;
};

export type Absence = {
	id: string;
	date: string;
	justifie: boolean;
};

export type Retard = {
	id: string;
	date: string;
	duree: string;
	justifie: boolean;
};

export type Examen = {
	id: string;
	nom: string;
	date: string;
	classeId: string;
	periode?: string;
	sousExamens?: SousExamen[];
};

export type SeanceEDT = {
	id: string;
	jour: string;
	heureDebut: string;
	heureFin: string;
	coursId: string;
	coursNom?: string;
	salleId?: string;
	salleNom?: string;
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
	actif: boolean;
	notes?: Note[];
	moyenne?: number;
	rang?: number;
};
