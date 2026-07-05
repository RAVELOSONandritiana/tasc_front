export type EmployeeStats = {
	retards: number;
	absences: number;
	heuresCours: number;
	incidents: number;
	notesPositives: number;
	notesNegatives: number;
};

export type Professeur = Personne & {
	matiere: string[];
	stats?: EmployeeStats;
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
	compte?: {
		id: string;
		role: string;
		matricule: string;
	};
};

export type Surveillant = Personne & {
	poste: string;
	stats?: EmployeeStats;
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
	stats?: EleveStats;
};
