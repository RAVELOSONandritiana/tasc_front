export type TypeRapport = 'RETARD' | 'ABSENCE';

export type RapportLigne = {
	id: string;
	type: TypeRapport;
	date: string;
	motif: string | null;
	eleveNom: string;
	elevePrenom: string;
	classe: string;
};

export type Rapport = {
	id: string;
	type: TypeRapport;
	message: string | null;
	auteur: string;
	auteurId?: string;
	eleveId: string;
	eleveNom: string;
	elevePrenom: string;
	eleveImageUrl: string | null;
	classe: string;
	date: string;
	createdAt: string;
	lignes: RapportLigne[];
};

export type EleveRapport = {
	id: string;
	nom: string;
	prenom: string;
	classe: string;
	dateNaissance: string;
	imageUrl: string | null;
};

export type AbsenceRetardItem = {
	id: string;
	eleveId: string;
	type: TypeRapport;
	date: string;
	motif: string | null;
	justifie: boolean;
};
