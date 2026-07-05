import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { capitalize } from '$lib/actions/capitalize';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL is not set. Please check your .env file.');
}

export const prisma = new PrismaClient({
	adapter: new PrismaPg(databaseUrl)
});

export async function initDb() {
	try {
		const { ensureAdmin } = await import('./ensureAdmin');
		await ensureAdmin();
	} catch (e) {
		console.error('Failed to ensure admin user:', e);
	}
}

await initDb();

export async function getEleves() {
	return prisma.eleve.findMany({
		include: {
			personne: true,
			inscriptions: {
				include: {
					classe: true
				}
			}
		},
		orderBy: {
			personne: {
				name: 'asc'
			}
		}
	});
}

export async function getEleveById(id: string) {
	return prisma.eleve.findUnique({
		where: { id },
		include: {
			personne: true,
			inscriptions: {
				include: {
					classe: true
				}
			}
		}
	});
}

export async function getProfesseurs() {
	return prisma.professeur.findMany({
		include: {
			personne: true
		},
		orderBy: {
			personne: {
				name: 'asc'
			}
		}
	});
}

export async function getProfesseurById(id: string) {
	return prisma.professeur.findUnique({
		where: { id },
		include: {
			personne: true
		}
	});
}

export async function getSurveillants() {
	return prisma.surveillant.findMany({
		include: {
			personne: true
		},
		orderBy: {
			personne: {
				name: 'asc'
			}
		}
	});
}

export async function getSurveillantById(id: string) {
	return prisma.surveillant.findUnique({
		where: { id },
		include: {
			personne: true
		}
	});
}

export async function getPersonnes() {
	return prisma.personne.findMany({
		where: {
			eleve: null
		},
		include: {
			compte: {
				select: {
					id: true,
					role: true,
					matricule: true
				}
			}
		},
		orderBy: {
			name: 'asc'
		}
	});
}

export async function getAllPersonnes(): Promise<any[]> {
	return prisma.personne.findMany({
		where: {
			eleve: null,
			professeur: null
		},
		include: {
			compte: {
				select: {
					id: true,
					role: true,
					matricule: true
				}
			}
		},
		orderBy: {
			name: 'asc'
		}
	});
}

export async function searchPersonnesByName(query: string) {
	if (!query.trim()) return [];
	return prisma.personne.findMany({
		where: {
			eleve: null,
			professeur: null,
			name: {
				contains: query.trim(),
				mode: 'insensitive'
			}
		},
		include: {
			compte: {
				select: {
					id: true,
					role: true,
					matricule: true
				}
			}
		},
		orderBy: {
			name: 'asc'
		}
	});
}

export async function getClasses() {
	return prisma.classe.findMany({
		select: {
			id: true,
			nom: true,
			niveau: true,
			serie: true,
			imageUrl: true,
			titulaireId: true,
			elevesCount: true,
			titulaire: {
				include: {
					personne: true
				}
			}
		},
		orderBy: {
			niveau: 'asc'
		}
	});
}

export async function getClasseById(id: string) {
	return prisma.classe.findUnique({
		where: { id },
		include: {
			titulaire: {
				include: {
					personne: true
				}
			},
			inscriptions: {
				include: {
					eleve: {
						include: {
							personne: true
						}
					}
				}
			}
		}
	});
}

export async function getSalles() {
	return prisma.salle.findMany({
		orderBy: {
			num: 'asc'
		}
	});
}

export async function getSalleById(id: string) {
	return prisma.salle.findUnique({
		where: { id }
	});
}

export async function getIncidents() {
	return prisma.incident.findMany({
		include: {
			eleve: {
				include: {
					personne: true
				}
			},
			reactions: true,
			comments: true
		},
		orderBy: {
			date: 'desc'
		}
	});
}

export async function getElevesByClasseId(classeId: string) {
	return prisma.inscription.findMany({
		where: { classeId },
		include: {
			eleve: {
				include: {
					personne: true
				}
			},
			notes: true,
			incidents: true,
			absences: true,
			retards: true
		}
	});
}

export async function getAnneeScolaires() {
	return prisma.anneeScolaire.findMany({
		orderBy: {
			dateCreation: 'desc'
		}
	});
}

export async function getMatieres() {
	return prisma.matiere.findMany({
		orderBy: {
			nom: 'asc'
		}
	});
}

export async function getCours() {
	return prisma.cours.findMany({
		include: {
			matiere: true,
			professeur: {
				include: {
					personne: true
				}
			},
			classe: true
		}
	});
}

export async function getNotifications() {
	return prisma.notification.findMany({
		orderBy: {
			createdAt: 'desc'
		}
	});
}

export async function createPersonnel(data: {
	name: string;
	lastname: string;
	email: string;
	phone: string;
	domicile: string;
	fokontany: string;
	commune: string;
	region?: string;
	province?: string;
	lieuNaissance?: string;
	regionNaissance?: string;
	provinceNaissance?: string;
	dateNaissance?: string;
	cin?: string;
}) {
	console.log('createPersonnel DB call with:', data);
	return prisma.$transaction(async (tx) => {
		const personne = await tx.personne.create({
			data: {
				name: data.name,
				lastname: data.lastname,
				email: data.email,
				phone: data.phone,
				domicile: capitalize(data.domicile),
				fokontany: capitalize(data.fokontany),
				commune: capitalize(data.commune)
			}
		});

		const matricule = `PRS-${Date.now().toString(36).toUpperCase()}`;
		const compte = await tx.compte.create({
			data: {
				matricule,
				password: '123456',
				role: 'PERSONNEL',
				statut: 'EN_ATTENTE',
				personneId: personne.id
			}
		});

		return { personne, compte };
	});
}

export async function createSurveillant(data: {
	name: string;
	lastname: string;
	email: string;
	phone: string;
	domicile: string;
	fokontany: string;
	commune: string;
	region?: string;
	poste: string;
}) {
	return prisma.$transaction(async (tx) => {
		const personne = await tx.personne.create({
			data: {
				name: data.name,
				lastname: data.lastname,
				email: data.email,
				phone: data.phone,
				domicile: data.domicile,
				fokontany: data.fokontany,
				commune: data.commune
			}
		});

		const matricule = `SRV-${Date.now().toString(36).toUpperCase()}`;
		const compte = await tx.compte.create({
			data: {
				matricule,
				password: '123456',
				role: 'SURVEILLANT',
				statut: 'EN_ATTENTE',
				personneId: personne.id
			}
		});

		const surveillant = await tx.surveillant.create({
			data: {
				personneId: personne.id,
				poste: data.poste
			}
		});

		return { personne, compte, surveillant };
	});
}

export async function createProfesseur(data: {
	name: string;
	lastname: string;
	email: string;
	phone: string;
	domicile?: string;
	fokontany?: string;
	commune?: string;
	region?: string;
	matiere: string[];
}) {
	return prisma.$transaction(async (tx) => {
		const personne = await tx.personne.create({
			data: {
				name: data.name,
				lastname: data.lastname,
				email: data.email,
				phone: data.phone,
				domicile: data.domicile || '',
				fokontany: data.fokontany || '',
				commune: data.commune || ''
			}
		});

		const matricule = `ENS-${Date.now().toString(36).toUpperCase()}`;
		const compte = await tx.compte.create({
			data: {
				matricule,
				password: '123456',
				role: 'ENSEIGNANT',
				statut: 'EN_ATTENTE',
				personneId: personne.id
			}
		});

		const professeur = await tx.professeur.create({
			data: {
				personneId: personne.id,
				matiere: data.matiere
			}
		});

		return { personne, compte, professeur };
	});
}

export async function createProfesseurFromPersonne(personneId: string, matricule: string, matiere: string[]) {
	return prisma.$transaction(async (tx) => {
		const personne = await tx.personne.findUniqueOrThrow({
			where: { id: personneId },
			include: { 
				compte: true,
				professeur: true 
			}
		});

		if (personne.professeur) {
			throw new Error('Cette personne est déjà enseignante');
		}

		let compte = personne.compte;
		if (!compte) {
			compte = await tx.compte.create({
				data: {
					matricule,
					password: '123456',
					role: 'ENSEIGNANT',
					statut: 'EN_ATTENTE',
					personneId
				}
			});
		} else {
			compte = await tx.compte.update({
				where: { id: compte.id },
				data: { matricule, role: 'ENSEIGNANT', statut: 'EN_ATTENTE' }
			});
		}

		const professeur = await tx.professeur.create({
			data: {
				personneId,
				matiere
			}
		});

		return { personne, compte, professeur };
	});
}

export async function createEleve(data: {
	name: string;
	lastname: string;
	email: string;
	phone: string;
	domicile: string;
	fokontany: string;
	commune: string;
	region?: string;
	province?: string;
	dateNaissance: string;
	lieuNaissance?: string;
	regionNaissance?: string;
	provinceNaissance?: string;
}) {
	return prisma.$transaction(async (tx) => {
		const personne = await tx.personne.create({
			data: {
				name: data.name,
				lastname: data.lastname,
				email: data.email,
				phone: data.phone,
				domicile: capitalize(data.domicile),
				fokontany: capitalize(data.fokontany),
				commune: capitalize(data.commune)
			}
		});

		const eleve = await tx.eleve.create({
			data: {
				personneId: personne.id,
				dateNaissance: new Date(data.dateNaissance)
			}
		});

		return { personne, eleve };
	});
}

export async function getActiveAnneeScolaire() {
	return prisma.anneeScolaire.findFirst({
		where: { active: true },
		orderBy: { dateCreation: 'desc' }
	});
}

export async function createClasse(data: {
	nom?: string;
	niveau: number;
	serie?: string;
	titulaireId?: string;
}) {
	const annee = await getActiveAnneeScolaire();
	if (!annee) {
		throw new Error('Aucune année scolaire active');
	}
	return prisma.classe.create({
		data: {
			nom: data.nom || `${data.niveau === 0 ? '2nde' : data.niveau === 1 ? '1ère' : 'Terminale'}${data.serie ? ' ' + data.serie.toUpperCase() : ''}`,
			niveau: data.niveau,
			serie: data.serie || null,
			titulaireId: data.titulaireId || null,
			anneeId: annee.id
		},
		include: {
			titulaire: {
				include: {
					personne: true
				}
			}
		}
	});
}

export async function updateClasseImage(id: string, imageUrl: string | null) {
	return prisma.classe.update({
		where: { id },
		data: { imageUrl }
	});
}

export async function deleteEleve(id: string) {
	return prisma.$transaction(async (tx) => {
		const eleve = await tx.eleve.findUnique({ where: { id } });
		if (!eleve) throw new Error('Élève introuvable');
		await tx.eleve.delete({ where: { id } });
		return { success: true };
	});
}

export async function deleteProfesseur(id: string) {
	return prisma.$transaction(async (tx) => {
		const prof = await tx.professeur.findUnique({ where: { id }, include: { personne: true } });
		if (!prof) throw new Error('Enseignant introuvable');
		await tx.professeur.delete({ where: { id } });
		await tx.compte.updateMany({ where: { personneId: prof.personneId }, data: { role: 'PERSONNEL' } });
		return { success: true };
	});
}

export async function deletePersonnel(personneId: string) {
	return prisma.$transaction(async (tx) => {
		const personnel = await tx.personnel.findUnique({ where: { personneId }, include: { personne: true } });
		if (!personnel) throw new Error('Personnel introuvable');
		await tx.personnel.delete({ where: { id: personnel.id } });
		await tx.personne.delete({ where: { id: personneId } });
		return { success: true, personne: personnel.personne };
	});
}

export async function updateUserPassword(userId: string, newPassword: string) {
	const hashed = await import('./auth').then((m) => m.hashPassword(newPassword));
	return prisma.compte.update({
		where: { id: userId },
		data: { password: hashed }
	});
}
