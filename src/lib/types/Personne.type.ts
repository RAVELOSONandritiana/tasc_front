export type EmployeeStats = {
	retards: number;
	absences: number;
	heuresCours: number;
	incidents: number;
	notesPositives: number;
	notesNegatives: number;
};

export type Personne = {
	id: string;
	name: string;
	lastname: string;
	domicile?: string;
	fokontany?: string;
	commune?: string;
	phone: string;
	email: string;
	imageUrl?: string | null;
	compte?: {
		id: string;
		role: string;
		matricule: string;
	};
};

export type Professeur = Personne & {
	matiere: string[];
	stats?: EmployeeStats;
	personneId?: string;
};

export type Surveillant = Personne & {
	poste: string;
	stats?: EmployeeStats;
	personneId?: string;
};

export type EleveStats = {
	retards: number;
	absences: number;
	incidents: number;
	notesPositives: number;
	notesNegatives: number;
	heuresCours: number;
};

export type Eleve = {
	id: string;
	nom: string;
	prenom: string;
	dateNaissance: string;
	classe: string;
	email?: string | null;
	telephone?: string | null;
	adresse?: string | null;
	imageUrl?: string | null;
	personneId?: string;
	nomPere?: string | null;
	prenomPere?: string | null;
	telephonePere?: string | null;
	nomMere?: string | null;
	prenomMere?: string | null;
	telephoneMere?: string | null;
	nomTuteur?: string | null;
	prenomTuteur?: string | null;
	telephoneTuteur?: string | null;
	stats?: EleveStats;
};
