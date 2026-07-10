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

export async function getEleves() {
	return prisma.eleve.findMany({
		include: {
			personne: true,
			inscriptions: {
				include: {
					classe: true
				},
				orderBy: {
					dateInscription: 'desc'
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
			},
			orderBy: {
				dateInscription: 'desc'
			}
		},
			incidents: true
		}
	});
}

export async function getProfesseurs() {
	return prisma.professeur.findMany({
		include: {
			personne: {
				include: {
					compte: {
						select: {
							id: true,
							role: true,
							matricule: true
						}
					}
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

export async function getProfesseurById(id: string) {
	return prisma.professeur.findUnique({
		where: { id },
		include: {
			personne: {
				include: {
					compte: {
						select: {
							id: true,
							role: true,
							matricule: true
						}
					}
				}
			}
		}
	});
}

export async function getSurveillants() {
	return prisma.surveillant.findMany({
		include: {
			personne: {
				include: {
					compte: {
						select: {
							id: true,
							role: true,
							matricule: true
						}
					}
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

export async function getSurveillantById(id: string) {
	return prisma.surveillant.findUnique({
		where: { id },
		include: {
			personne: {
				include: {
					compte: {
						select: {
							id: true,
							role: true,
							matricule: true
						}
					}
				}
			}
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

export async function getAllPersonnesForSurveillant() {
	return prisma.personne.findMany({
		where: {
			surveillant: null
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

export async function createSurveillantFromPersonne(personneId: string, matricule: string, poste: string) {
	return prisma.$transaction(async (tx) => {
		const personne = await tx.personne.findUniqueOrThrow({
			where: { id: personneId },
			include: { compte: true, surveillant: true }
		});

		if (personne.surveillant) {
			throw new Error('Cette personne est déjà surveillante');
		}

		let compte = personne.compte;
		if (!compte) {
			compte = await tx.compte.create({
				data: {
					matricule,
					password: '123456',
					role: 'SURVEILLANT',
					statut: 'EN_ATTENTE',
					personneId
				}
			});
		} else {
			compte = await tx.compte.update({
				where: { id: compte.id },
				data: { matricule, role: 'SURVEILLANT', statut: 'EN_ATTENTE' }
			});
		}

		const surveillant = await tx.surveillant.create({
			data: {
				personneId,
				poste
			}
		});

		return { personne, compte, surveillant };
	});
}

export async function getAllPersonnes() {
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

export async function createMatiere(data: { nom: string; couleur?: string | null; icone?: string | null; imageUrl?: string | null }) {
	return prisma.matiere.create({
		data: {
			nom: data.nom,
			couleur: data.couleur || null,
			icone: data.icone || null,
			imageUrl: data.imageUrl || null
		}
	});
}

export async function updateMatiere(id: string, data: { nom?: string; couleur?: string | null; icone?: string | null; imageUrl?: string | null }) {
	return prisma.matiere.update({
		where: { id },
		data: {
			nom: data.nom,
			couleur: data.couleur,
			icone: data.icone,
			imageUrl: data.imageUrl
		}
	});
}

export async function updateMatiereImage(id: string, imageUrl: string | null) {
	return prisma.matiere.update({
		where: { id },
		data: { imageUrl }
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

export async function updateClasse(id: string, data: {
	nom?: string;
	niveau?: number;
	serie?: string;
	titulaireId?: string | null;
}) {
	return prisma.classe.update({
		where: { id },
		data: {
			nom: data.nom,
			niveau: data.niveau,
			serie: data.serie || null,
			titulaireId: data.titulaireId || null
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

export async function getElevesDisponiblesForClasse(classeId: string) {
	const annee = await getActiveAnneeScolaire();
	if (!annee) return [];

	const inscriptionsActives = await prisma.inscription.findMany({
		where: { anneeId: annee.id, actif: true },
		select: { eleveId: true }
	});
	const inscritsIds = new Set(inscriptionsActives.map((i) => i.eleveId));

	const eleves = await prisma.eleve.findMany({
		where: { id: { notIn: [...inscritsIds] } },
		include: { personne: true },
		orderBy: { personne: { name: 'asc' } }
	});

	return eleves.map((eleve) => ({
		id: eleve.id,
		nom: eleve.personne.name,
		prenom: eleve.personne.lastname,
		dateNaissance: eleve.dateNaissance?.toISOString().split('T')[0] || ''
	}));
}

export async function addEleveToClasse(eleveId: string, classeId: string) {
	return prisma.$transaction(async (tx) => {
		const annee = await tx.anneeScolaire.findFirst({ where: { active: true } });
		if (!annee) {
			throw new Error('Aucune année scolaire active');
		}

		const existingInscription = await tx.inscription.findFirst({
			where: {
				eleveId,
				classeId,
				anneeId: annee.id
			}
		});

		if (existingInscription) {
			if (!existingInscription.actif) {
				await tx.inscription.update({
					where: { id: existingInscription.id },
					data: { actif: true }
				});
			}
			const eleve = await tx.eleve.findUnique({
				where: { id: eleveId },
				include: { personne: true }
			});
			return {
				id: eleve?.id,
				nom: eleve?.personne.name,
				prenom: eleve?.personne.lastname,
				dateNaissance: eleve?.dateNaissance?.toISOString().split('T')[0] || '',
				actif: true
			};
		}

		const inscription = await tx.inscription.create({
			data: {
				eleveId,
				classeId,
				anneeId: annee.id,
				actif: true
			}
		});

		await tx.classe.update({
			where: { id: classeId },
			data: {
				elevesCount: {
					increment: 1
				}
			}
		});

		const eleve = await tx.eleve.findUnique({
			where: { id: eleveId },
			include: { personne: true }
		});

		return {
			id: eleve?.id,
			nom: eleve?.personne.name,
			prenom: eleve?.personne.lastname,
			dateNaissance: eleve?.dateNaissance?.toISOString().split('T')[0] || '',
			actif: inscription.actif
		};
	});
}

export async function updateClasseImage(id: string, imageUrl: string | null) {
	return prisma.classe.update({
		where: { id },
		data: { imageUrl }
	});
}

export async function updateCoursImage(id: string, imageUrl: string | null) {
	return prisma.cours.update({
		where: { id },
		data: { imageUrl }
	});
}

export async function deleteEleve(id: string) {
	return prisma.$transaction(async (tx) => {
		const eleve = await tx.eleve.findUnique({
			where: { id },
			include: { inscriptions: true }
		});
		if (!eleve) throw new Error('Élève introuvable');
		for (const ins of eleve.inscriptions) {
			await tx.classe.update({
				where: { id: ins.classeId },
				data: {
					elevesCount: {
						decrement: 1
					}
				}
			});
		}
		await tx.eleve.delete({ where: { id } });
		return { success: true };
	});
}

export async function deleteClasse(id: string) {
	return prisma.$transaction(async (tx) => {
		const classe = await tx.classe.findUnique({ where: { id } });
		if (!classe) throw new Error('Classe introuvable');
		await tx.classe.update({ where: { id }, data: { titulaireId: null } });
		await tx.classe.delete({ where: { id } });
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

export async function getUserActivities(compteId: string, limit = 20) {
	const activities = await prisma.activite.findMany({
		where: { compteId },
		include: {
			compte: {
				include: {
					personne: true
				}
			}
		},
		orderBy: { createdAt: 'desc' },
		take: limit
	});
	return activities.map((a) => ({
		id: a.id,
		action: a.action,
		description: a.description,
		ipAddress: a.ipAddress,
		userAgent: a.userAgent,
		compteId: a.compteId,
		createdAt: a.createdAt.toISOString(),
		compte: {
			matricule: a.compte.matricule,
			role: a.compte.role,
			personne: {
				name: a.compte.personne.name,
				lastname: a.compte.personne.lastname
			}
		}
	}));
}

export async function deleteSurveillant(personneId: string) {
	return prisma.$transaction(async (tx) => {
		const surv = await tx.surveillant.findUnique({ where: { personneId } });
		if (!surv) throw new Error('Surveillant introuvable');
		await tx.surveillant.delete({ where: { personneId } });
		await tx.personne.delete({ where: { id: personneId } });
		return { success: true };
	});
}

export async function deletePersonnel(personneId: string) {
	await prisma.personne.delete({ where: { id: personneId } });
	return { success: true };
}

export async function updateUserPassword(userId: string, newPassword: string) {
	const hashed = await import('./auth').then((m) => m.hashPassword(newPassword));
	return prisma.compte.update({
		where: { id: userId },
		data: { password: hashed }
	});
}

export async function createCours(data: {
	classeId: string;
	matiereId: string;
	professeurId: string;
	coefficient?: number;
	participants?: string[];
	anneeId?: string;
}) {
	const classe = await prisma.classe.findUnique({ where: { id: data.classeId } });
	if (!classe) throw new Error('Classe introuvable');

	const annee = data.anneeId || (await getActiveAnneeScolaire())?.id;
	if (!annee) throw new Error('Année scolaire active introuvable');

	return prisma.cours.create({
		data: {
			classeId: data.classeId,
			matiereId: data.matiereId,
			professeurId: data.professeurId,
			anneeId: annee,
			coefficient: data.coefficient ?? 1,
			participants: data.participants ?? []
		},
		include: {
			matiere: true,
			professeur: { include: { personne: true } },
			classe: true
		}
	});
}

export async function updateCours(id: string, data: {
	matiereId?: string;
	coefficient?: number;
	participants?: string[];
	professeurId?: string;
}) {
	return prisma.cours.update({
		where: { id },
		data,
		include: {
			matiere: true,
			professeur: { include: { personne: true } }
		}
	});
}

export async function deleteCours(id: string) {
	return prisma.cours.delete({ where: { id } });
}

export async function createExamen(data: {
	classeId: string;
	nom: string;
	date: Date | string;
	periode?: string;
	anneeId?: string;
}) {
	const annee = data.anneeId || (await getActiveAnneeScolaire())?.id;
	if (!annee) throw new Error('Année scolaire active introuvable');

	return prisma.examen.create({
		data: {
			classeId: data.classeId,
			nom: data.nom,
			date: typeof data.date === 'string' ? new Date(data.date) : data.date,
			periode: data.periode || null,
			anneeId: annee
		}
	});
}

export async function createNote(data: {
	valeur: number;
	coefficient?: number;
	libelle?: string;
	eleveId: string;
	coursId: string;
	examenId?: string;
	inscriptionId?: string;
}) {
	return prisma.note.create({
		data: {
			valeur: data.valeur,
			coefficient: data.coefficient ?? 1,
			libelle: data.libelle || null,
			eleveId: data.eleveId,
			coursId: data.coursId,
			examenId: data.examenId || null,
			inscriptionId: data.inscriptionId || null
		}
	});
}

export async function getNotesByCoursId(coursId: string) {
  return prisma.note.findMany({
    where: { coursId },
    include: {
      eleve: { include: { personne: true } },
      cours: { include: { matiere: true } }
    }
  });
}

export async function getNotesByCoursIdSorted(coursId: string) {
  return prisma.note.findMany({
    where: { coursId },
    orderBy: { date: 'desc' },
    include: {
      eleve: { include: { personne: true } },
      cours: { include: { matiere: true } }
    }
  });
}

export async function deleteNote(id: string) {
  return prisma.note.delete({ where: { id } });
}
