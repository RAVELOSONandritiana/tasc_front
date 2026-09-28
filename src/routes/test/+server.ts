import { json, error, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { hashPassword } from '$lib/server/auth';
import { hasAdminPower } from '$lib/permissions';
import type { RequestEvent } from '@sveltejs/kit';

function randBetween(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 1): number {
	const val = Math.random() * (max - min) + min;
	return parseFloat(val.toFixed(decimals));
}

const PRENOMS_G = [
	'Lucas',
	'Thomas',
	'Nicolas',
	'Hugo',
	'Gabriel',
	'Raphaël',
	'Paul',
	'Louis',
	'Maxime',
	'Antoine',
	'Julien',
	'Alexandre',
	'Kevin',
	'Théo',
	'Yanis',
	'Noé',
	'Evan',
	'Quentin',
	'Adrien',
	'Bryan',
	'Marcus',
	'Ethan',
	'Kylian',
	'Enzo',
	'Mélanie',
	'Manon',
	'Sarah',
	'Clara',
	'Léa',
	'Maya'
];
const PRENOMS_F = [
	'Emma',
	'Julie',
	'Sophie',
	'Camille',
	'Manon',
	'Léa',
	'Chloé',
	'Inès',
	'Alice',
	'Clara',
	'Maya',
	'Zoe',
	'Mathilde',
	'Pauline',
	'Anaïs',
	'Lucie',
	'Émilie',
	'Sarah',
	'Laura',
	'Marion',
	'Céline',
	'Audrey',
	'Stéphanie',
	'Isabelle',
	'Caroline',
	'Valentine',
	'Amélie',
	'Mélanie',
	'Camille',
	'Océane'
];
const NOMS = [
	'Andrianirina',
	'Rasoa',
	'Rakotondraibe',
	'Ramanantsoa',
	'Randrianarisoa',
	'Ravoarijaona',
	'Razafindramanana',
	'Razakarivony',
	'Andriamiarantsoa',
	'Ralaimiandrazafy',
	'Andrianampoinimerina',
	'Rasolofonirina',
	'Randriamampionona',
	'Rasamy',
	'Razafiharivelo',
	'Andriatazafy',
	'Randrianambinina',
	'Andriamialisoa',
	'Razafindrasehen',
	'Rakotomalala',
	'Razafindramanantsoa',
	'Andriamifanomezanahary',
	'Razafintsindraza',
	'Rakotovavy',
	'Andrianjafy',
	'Razafindramasy',
	'Rasolondrainitra',
	'Andriamahazo',
	'Razak',
	'Randriatsaraf'
];

const MATIERES = [
	{ nom: 'Mathématiques', couleur: '#3b82f6', icone: '📐' },
	{ nom: 'Français', couleur: '#ef4444', icone: '📖' },
	{ nom: 'Physique', couleur: '#8b5cf6', icone: '⚛️' },
	{ nom: 'Histoire-Géo', couleur: '#f59e0b', icone: '🏛️' },
	{ nom: 'Sciences', couleur: '#22c55e', icone: '🔬' },
	{ nom: 'Anglais', couleur: '#10b981', icone: '🇬🇧' },
	{ nom: 'Espagnol', couleur: '#eab308', icone: '🇪🇸' },
	{ nom: 'Philosophie', couleur: '#7e22ce', icone: '🤔' }
];

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
const HORAIRES = [
	{ debut: '08:00', fin: '10:00' },
	{ debut: '10:30', fin: '12:30' },
	{ debut: '14:00', fin: '16:00' },
	{ debut: '16:30', fin: '18:30' }
];

const CLASSE_LABELS = [
	{ nom: '2nde A', niveau: 3, serie: 'A' },
	{ nom: '2nde B', niveau: 3, serie: 'B' },
	{ nom: '2nde C', niveau: 3, serie: 'C' },
	{ nom: '1ère A', niveau: 2, serie: 'A' },
	{ nom: '1ère B', niveau: 2, serie: 'B' },
	{ nom: 'Terminale A', niveau: 1, serie: 'A' },
	{ nom: 'Terminale B', niveau: 1, serie: 'B' },
	{ nom: 'Terminale C', niveau: 1, serie: 'C' }
];

const STAFF_NOMS = [
	'Dupont',
	'Rakoto',
	'Rabe',
	'Njaratiana',
	'Andrianirina',
	'Rasoa',
	'Randrianari',
	'Ramananto',
	'Andriamahazo',
	'Razafindramanana',
	'Ralaimiandrazafy',
	'Andrianampoinimerina',
	'Rasolofonirina'
];
const STAFF_PRENOMS = [
	'Jean',
	'Marie',
	'Paul',
	'Claire',
	'Lucas',
	'Emma',
	'Thomas',
	'Sophie',
	'Hugo',
	'Léa',
	'Raphaël',
	'Camille',
	'Maxime',
	'Chloé',
	'Antoine',
	'Inès',
	'Julien',
	'Alice',
	'Kevin',
	'Marion'
];

async function runSimulation({ locals }: RequestEvent) {
	if (!locals.user || !hasAdminPower(locals.user)) {
		throw error(403, 'Accès refusé');
	}

	try {
		const result = await prisma.$transaction(async (tx) => {
			let annee = await tx.anneeScolaire.findFirst({
				where: { active: true },
				orderBy: { dateCreation: 'desc' }
			});
			if (!annee) {
				await tx.anneeScolaire.updateMany({ data: { active: false } });
				annee = await tx.anneeScolaire.create({
					data: { nom: '2025-2026', active: true, seuilAbsenceConvoc: 3 }
				});
			}

			const matieresCreated: { id: string; nom: string }[] = [];
			for (const m of MATIERES) {
				const existing = await tx.matiere.findFirst({
					where: { nom: m.nom, anneeId: annee.id }
				});
				if (existing) {
					matieresCreated.push({ id: existing.id, nom: existing.nom });
				} else {
					const created = await tx.matiere.create({
						data: { nom: m.nom, couleur: m.couleur, icone: m.icone, anneeId: annee.id }
					});
					matieresCreated.push({ id: created.id, nom: created.nom });
				}
			}

			const professeurs: { id: string; personneId: string; matieres: string[] }[] = [];
			for (let i = 0; i < 5; i++) {
				const prenom = STAFF_PRENOMS[i % STAFF_PRENOMS.length];
				const nom = STAFF_NOMS[i % STAFF_NOMS.length];
				const email = `prof${i + 1}@tasc.mg`;
				let personne = await tx.personne.findUnique({ where: { email } });
				if (!personne) {
					personne = await tx.personne.create({
						data: {
							name: prenom,
							lastname: nom,
							email,
							phone: `+26134${String(i + 1).padStart(8, '0')}`,
							domicile: 'Antananarivo',
							fokontany: ['Analakely', 'Isotry', 'Anosy', '67Ha', 'Ambatoranjena'][i % 5],
							commune: 'Antananarivo'
						}
					});
				}

				const existingProf = await tx.professeur.findUnique({ where: { personneId: personne.id } });
				const matiereNames = [
					matieresCreated[i % matieresCreated.length]?.nom || 'Mathématiques',
					matieresCreated[(i + 1) % matieresCreated.length]?.nom || 'Français'
				];
				const prof =
					existingProf ||
					(await tx.professeur.create({
						data: {
							personneId: personne.id,
							matiere: matiereNames,
							nbCours: 0,
							retards: 0,
							absences: 0,
							incidents: 0,
							notesPositives: 0,
							notesNegatives: 0
						}
					}));

				await tx.compte.upsert({
					where: { personneId: personne.id },
					update: {
						role: 'ENSEIGNANT',
						statut: 'ACTIF',
						password: await hashPassword('123456')
					},
					create: {
						matricule: `ENS-${String(100 + i)}`,
						password: await hashPassword('123456'),
						role: 'ENSEIGNANT',
						statut: 'ACTIF',
						personneId: personne.id
					}
				});

				professeurs.push({ id: prof.id, personneId: personne.id, matieres: matiereNames });
			}

			const surveillants: { id: string; compteId: string }[] = [];
			for (let i = 0; i < 2; i++) {
				const prenom = STAFF_PRENOMS[(i + 5) % STAFF_PRENOMS.length];
				const nom = STAFF_NOMS[(i + 5) % STAFF_NOMS.length];
				const email = `surveillant${i + 1}@tasc.mg`;
				let personne = await tx.personne.findUnique({ where: { email } });
				if (!personne) {
					personne = await tx.personne.create({
						data: {
							name: prenom,
							lastname: nom,
							email,
							phone: `+26134${String(200 + i).padStart(8, '0')}`,
							domicile: 'Antananarivo',
							fokontany: 'Centre-Ville',
							commune: 'Antananarivo'
						}
					});
				}

				const existingSurv = await tx.surveillant.findUnique({
					where: { personneId: personne.id }
				});
				const poste = i === 0 ? 'Surveillant General' : 'Surveillant';
				const surv =
					existingSurv ||
					(await tx.surveillant.create({
						data: {
							personneId: personne.id,
							poste,
							nbCours: 0,
							retards: 0,
							absences: 0,
							incidents: 0,
							notesPositives: 0,
							notesNegatives: 0
						}
					}));

				const compte = await tx.compte.upsert({
					where: { personneId: personne.id },
					update: {
						role: 'SURVEILLANT',
						statut: 'ACTIF',
						password: await hashPassword('123456')
					},
					create: {
						matricule: `SRV-${String(100 + i)}`,
						password: await hashPassword('123456'),
						role: 'SURVEILLANT',
						statut: 'ACTIF',
						personneId: personne.id
					}
				});

				surveillants.push({ id: surv.id, compteId: compte.id });
			}

			const personnels: { id: string; personneId: string }[] = [];
			for (let i = 0; i < 2; i++) {
				const prenom = STAFF_PRENOMS[(i + 7) % STAFF_PRENOMS.length];
				const nom = STAFF_NOMS[(i + 7) % STAFF_NOMS.length];
				const email = `personnel${i + 1}@tasc.mg`;
				let personne = await tx.personne.findUnique({ where: { email } });
				if (!personne) {
					personne = await tx.personne.create({
						data: {
							name: prenom,
							lastname: nom,
							email,
							phone: `+26134${String(300 + i).padStart(8, '0')}`,
							domicile: 'Antananarivo',
							fokontany: 'Analakely',
							commune: 'Antananarivo'
						}
					});
				}

				const existingPers = await tx.personnel.findUnique({ where: { personneId: personne.id } });
				const postes = ['Secrétaire', 'Comptable'];
				const pers =
					existingPers ||
					(await tx.personnel.create({
						data: { personneId: personne.id, poste: postes[i % postes.length] }
					}));

				await tx.compte.upsert({
					where: { personneId: personne.id },
					update: {
						role: 'PERSONNEL',
						statut: 'ACTIF',
						password: await hashPassword('123456')
					},
					create: {
						matricule: `PRS-${String(100 + i)}`,
						password: await hashPassword('123456'),
						role: 'PERSONNEL',
						statut: 'ACTIF',
						personneId: personne.id
					}
				});

				personnels.push({ id: pers.id, personneId: personne.id });
			}

			const operateurs: { id: string; personneId: string }[] = [];
			for (let i = 0; i < 1; i++) {
				const prenom = STAFF_PRENOMS[(i + 9) % STAFF_PRENOMS.length];
				const nom = STAFF_NOMS[(i + 9) % STAFF_NOMS.length];
				const email = `operateur${i + 1}@tasc.mg`;
				let personne = await tx.personne.findUnique({ where: { email } });
				if (!personne) {
					personne = await tx.personne.create({
						data: {
							name: prenom,
							lastname: nom,
							email,
							phone: `+26134${String(400 + i).padStart(8, '0')}`,
							domicile: 'Antananarivo',
							fokontany: 'Anosy',
							commune: 'Antananarivo'
						}
					});
				}

				await tx.personnel.upsert({
					where: { personneId: personne.id },
					update: { poste: 'Opérateur' },
					create: { personneId: personne.id, poste: 'Opérateur' }
				});

				await tx.compte.upsert({
					where: { personneId: personne.id },
					update: {
						role: 'OPERATEUR',
						statut: 'ACTIF',
						password: await hashPassword('123456')
					},
					create: {
						matricule: `OPR-${String(100 + i)}`,
						password: await hashPassword('123456'),
						role: 'OPERATEUR',
						statut: 'ACTIF',
						personneId: personne.id
					}
				});

				operateurs.push({ id: personne.id, personneId: personne.id });
			}

			const nbClasses = 5;
			const classes: { id: string; nom: string; niveau: number; serie: string | null }[] = [];
			for (let i = 0; i < nbClasses; i++) {
				const clDef = CLASSE_LABELS[i];
				const existingClasse = await tx.classe.findFirst({
					where: { nom: clDef.nom, anneeId: annee.id }
				});
				const cl =
					existingClasse ||
					(await tx.classe.create({
						data: {
							nom: clDef.nom,
							niveau: clDef.niveau,
							serie: clDef.serie,
							anneeId: annee.id,
							elevesCount: 0,
							titulaireId: professeurs[i % professeurs.length]?.id || null
						}
					}));
				classes.push({ id: cl.id, nom: cl.nom || clDef.nom, niveau: cl.niveau, serie: cl.serie });
			}

			const ELEVES_PER_CLASSE = 20;
			const eleves: {
				id: string;
				personneId: string;
				name: string;
				lastname: string;
				im: string;
			}[] = [];
			const imCounter = { current: 1 };
			for (let ci = 0; ci < classes.length; ci++) {
				for (let ei = 0; ei < ELEVES_PER_CLASSE; ei++) {
					const globalIdx = ci * ELEVES_PER_CLASSE + ei;
					const prenom =
						globalIdx % 2 === 0
							? PRENOMS_G[globalIdx % PRENOMS_G.length]
							: PRENOMS_F[globalIdx % PRENOMS_F.length];
					const nom = NOMS[globalIdx % NOMS.length];
					const email = `${prenom.toLowerCase()}.${nom.toLowerCase()}${globalIdx}@eleve.mg`;

					let personne = await tx.personne.findUnique({ where: { email } });
					if (!personne) {
						personne = await tx.personne.create({
							data: {
								name: prenom,
								lastname: nom,
								email,
								phone: `+26134${String(5000 + globalIdx).padStart(7, '0')}`,
								domicile: 'Antananarivo',
								fokontany: ['Analakely', 'Isotry', 'Anosy', '67Ha', 'Ambatoranjena'][globalIdx % 5],
								commune: 'Antananarivo'
							}
						});
					}

					let eleve = await tx.eleve.findUnique({ where: { personneId: personne.id } });
					const im = `IM${String(1000 + imCounter.current++).padStart(4, '0')}`;
					if (!eleve) {
						eleve = await tx.eleve.create({
							data: {
								personneId: personne.id,
								dateNaissance: new Date(
									`200${7 - (globalIdx % 4)}-03-${String(randBetween(1, 28)).padStart(2, '0')}`
								),
								im: im,
								sexe: globalIdx % 2 === 0 ? 'G' : 'F',
								redoublant: globalIdx % 7 === 0,
								situation: globalIdx % 7 === 0 ? 'R' : 'P',
								cin: `1234567${String(globalIdx).padStart(5, '0')}`,
								lieuNaissance: 'ANTANANARIVO',
								communeNaissance: 'ANTANANARIVO',
								regionNaissance: 'ANALAMANGA',
								regionResidence: 'ANALAMANGA',
								coursTermines: 0
							}
						});
					}

					eleves.push({
						id: eleve.id,
						personneId: personne.id,
						name: prenom,
						lastname: nom,
						im: eleve.im || im
					});
				}
			}

			const repartition: string[][] = [];
			for (let ci = 0; ci < classes.length; ci++) {
				const start = ci * ELEVES_PER_CLASSE;
				const end = start + ELEVES_PER_CLASSE;
				repartition.push(eleves.slice(start, end).map((e) => e.id));
			}

			const inscriptions: { id: string; eleveId: string; classeId: string }[] = [];
			for (let ci = 0; ci < classes.length; ci++) {
				for (const eid of repartition[ci]) {
					const existingInscription = await tx.inscription.findFirst({
						where: { eleveId: eid, classeId: classes[ci].id, anneeId: annee.id }
					});
					if (!existingInscription) {
						const inscription = await tx.inscription.create({
							data: { eleveId: eid, classeId: classes[ci].id, anneeId: annee.id, actif: true }
						});
						inscriptions.push({ id: inscription.id, eleveId: eid, classeId: classes[ci].id });
					} else {
						inscriptions.push({
							id: existingInscription.id,
							eleveId: eid,
							classeId: classes[ci].id
						});
					}
				}
				await tx.classe.update({
					where: { id: classes[ci].id },
					data: { elevesCount: repartition[ci].length }
				});
			}

			const cours: {
				id: string;
				matiereId: string;
				matiereNom: string;
				professeurId: string;
				classeId: string;
				eleves: string[];
			}[] = [];
			const nbMatieresClasse = Math.min(matieresCreated.length, professeurs.length);
			for (let ci = 0; ci < classes.length; ci++) {
				for (let mi = 0; mi < nbMatieresClasse; mi++) {
					const matiere = matieresCreated[mi];
					const prof = professeurs[mi % professeurs.length];
					const classeEleves = repartition[ci];

					const existingCours = await tx.cours.findFirst({
						where: {
							classeId: classes[ci].id,
							matiereId: matiere.id,
							professeurId: prof.id
						}
					});
					const cr =
						existingCours ||
						(await tx.cours.create({
							data: {
								classeId: classes[ci].id,
								matiereId: matiere.id,
								professeurId: prof.id,
								anneeId: annee.id,
								coefficient: randBetween(1, 4),
								participants: classeEleves
							}
						}));
					cours.push({
						id: cr.id,
						matiereId: matiere.id,
						matiereNom: matiere.nom,
						professeurId: prof.id,
						classeId: classes[ci].id,
						eleves: classeEleves
					});
				}
			}

			const existingExamens = await tx.examen.findMany({
				where: { anneeId: annee.id },
				include: { classe: true, notes: true }
			});

			const examens: {
				id: string;
				nom: string;
				classeId: string;
				matiereId: string;
				coursId: string;
				sousExamens: string[];
				dateStr: string;
			}[] = [];

			for (const ex of existingExamens) {
				const matiereFromName = matieresCreated.find((m) => ex.nom.includes(m.nom));
				const matiere = matiereFromName || matieresCreated[0];
				const coursMatch = cours.find(
					(c) => c.classeId === ex.classeId && c.matiereId === matiere.id
				);
				examens.push({
					id: ex.id,
					nom: ex.nom,
					classeId: ex.classeId,
					matiereId: matiere.id,
					coursId:
						coursMatch?.id || cours.find((c) => c.classeId === ex.classeId)?.id || cours[0].id,
					sousExamens: [],
					dateStr: ex.date.toISOString()
				});
			}

			for (let ci = 0; ci < classes.length; ci++) {
				for (let mi = 0; mi < nbMatieresClasse; mi++) {
					const matiere = matieresCreated[mi];
					const existing = existingExamens.find(
						(ex) => ex.classeId === classes[ci].id && ex.nom.includes(matiere.nom)
					);
					if (existing) continue;

					const dateStr = new Date(
						`2025-11-${String(randBetween(10, 25)).padStart(2, '0')}T${String(randBetween(8, 14)).padStart(2, '0')}:00:00`
					).toISOString();
					const ex = await tx.examen.create({
						data: {
							nom: `Examen ${matiere.nom} - ${classes[ci].nom}`,
							date: new Date(dateStr),
							periode: '1er trimestre',
							classeId: classes[ci].id,
							anneeId: annee.id
						}
					});

					const sousExamens: string[] = [];
					for (const sousNom of ['Partie A', 'Partie B']) {
						const existingSous = await tx.sousExamen.findFirst({
							where: { examenId: ex.id, nom: sousNom }
						});
						const se =
							existingSous ||
							(await tx.sousExamen.create({ data: { examenId: ex.id, nom: sousNom } }));
						sousExamens.push(se.id);
					}

					const coursMatch = cours.find(
						(c) => c.classeId === classes[ci].id && c.matiereId === matiere.id
					);
					examens.push({
						id: ex.id,
						nom: ex.nom,
						classeId: classes[ci].id,
						matiereId: matiere.id,
						coursId: coursMatch?.id || cours[0].id,
						sousExamens,
						dateStr
					});
				}
			}

			const existingNotesForExam = await tx.note.findMany({
				where: { examenId: { in: examens.map((e) => e.id) } },
				select: { eleveId: true, examenId: true, sousExamenId: true }
			});
			const existingNoteKeys = new Set(
				existingNotesForExam.map((n) => `${n.eleveId}-${n.examenId}-${n.sousExamenId || ''}`)
			);

			const examNotesData: {
				valeur: number;
				coefficient: number;
				date: Date;
				libelle: string;
				eleveId: string;
				coursId: string;
				examenId: string;
				sousExamenId: string;
				inscriptionId: string;
			}[] = [];
			let nbExamNotesNew = 0;
			for (const ex of examens) {
				const classeEleves = repartition[classes.findIndex((c) => c.id === ex.classeId)];
				if (!classeEleves) continue;

				for (const eid of classeEleves) {
					const inscrip = inscriptions.find((i) => i.eleveId === eid && i.classeId === ex.classeId);
					if (!inscrip) continue;

					for (let s = 0; s < ex.sousExamens.length; s++) {
						const key = `${eid}-${ex.id}-${ex.sousExamens[s]}`;
						if (existingNoteKeys.has(key)) continue;

						examNotesData.push({
							valeur: randFloat(6, 20, 1),
							coefficient: s === 0 ? 2 : 3,
							date: new Date(ex.dateStr),
							libelle: s === 0 ? 'Partie A' : 'Partie B',
							eleveId: eid,
							coursId: ex.coursId,
							examenId: ex.id,
							sousExamenId: ex.sousExamens[s],
							inscriptionId: inscrip.id
						});
						nbExamNotesNew++;
					}
				}
			}

			if (examNotesData.length > 0) {
				await tx.note.createMany({ data: examNotesData });
			}

			const regularNotesData: {
				valeur: number;
				coefficient: number;
				date: Date;
				libelle: string;
				eleveId: string;
				coursId: string;
				examenId: string | null;
				sousExamenId: string | null;
				inscriptionId: string | null;
			}[] = [];
			for (const cr of cours) {
				for (const eid of cr.eleves) {
					const nbNotes = randBetween(2, 4);
					const inscrip = inscriptions.find((i) => i.eleveId === eid);
					for (let n = 0; n < nbNotes; n++) {
						regularNotesData.push({
							valeur: randFloat(5, 20, 1),
							coefficient: randBetween(1, 3),
							date: new Date(
								`2025-10-${String(randBetween(1, 28)).padStart(2, '0')}T${String(randBetween(8, 16)).padStart(2, '0')}:00:00`
							),
							libelle: n === 0 ? 'Devoir' : n === 1 ? 'Interrogation' : 'Contrôle',
							eleveId: eid,
							coursId: cr.id,
							examenId: null,
							sousExamenId: null,
							inscriptionId: inscrip?.id || null
						});
					}
				}
			}
			if (regularNotesData.length > 0) {
				await tx.note.createMany({ data: regularNotesData });
			}

			const absencesData: {
				eleveId: string;
				inscriptionId: string | null;
				date: Date;
				justifie: boolean;
				motif: string;
			}[] = [];
			let nbAbsences = 0;
			for (const e of eleves) {
				const nbAbs = randBetween(0, 4);
				const inscrip = inscriptions.find((i) => i.eleveId === e.id);
				for (let a = 0; a < nbAbs; a++) {
					absencesData.push({
						eleveId: e.id,
						inscriptionId: inscrip?.id || null,
						date: new Date(
							`2025-10-${String(randBetween(1, 28)).padStart(2, '0')}T${String(randBetween(8, 16)).padStart(2, '0')}:00:00`
						),
						justifie: Math.random() > 0.35,
						motif: ['Malade', 'Fête familiale', 'Problème de transport', 'Autre'][randBetween(0, 3)]
					});
					nbAbsences++;
				}
			}
			if (absencesData.length > 0) {
				await tx.absence.createMany({ data: absencesData });
			}

			const retardsData: {
				eleveId: string;
				inscriptionId: string | null;
				date: Date;
				duree: string;
				justifie: boolean;
				motif: string;
			}[] = [];
			let nbRetards = 0;
			for (const e of eleves) {
				const nbRet = randBetween(0, 5);
				const inscrip = inscriptions.find((i) => i.eleveId === e.id);
				for (let r = 0; r < nbRet; r++) {
					retardsData.push({
						eleveId: e.id,
						inscriptionId: inscrip?.id || null,
						date: new Date(
							`2025-10-${String(randBetween(1, 28)).padStart(2, '0')}T${String(randBetween(8, 9)).padStart(2, '0')}:00:00`
						),
						duree: `${randBetween(5, 30)}min`,
						justifie: Math.random() > 0.45,
						motif: ['Attendu le bus', 'Transport en retard', 'Problème familial', 'Oubli'][
							randBetween(0, 3)
						]
					});
					nbRetards++;
				}
			}
			if (retardsData.length > 0) {
				await tx.retard.createMany({ data: retardsData });
			}

			const seancesCours: { id: string; eleveIds: string[] }[] = [];
			let nbSeancesCours = 0;
			for (const cr of cours) {
				const nbSeances = randBetween(3, 6);
				for (let s = 0; s < nbSeances; s++) {
					const heureD = randBetween(8, 15);
					const heureF = heureD + 2;
					const dateBase = randBetween(1, 25);
					const seance = await tx.seanceCours.create({
						data: {
							coursId: cr.id,
							professeurId: cr.professeurId,
							anneeId: annee.id,
							statut: s < nbSeances - 1 ? 'TERMINE' : 'EN_COURS',
							dateDebut: new Date(
								`2025-10-${String(dateBase).padStart(2, '0')}T${String(heureD).padStart(2, '0')}:00:00`
							),
							dateFin:
								s < nbSeances - 1
									? new Date(
											`2025-10-${String(dateBase).padStart(2, '0')}T${String(heureF).padStart(2, '0')}:00:00`
										)
									: null
						}
					});
					seancesCours.push({ id: seance.id, eleveIds: cr.eleves });
					nbSeancesCours++;
				}
			}

			const presenceData: {
				seanceId: string;
				eleveId: string;
				statut: 'PRESENT' | 'ABSENT' | 'RETARD';
			}[] = [];
			let nbPresences = 0;
			for (const sc of seancesCours) {
				for (const eid of sc.eleveIds) {
					const roll = Math.random();
					const statut = roll > 0.08 ? 'PRESENT' : roll > 0.03 ? 'ABSENT' : 'RETARD';
					presenceData.push({ seanceId: sc.id, eleveId: eid, statut });
					nbPresences++;
				}
			}
			if (presenceData.length > 0) {
				await tx.presenceEleve.createMany({ data: presenceData });
			}

			const incidentData: {
				type: 'INFO' | 'ERREUR' | 'NOTE' | 'ABSENT';
				message: string;
				auteur: string;
				eleveId: string;
				anneeId: string;
				inscriptionId: string | null;
			}[] = [];
			let nbIncidents = 0;
			for (const e of eleves) {
				const nbInc = randBetween(0, 3);
				const inscrip = inscriptions.find((ins) => ins.eleveId === e.id);
				for (let i = 0; i < nbInc; i++) {
					const type = ['INFO', 'ERREUR', 'NOTE', 'ABSENT'][randBetween(0, 3)] as
						| 'INFO'
						| 'ERREUR'
						| 'NOTE'
						| 'ABSENT';
					incidentData.push({
						type: type,
						message: [
							'Comportement exemplaire',
							'Retard répété',
							'Absence injustifiée',
							'Négligence aux devoirs',
							'Harcèlement scolaire'
						][randBetween(0, 4)],
						auteur: 'Système de simulation',
						eleveId: e.id,
						anneeId: annee.id,
						inscriptionId: inscrip?.id || null
					});
					nbIncidents++;
				}
			}
			if (incidentData.length > 0) {
				await tx.incident.createMany({ data: incidentData });
			}

			const allIncidents = await tx.incident.findMany({
				where: {
					anneeId: annee.id,
					auteur: 'Système de simulation'
				},
				select: { id: true }
			});
			for (const inc of allIncidents) {
				const nbComments = randBetween(0, 2);
				const commentsData = [];
				for (let c = 0; c < nbComments; c++) {
					commentsData.push({
						author: 'Surveillant',
						text: ['Avertissement verbal', 'Mise en demeure', 'Félicitations'][randBetween(0, 2)],
						incidentId: inc.id
					});
				}
				if (commentsData.length > 0) {
					await tx.comment.createMany({ data: commentsData });
				}

				const nbReactions = randBetween(0, 2);
				const reactionsData = [];
				for (let r = 0; r < nbReactions; r++) {
					reactionsData.push({
						emoji: ['👍', '⚠️', '❤️'][randBetween(0, 2)],
						user: 'Surveillant',
						incidentId: inc.id
					});
				}
				if (reactionsData.length > 0) {
					await tx.reaction.createMany({ data: reactionsData });
				}
			}

			const rapportData: {
				type: 'RETARD' | 'ABSENCE';
				message: string;
				auteur: string;
				compteId: string | null;
				eleveId: string;
				inscriptionId: string | null;
				anneeId: string;
			}[] = [];
			let nbRapports = 0;
			for (const e of eleves) {
				const nbRapp = randBetween(0, 2);
				const inscrip = inscriptions.find((ins) => ins.eleveId === e.id);
				for (let r = 0; r < nbRapp; r++) {
					const rapportType: 'RETARD' | 'ABSENCE' = randBetween(0, 1) === 0 ? 'RETARD' : 'ABSENCE';
					rapportData.push({
						type: rapportType,
						message:
							rapportType === 'RETARD'
								? `Retard de ${randBetween(5, 30)}min`
								: 'Absence injustifiée',
						auteur: 'Système de simulation',
						compteId: null,
						eleveId: e.id,
						inscriptionId: inscrip?.id || null,
						anneeId: annee.id
					});
					nbRapports++;
				}
			}
			if (rapportData.length > 0) {
				await tx.rapport.createMany({ data: rapportData });
			}

			const allRapports = await tx.rapport.findMany({
				where: { auteur: 'Système de simulation' },
				select: { id: true, eleveId: true, type: true }
			});
			let nbRapportLignes = 0;
			for (const rpt of allRapports) {
				const ligneType: 'RETARD' | 'ABSENCE' = rpt.type;
				const relatedAbs = absencesData.find((a) => a.eleveId === rpt.eleveId);
				const relatedRet = retardsData.find((r) => r.eleveId === rpt.eleveId);

				const absId =
					ligneType === 'ABSENCE' ? (relatedAbs ? await getAbsenceId(tx, relatedAbs) : null) : null;
				const retId =
					ligneType === 'RETARD' ? (relatedRet ? await getRetardId(tx, relatedRet) : null) : null;

				await tx.rapportLigne.create({
					data: {
						rapportId: rpt.id,
						type: ligneType,
						eleveId: rpt.eleveId,
						date: new Date(`2025-10-${String(randBetween(1, 28)).padStart(2, '0')}T10:00:00`),
						motif: 'Simulation',
						absenceId: absId,
						retardId: retId
					}
				});
				nbRapportLignes++;
			}

			async function getAbsenceId(
				txx: typeof tx,
				data: { eleveId: string; date: Date; motif: string }
			): Promise<string | null> {
				const abs = await txx.absence.findFirst({
					where: { eleveId: data.eleveId, date: data.date, motif: data.motif },
					select: { id: true }
				});
				return abs?.id || null;
			}

			async function getRetardId(
				txx: typeof tx,
				data: { eleveId: string; date: Date; duree: string; motif: string }
			): Promise<string | null> {
				const ret = await txx.retard.findFirst({
					where: { eleveId: data.eleveId, date: data.date, duree: data.duree, motif: data.motif },
					select: { id: true }
				});
				return ret?.id || null;
			}

			for (const cl of classes) {
				const existingEdt = await tx.emploiDuTemps.findFirst({
					where: { classeId: cl.id, anneeId: annee.id }
				});
				const edt =
					existingEdt ||
					(await tx.emploiDuTemps.create({ data: { classeId: cl.id, anneeId: annee.id } }));

				const coursClasse = cours.filter((c) => c.classeId === cl.id);
				const existingSeances = await tx.seanceEDT.findMany({
					where: { edtId: edt.id },
					select: { coursId: true, jour: true, heureDebut: true }
				});

				for (let j = 0; j < JOURS.length; j++) {
					const cr = coursClasse[j % coursClasse.length];
					if (!cr) continue;
					const h = HORAIRES[j % HORAIRES.length];
					const alreadyExists = existingSeances.some(
						(s) => s.coursId === cr.id && s.jour === JOURS[j] && s.heureDebut === h.debut
					);
					if (alreadyExists) continue;

					await tx.seanceEDT.create({
						data: {
							jour: JOURS[j],
							heureDebut: h.debut,
							heureFin: h.fin,
							edtId: edt.id,
							coursId: cr.id
						}
					});
				}
			}

			for (let p = 0; p < Math.min(8, classes.length); p++) {
				const classe = classes[p];
				const coursClasse = cours.filter((c) => c.classeId === classe.id);
				const cr = coursClasse[p % coursClasse.length];
				if (!cr) continue;
				const heuresPrevues = randBetween(1, 4);
				await tx.pointage.create({
					data: {
						coursId: cr.id,
						classeId: classe.id,
						professeurId: cr.professeurId,
						anneeId: annee.id,
						heuresPrevues: heuresPrevues,
						heuresEffectuees: parseFloat((heuresPrevues - randBetween(0, 2) * 0.5).toFixed(1)),
						causeIncomplet: 'Retard du professeur'
					}
				});
			}

			let nbNotifications = 0;
			for (let n = 0; n < 15; n++) {
				await tx.notification.create({
					data: {
						title: [
							'Nouvelle note',
							'Absence détectée',
							'Examen à venir',
							'Incident signalé',
							'Rapport généré'
						][randBetween(0, 4)],
						description: `Notification de simulation #${n + 1}`,
						time: new Date().toLocaleTimeString('fr-FR'),
						read: Math.random() > 0.5,
						scope: 'ALL',
						actionType: 'simulation'
					}
				});
				nbNotifications++;
			}

			for (const e of eleves) {
				const absencesEleve = absencesData.filter((a) => a.eleveId === e.id);
				if (absencesEleve.length >= 2) {
					await tx.notification.create({
						data: {
							title: "Seuil d'absences atteint",
							description: `${e.name} ${e.lastname} a atteint le seuil d'absences (${absencesEleve.length})`,
							time: new Date().toLocaleTimeString('fr-FR'),
							read: false,
							scope: 'ADMIN',
							actionType: 'absence'
						}
					});
					nbNotifications++;
				}
			}

			const allNotes = await tx.note.findMany({
				where: {
					coursId: { in: cours.map((c) => c.id) },
					eleveId: { in: eleves.map((e) => e.id) }
				},
				select: { eleveId: true, valeur: true }
			});

			for (const e of eleves) {
				const notesEleve = allNotes.filter((n) => n.eleveId === e.id);
				const notesPos = notesEleve.filter((n) => n.valeur >= 10).length;
				const notesNeg = notesEleve.filter((n) => n.valeur < 10).length;
				const absencesEleveCount = absencesData.filter((a) => a.eleveId === e.id).length;
				const incidentsEleveCount = incidentData.filter((i) => i.eleveId === e.id).length;
				const coursSuivis = cours.filter((c) => c.eleves.includes(e.id)).length;

				await tx.eleve.update({
					where: { id: e.id },
					data: {
						notesPositives: notesPos,
						notesNegatives: notesNeg,
						incidentsCount: incidentsEleveCount,
						coursTermines: coursSuivis
					}
				});

				if (absencesEleveCount >= 3) {
					const surveillant = surveillants[0];
					if (surveillant?.compteId) {
						const existingAbsCount = await tx.absence.count({
							where: { eleveId: e.id, justifie: false }
						});
						if (existingAbsCount >= 3) {
							await tx.notification.create({
								data: {
									title: 'Convocation parentale',
									description: `${e.name} ${e.lastname} - ${existingAbsCount} absences injustifiées`,
									time: new Date().toLocaleTimeString('fr-FR'),
									read: false,
									scope: 'ADMIN',
									actionType: 'convocation'
								}
							});
							nbNotifications++;
						}
					}
				}
			}

			const totalCours = cours.length;
			for (let i = 0; i < professeurs.length; i++) {
				const nb = cours.filter((c) => c.professeurId === professeurs[i].id).length;
				await tx.professeur.update({
					where: { id: professeurs[i].id },
					data: { nbCours: nb }
				});
			}

			return {
				anneeScolaire: { id: annee.id, nom: annee.nom },
				matieres: matieresCreated,
				professeurs: professeurs.map((p) => ({ id: p.id, matieres: p.matieres })),
				surveillants: surveillants.map((s) => ({ id: s.id, compteId: s.compteId })),
				personnels: personnels.length,
				operateurs: operateurs.length,
				classes: classes.map((c) => ({ id: c.id, nom: c.nom, niveau: c.niveau, serie: c.serie })),
				eleves: eleves.map((e) => ({ id: e.id, nom: e.name, prenom: e.lastname, im: e.im })),
				inscriptions: inscriptions.length,
				cours: cours.map((c) => ({
					id: c.id,
					matiere: c.matiereNom,
					professeurId: c.professeurId,
					classeId: c.classeId
				})),
				examens: examens.map((e) => ({
					id: e.id,
					nom: e.nom,
					classeId: e.classeId,
					matiereId: e.matiereId,
					sousExamens: e.sousExamens.length
				})),
				notes: {
					regular: regularNotesData.length,
					exam: nbExamNotesNew,
					total: allNotes.length
				},
				absences: nbAbsences,
				retards: nbRetards,
				seancesCours: nbSeancesCours,
				presences: nbPresences,
				incidents: nbIncidents,
				rapports: nbRapports,
				rapportLignes: nbRapportLignes,
				emploisDuTemps: classes.length,
				pointages: Math.min(8, classes.length),
				notifications: nbNotifications,
				totalCours
			};
		});

		return json({ success: true, data: result });
	} catch (e) {
		console.error('Test simulation error:', e);
		throw error(
			500,
			(e as Error).message || 'Erreur lors de la génération des données de simulation'
		);
	}
}

export const GET: RequestHandler = async (event: RequestEvent) => {
	return runSimulation(event);
};

export const POST: RequestHandler = async (event: RequestEvent) => {
	return runSimulation(event);
};
