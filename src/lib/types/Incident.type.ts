export type Reaction = {
	emoji: string;
	user: string;
};

export type Comment = {
	id: string;
	author: string;
	authorId?: string | null;
	text: string;
	date: string;
	parentId?: string | null;
	edited?: boolean;
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
