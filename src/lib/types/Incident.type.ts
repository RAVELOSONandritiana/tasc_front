export type Reaction = {
	emoji: string;
	user: string;
};

export type Comment = {
	id: string;
	author: string;
	text: string;
	date: string;
};

export type IncidentType = 'info' | 'erreur' | 'note' | 'absent';

export type Incident = {
	id: string;
	eleveId: string;
	eleveNom: string;
	elevePrenom: string;
	type: IncidentType;
	message: string;
	auteur: string;
	auteurId?: string;
	date: string;
	reactions: Reaction[];
	comments: Comment[];
};

export type EleveIncident = {
	id: string;
	type: IncidentType;
	message: string;
	auteur: string;
	auteurId?: string;
	date: string;
};