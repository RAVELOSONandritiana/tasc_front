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

function sortByLower<T>(items: T[], getKey: (item: T) => string | null | undefined): T[] {
	return items.sort((a, b) =>
		(getKey(a) || '').toLowerCase().localeCompare((getKey(b) || '').toLowerCase(), 'fr')
	);
}

const STAFF_ROLES = ['ENSEIGNANT', 'SURVEILLANT', 'PERSONNEL', 'ADMINISTRATEUR'] as const;

// Une personne est un élève uniquement si elle n'est liée à aucun profil
// personnel / professeur / surveillant, et si son compte (s'il existe) n'a
// pas un rôle de membre du personnel.
function elevePersonneFilter() {
	return {
		personnel: null,
		professeur: null,
		surveillant: null,
		OR: [{ compte: null }, { compte: { role: { notIn: [...STAFF_ROLES] } } }]
	};
}

export async function initDb() {
	try {
		const { ensureAdmin } = await import('./ensureAdmin');
		await ensureAdmin();
	} catch (e) {
		console.error('Failed to ensure admin user:', e);
	}
}

export async function getEleves(anneeId?: string) {
	const eleves = await prisma.eleve.findMany({
		where: {
			...(anneeId ? { inscriptions: { some: { anneeId, actif: true } } } : {}),
			personne: elevePersonneFilter()
		},
		include: {
			personne: true,
			inscriptions: {
				where: anneeId ? { anneeId, actif: true } : undefined,
				include: {
					classe: true
				},
				orderBy: {
					dateInscription: 'desc'
				}
			}
		}
	});
	return sortByLower(eleves, (e) => e.personne?.name);
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
	const profs = await prisma.professeur.findMany({
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
	return sortByLower(profs, (p) => p.personne?.name);
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
	const surveillants = await prisma.surveillant.findMany({
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
	return sortByLower(surveillants, (s) => s.personne?.name);
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
	const personnes = await prisma.personne.findMany({
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
		}
	});
	return sortByLower(personnes, (p) => p.name);
}

export async function getAllPersonnesForSurveillant() {
	const personnes = await prisma.personne.findMany({
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
		}
	});
	return sortByLower(personnes, (p) => p.name);
}

export async function createSurveillantFromPersonne(
	personneId: string,
	matricule: string,
	poste: string
) {
	const motDePasseDefaut = await import('./auth').then((m) => m.hashPassword('123456'));
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
					password: motDePasseDefaut,
					role: 'SURVEILLANT',
					statut: 'EN_ATTENTE',
					personneId
				}
			});
		} else {
			compte = await tx.compte.update({
				where: { id: compte.id },
				data: {
					matricule,
					password: motDePasseDefaut,
					role: 'SURVEILLANT',
					statut: 'EN_ATTENTE'
				}
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
	const personnes = await prisma.personne.findMany({
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
		}
	});
	return sortByLower(personnes, (p) => p.name);
}

export async function getClasses(anneeId?: string) {
	const classes = await prisma.classe.findMany({
		where: anneeId ? { anneeId } : undefined,
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
		}
	});
	return sortByLower(classes, (c) => c.nom);
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

export async function getIncidents(anneeId?: string, start?: Date, end?: Date) {
	const dateFilter =
		start || end
			? {
					date: {
						...(start ? { gte: start } : {}),
						...(end ? { lte: end } : {})
					}
				}
			: undefined;
	return prisma.incident.findMany({
		where: {
			...(anneeId ? { anneeId } : {}),
			...(dateFilter || {})
		},
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
	const inscriptions = await prisma.inscription.findMany({
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
	return sortByLower(inscriptions, (i) => i.eleve?.personne?.name);
}

export async function getAnneeScolaires() {
	return prisma.anneeScolaire.findMany({
		orderBy: {
			dateCreation: 'desc'
		}
	});
}

export async function getMatieres(anneeId?: string) {
	const matieres = await prisma.matiere.findMany({
		where: anneeId ? { anneeId } : undefined
	});
	return sortByLower(matieres, (m) => m.nom);
}

export async function createMatiere(
	data: { nom: string; couleur?: string | null; icone?: string | null; imageUrl?: string | null },
	anneeId: string
) {
	return prisma.matiere.create({
		data: {
			nom: data.nom,
			couleur: data.couleur || null,
			icone: data.icone || null,
			imageUrl: data.imageUrl || null,
			anneeId
		}
	});
}

export async function updateMatiere(
	id: string,
	data: { nom?: string; couleur?: string | null; icone?: string | null; imageUrl?: string | null }
) {
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

export async function getCours(anneeId?: string) {
	const cours = await prisma.cours.findMany({
		where: anneeId ? { anneeId } : undefined,
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
	return sortByLower(cours, (c) => c.matiere?.nom);
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
				password: await import('./auth').then((m) => m.hashPassword('123456')),
				role: 'PERSONNEL',
				statut: 'EN_ATTENTE',
				personneId: personne.id
			}
		});

		return { personne, compte };
	});
}

export async function createProfesseurFromPersonne(
	personneId: string,
	matricule: string,
	matiere: string[] = []
) {
	const motDePasseDefaut = await import('./auth').then((m) => m.hashPassword('123456'));
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
					password: motDePasseDefaut,
					role: 'ENSEIGNANT',
					statut: 'EN_ATTENTE',
					personneId
				}
			});
		} else {
			compte = await tx.compte.update({
				where: { id: compte.id },
				data: {
					matricule,
					password: motDePasseDefaut,
					role: 'ENSEIGNANT',
					statut: 'EN_ATTENTE'
				}
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

export async function createEleve(
	data: {
		name: string;
		lastname: string;
		email: string;
		phone: string;
		domicile: string;
		fokontany: string;
		commune: string;
		regionResidence?: string;
		provinceResidence?: string;
		dateNaissance: string;
		lieuNaissance?: string;
		communeNaissance?: string;
		regionNaissance?: string;
		provinceNaissance?: string;
		cin?: string;
		nomPere?: string | null;
		prenomPere?: string | null;
		telephonePere?: string | null;
		nomMere?: string | null;
		prenomMere?: string | null;
		telephoneMere?: string | null;
		nomTuteur?: string | null;
		prenomTuteur?: string | null;
		telephoneTuteur?: string | null;
		im?: string | null;
		sexe?: string | null;
		redoublant?: boolean;
	},
	anneeId?: string
) {
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
				dateNaissance: new Date(data.dateNaissance),
				nomPere: data.nomPere || null,
				prenomPere: data.prenomPere || null,
				telephonePere: data.telephonePere || null,
				nomMere: data.nomMere || null,
				prenomMere: data.prenomMere || null,
				telephoneMere: data.telephoneMere || null,
				nomTuteur: data.nomTuteur || null,
				prenomTuteur: data.prenomTuteur || null,
				telephoneTuteur: data.telephoneTuteur || null,
				im: data.im || null,
				sexe: data.sexe || null,
				redoublant: data.redoublant ?? false,
				cin: data.cin || null,
				lieuNaissance: data.lieuNaissance ? data.lieuNaissance.toUpperCase() : null,
				communeNaissance: data.communeNaissance ? data.communeNaissance.toUpperCase() : null,
				regionNaissance: data.regionNaissance ? data.regionNaissance.toUpperCase() : null,
				provinceNaissance: data.provinceNaissance || null,
				regionResidence: data.regionResidence ? data.regionResidence.toUpperCase() : null,
				provinceResidence: data.provinceResidence || null
			}
		});

		if (anneeId) {
			await tx.inscription.create({
				data: {
					eleveId: eleve.id,
					anneeId,
					actif: true
				}
			});
		}

		return { personne, eleve };
	});
}

export async function updateEleveInfos(
	id: string,
	data: {
		name?: string;
		lastname?: string;
		email?: string;
		phone?: string;
		domicile?: string | null;
		fokontany?: string | null;
		commune?: string | null;
		dateNaissance?: string;
		redoublant?: boolean;
		im?: string | null;
		sexe?: string | null;
		cin?: string | null;
		lieuNaissance?: string | null;
		communeNaissance?: string | null;
		regionNaissance?: string | null;
		provinceNaissance?: string | null;
		regionResidence?: string | null;
		provinceResidence?: string | null;
		nomPere?: string | null;
		prenomPere?: string | null;
		telephonePere?: string | null;
		nomMere?: string | null;
		prenomMere?: string | null;
		telephoneMere?: string | null;
		nomTuteur?: string | null;
		prenomTuteur?: string | null;
		telephoneTuteur?: string | null;
	}
) {
	return prisma.eleve.update({
		where: { id },
		data: {
			redoublant: data.redoublant,
			dateNaissance: data.dateNaissance === undefined ? undefined : new Date(data.dateNaissance),
			im: data.im === undefined ? undefined : data.im || null,
			sexe: data.sexe === undefined ? undefined : data.sexe || null,
			cin: data.cin === undefined ? undefined : data.cin || null,
			lieuNaissance: data.lieuNaissance === undefined ? undefined : data.lieuNaissance || null,
			communeNaissance:
				data.communeNaissance === undefined ? undefined : data.communeNaissance || null,
			regionNaissance:
				data.regionNaissance === undefined ? undefined : data.regionNaissance || null,
			provinceNaissance:
				data.provinceNaissance === undefined ? undefined : data.provinceNaissance || null,
			regionResidence:
				data.regionResidence === undefined ? undefined : data.regionResidence || null,
			provinceResidence:
				data.provinceResidence === undefined ? undefined : data.provinceResidence || null,
			nomPere: data.nomPere === undefined ? undefined : data.nomPere || null,
			prenomPere: data.prenomPere === undefined ? undefined : data.prenomPere || null,
			telephonePere: data.telephonePere === undefined ? undefined : data.telephonePere || null,
			nomMere: data.nomMere === undefined ? undefined : data.nomMere || null,
			prenomMere: data.prenomMere === undefined ? undefined : data.prenomMere || null,
			telephoneMere: data.telephoneMere === undefined ? undefined : data.telephoneMere || null,
			nomTuteur: data.nomTuteur === undefined ? undefined : data.nomTuteur || null,
			prenomTuteur: data.prenomTuteur === undefined ? undefined : data.prenomTuteur || null,
			telephoneTuteur:
				data.telephoneTuteur === undefined ? undefined : data.telephoneTuteur || null,
			personne: {
				update: {
					name: data.name,
					lastname: data.lastname,
					email: data.email,
					phone: data.phone,
					domicile: data.domicile === undefined ? undefined : data.domicile || null,
					fokontany: data.fokontany === undefined ? undefined : data.fokontany || null,
					commune: data.commune === undefined ? undefined : data.commune || null
				}
			}
		}
	});
}

export async function getActiveAnneeScolaire() {
	return prisma.anneeScolaire.findFirst({
		where: { active: true },
		orderBy: { dateCreation: 'desc' }
	});
}

export async function createAnneeScolaire(nom: string) {
	return prisma.$transaction(async (tx) => {
		const hasActive = await tx.anneeScolaire.findFirst({ where: { active: true } });
		// La nouvelle annee est inactive par defaut ; elle ne devient active
		// qu'apres selection explicite. Si aucune annee n'est active, on l'active
		// pour eviter de bloquer l'application.
		const active = !hasActive;
		if (active) {
			await tx.anneeScolaire.updateMany({ data: { active: false } });
		}
		return tx.anneeScolaire.create({
			data: { nom, active }
		});
	});
}

export async function setActiveAnneeScolaire(id: string) {
	return prisma.$transaction(async (tx) => {
		await tx.anneeScolaire.updateMany({ data: { active: false } });
		return tx.anneeScolaire.update({
			where: { id },
			data: { active: true }
		});
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
			nom:
				data.nom ||
				`${data.niveau === 0 ? '2nde' : data.niveau === 1 ? '1ère' : 'Terminale'}${data.serie ? ' ' + data.serie.toUpperCase() : ''}`,
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

export async function updateClasse(
	id: string,
	data: {
		nom?: string;
		niveau?: number;
		serie?: string;
		titulaireId?: string | null;
	}
) {
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

	// Seuls les eleves deja affectes a une classe cette annee sont consideres
	// comme non disponibles. Un eleve sans classe (nouvellement cree) reste
	// inscrivable.
	const inscriptionsAvecClasse = await prisma.inscription.findMany({
		where: { anneeId: annee.id, actif: true, classeId: { not: null } },
		select: { eleveId: true }
	});
	const inscritsIds = new Set(inscriptionsAvecClasse.map((i) => i.eleveId));

	// Un eleve dont la personne est aussi un personnel / professeur /
	// surveillant ne doit jamais etre proposable pour une inscription en classe.
		const eleves = await prisma.eleve.findMany({
		where: {
			id: { notIn: [...inscritsIds] },
			personne: elevePersonneFilter()
		},
		include: { personne: true }
	});

	return sortByLower(eleves, (e) => e.personne?.name).map((eleve) => ({
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
				anneeId: annee.id
			}
		});

		if (existingInscription) {
			const changementClasse = existingInscription.classeId !== classeId;
			await tx.inscription.update({
				where: { id: existingInscription.id },
				data: { classeId, actif: true }
			});
			if (changementClasse) {
				if (existingInscription.classeId) {
					await tx.classe.update({
						where: { id: existingInscription.classeId },
						data: { elevesCount: { decrement: 1 } }
					});
				}
				await tx.classe.update({
					where: { id: classeId },
					data: { elevesCount: { increment: 1 } }
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
				domicile: eleve?.personne.domicile || '',
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
			domicile: eleve?.personne.domicile || '',
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

export async function updatePersonneImage(personneId: string, imageUrl: string | null) {
	return prisma.personne.update({
		where: { id: personneId },
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
			if (!ins.classeId) continue;
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
		// Suppression du compte associé (sinon il reste orphelin en rôle PERSONNEL).
		await tx.compte.deleteMany({ where: { personneId: prof.personneId } });
		return { success: true };
	});
}

/**
 * Détecte une erreur de contrainte de clé étrangère (ex. suppression impossible
 * car l'élément est encore référencé par d'autres données).
 */
export function isForeignKeyError(e: unknown): boolean {
	const err = e as { code?: string; message?: string };
	if (err?.code === 'P2003') return true;
	const msg = err?.message || '';
	return /foreign key constraint/i.test(msg) || /constraint failed/i.test(msg);
}

export const FOREIGN_KEY_MESSAGE =
	"Suppression impossible : cet élément est encore lié à d'autres données (cours, notes, présences, etc.). Retirez d'abord ces liens avant de le supprimer.";

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

export async function updateCours(
	id: string,
	data: {
		matiereId?: string;
		coefficient?: number;
		participants?: string[];
		professeurId?: string;
	}
) {
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

export async function createSousExamen(data: { examenId: string; nom: string }) {
	return prisma.sousExamen.create({
		data: {
			examenId: data.examenId,
			nom: data.nom
		}
	});
}

export async function deleteExamen(id: string) {
	return prisma.$transaction(async (tx) => {
		const sousExamens = await tx.sousExamen.findMany({
			where: { examenId: id },
			select: { id: true }
		});
		const sousExamenIds = sousExamens.map((s) => s.id);
		// Supprime d'abord les notes liees a l'examen ou a ses sous-examens
		await tx.note.deleteMany({
			where: {
				OR: [{ examenId: id }, ...(sousExamenIds.length ? [{ sousExamenId: { in: sousExamenIds } }] : [])]
			}
		});
		// La suppression de l'examen supprime ses sous-examens en cascade
		return tx.examen.delete({ where: { id } });
	});
}

export async function getSousExamensByExamenId(examenId: string) {
	return prisma.sousExamen.findMany({
		where: { examenId },
		orderBy: { createdAt: 'asc' }
	});
}

export async function deleteSousExamen(id: string) {
	return prisma.sousExamen.delete({ where: { id } });
}

export async function createNote(data: {
	valeur: number;
	coefficient?: number;
	libelle?: string;
	eleveId: string;
	coursId: string;
	examenId?: string | null;
	sousExamenId?: string;
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
			sousExamenId: data.sousExamenId || null,
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

export async function getSousExamenById(id: string) {
	return prisma.sousExamen.findUnique({ where: { id } });
}

export async function deleteNote(id: string) {
	return prisma.note.delete({ where: { id } });
}

export async function updateNote(id: string, data: { valeur?: number; libelle?: string | null }) {
	return prisma.note.update({
		where: { id },
		data: {
			...(data.valeur !== undefined ? { valeur: data.valeur } : {}),
			...(data.libelle !== undefined ? { libelle: data.libelle || null } : {})
		}
	});
}
