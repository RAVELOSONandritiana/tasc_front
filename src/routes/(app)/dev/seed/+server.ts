import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { hashPassword } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';

export const POST: RequestHandler = async () => {
	try {
		const result = await prisma.$transaction(async (tx) => {
			const annee = await tx.anneeScolaire.create({
				data: { nom: '2025-2026', active: true }
			});

			const matiereMath = await tx.matiere.create({
				data: { nom: 'Mathématiques', couleur: '#3b82f6', icone: '📐', anneeId: annee.id }
			});
			const matiereFrancais = await tx.matiere.create({
				data: { nom: 'Français', couleur: '#ef4444', icone: '📖', anneeId: annee.id }
			});
			const matierePhysique = await tx.matiere.create({
				data: { nom: 'Physique', couleur: '#8b5cf6', icone: '⚛️', anneeId: annee.id }
			});
			const matiereHistoire = await tx.matiere.create({
				data: { nom: 'Histoire', couleur: '#f59e0b', icone: '🏛️', anneeId: annee.id }
			});

			const classe2ndeA = await tx.classe.create({
				data: { nom: '2nde A', niveau: 2, serie: 'A', anneeId: annee.id, elevesCount: 0 }
			});
			const classe1ereA = await tx.classe.create({
				data: { nom: '1ère A', niveau: 1, serie: 'A', anneeId: annee.id, elevesCount: 0 }
			});
			const classeTerminaleA = await tx.classe.create({
				data: { nom: 'Terminale A', niveau: 0, serie: 'A', anneeId: annee.id, elevesCount: 0 }
			});

			const personneProf1 = await tx.personne.create({
				data: { name: 'Jean', lastname: 'Dupont', email: 'jean.dupont@tasc.mg', phone: '+261340000001', domicile: 'Antananarivo', fokontany: 'Analakely', commune: 'Antananarivo' }
			});
			const compteProf1 = await tx.compte.create({
				data: { matricule: 'ENS-001', password: await hashPassword('123456'), role: 'ENSEIGNANT', statut: 'ACTIF', personneId: personneProf1.id }
			});
			const professeur1 = await tx.professeur.create({
				data: { personneId: personneProf1.id, matiere: ['Mathématiques', 'Physique'], nbCours: 3, retards: 1, absences: 0, incidents: 0, notesPositives: 5, notesNegatives: 1 }
			});

			const personneProf2 = await tx.personne.create({
				data: { name: 'Marie', lastname: 'Rakoto', email: 'marie.rakoto@tasc.mg', phone: '+261340000002', domicile: 'Antananarivo', fokontany: 'Isotry', commune: 'Antananarivo' }
			});
			const compteProf2 = await tx.compte.create({
				data: { matricule: 'ENS-002', password: await hashPassword('123456'), role: 'ENSEIGNANT', statut: 'ACTIF', personneId: personneProf2.id }
			});
			const professeur2 = await tx.professeur.create({
				data: { personneId: personneProf2.id, matiere: ['Français', 'Histoire'], nbCours: 2, retards: 0, absences: 1, incidents: 0, notesPositives: 3, notesNegatives: 0 }
			});

			const personneSurv = await tx.personne.create({
				data: { name: 'Paul', lastname: 'Rabe', email: 'paul.rabe@tasc.mg', phone: '+261340000003', domicile: 'Antananarivo', fokontany: 'Anosy', commune: 'Antananarivo' }
			});
			const compteSurv = await tx.compte.create({
				data: { matricule: 'SRV-001', password: await hashPassword('123456'), role: 'SURVEILLANT', statut: 'ACTIF', personneId: personneSurv.id }
			});
			const surveillant = await tx.surveillant.create({
				data: { personneId: personneSurv.id, poste: 'Surveillant Général', nbCours: 1, retards: 0, absences: 0, incidents: 0, notesPositives: 2, notesNegatives: 0 }
			});

			const personnePers = await tx.personne.create({
				data: { name: 'Claire', lastname: 'Njaratiana', email: 'claire.njaratiana@tasc.mg', phone: '+261340000004', domicile: 'Antananarivo', fokontany: '67Ha', commune: 'Antananarivo' }
			});
			const comptePers = await tx.compte.create({
				data: { matricule: 'PRS-001', password: await hashPassword('123456'), role: 'PERSONNEL', statut: 'ACTIF', personneId: personnePers.id }
			});
			await tx.personnel.create({ data: { personneId: personnePers.id, poste: 'Secrétaire' } });

			const eleves = [];
			const eleveData = [
				{ name: 'Lucas', lastname: 'Andrianirina', im: 'IM001', sexe: 'G', redoublant: false },
				{ name: 'Emma', lastname: 'Rasoa', im: 'IM002', sexe: 'F', redoublant: false },
				{ name: 'Thomas', lastname: 'Rakotondraibe', im: 'IM003', sexe: 'G', redoublant: true },
				{ name: 'Julie', lastname: 'Ramanantsoa', im: 'IM004', sexe: 'F', redoublant: false },
				{ name: 'Nicolas', lastname: 'Randrianarisoa', im: 'IM005', sexe: 'G', redoublant: false },
				{ name: 'Sophie', lastname: 'Ravoarijaona', im: 'IM006', sexe: 'F', redoublant: false }
			];

			for (const ed of eleveData) {
				const personne = await tx.personne.create({
					data: { name: ed.name, lastname: ed.lastname, email: `${ed.name.toLowerCase()}.${ed.lastname.toLowerCase()}@eleve.mg`, phone: `+2613400000${eleves.length + 10}`, domicile: 'Antananarivo', fokontany: 'Centre', commune: 'Antananarivo' }
				});
				const eleve = await tx.eleve.create({
					data: {
						personneId: personne.id,
						dateNaissance: new Date('2008-01-15'),
						im: ed.im,
					sexe: ed.sexe,
					redoublant: ed.redoublant,
					situation: ed.redoublant ? 'R' : 'P',
					cin: '123456789012',
						lieuNaissance: 'ANTANANARIVO',
						communeNaissance: 'ANTANANARIVO',
						regionNaissance: 'ANALAMANGA',
						coursTermines: Math.floor(Math.random() * 10) + 1
					}
				});
				eleves.push({ id: eleve.id, personneId: personne.id, name: ed.name, lastname: ed.lastname });
			}

			const inscriptions = [];
			for (let i = 0; i < 3; i++) {
				const ins = await tx.inscription.create({
					data: { eleveId: eleves[i].id, classeId: classe2ndeA.id, anneeId: annee.id, actif: true }
				});
				inscriptions.push(ins);
			}
			for (let i = 3; i < 6; i++) {
				const ins = await tx.inscription.create({
					data: { eleveId: eleves[i].id, classeId: classe1ereA.id, anneeId: annee.id, actif: true }
				});
				inscriptions.push(ins);
			}

			await tx.classe.update({ where: { id: classe2ndeA.id }, data: { elevesCount: 3 } });
			await tx.classe.update({ where: { id: classe1ereA.id }, data: { elevesCount: 3 } });

			const coursMath2ndeA = await tx.cours.create({
				data: { classeId: classe2ndeA.id, matiereId: matiereMath.id, professeurId: professeur1.id, anneeId: annee.id, coefficient: 3, participants: [eleves[0].id, eleves[1].id, eleves[2].id] }
			});
			const coursFrancais2ndeA = await tx.cours.create({
				data: { classeId: classe2ndeA.id, matiereId: matiereFrancais.id, professeurId: professeur2.id, anneeId: annee.id, coefficient: 2, participants: [eleves[0].id, eleves[1].id, eleves[2].id] }
			});
			const coursPhysique1ereA = await tx.cours.create({
				data: { classeId: classe1ereA.id, matiereId: matierePhysique.id, professeurId: professeur1.id, anneeId: annee.id, coefficient: 3, participants: [eleves[3].id, eleves[4].id, eleves[5].id] }
			});
			const coursHistoire1ereA = await tx.cours.create({
				data: { classeId: classe1ereA.id, matiereId: matiereHistoire.id, professeurId: professeur2.id, anneeId: annee.id, coefficient: 2, participants: [eleves[3].id, eleves[4].id, eleves[5].id] }
			});

			const edt2ndeA = await tx.emploiDuTemps.create({
				data: { classeId: classe2ndeA.id, anneeId: annee.id }
			});
			const edt1ereA = await tx.emploiDuTemps.create({
				data: { classeId: classe1ereA.id, anneeId: annee.id }
			});

			const seanceEdt1 = await tx.seanceEDT.create({
				data: { jour: 'LUNDI', heureDebut: '08:00', heureFin: '10:00', edtId: edt2ndeA.id, coursId: coursMath2ndeA.id, salleId: null }
			});
			const seanceEdt2 = await tx.seanceEDT.create({
				data: { jour: 'MARDI', heureDebut: '10:00', heureFin: '12:00', edtId: edt1ereA.id, coursId: coursPhysique1ereA.id, salleId: null }
			});

			const seanceCours1 = await tx.seanceCours.create({
				data: { coursId: coursMath2ndeA.id, professeurId: professeur1.id, anneeId: annee.id, statut: 'TERMINE', dateDebut: new Date('2025-10-01T08:00:00'), dateFin: new Date('2025-10-01T10:00:00') }
			});
			const seanceCours2 = await tx.seanceCours.create({
				data: { coursId: coursFrancais2ndeA.id, professeurId: professeur2.id, anneeId: annee.id, statut: 'EN_COURS', dateDebut: new Date('2025-10-02T10:00:00') }
			});

			await tx.presenceEleve.createMany({
				data: [
					{ seanceId: seanceCours1.id, eleveId: eleves[0].id, inscriptionId: inscriptions[0].id, statut: 'PRESENT', heureMarquage: new Date('2025-10-01T08:05:00') },
					{ seanceId: seanceCours1.id, eleveId: eleves[1].id, inscriptionId: inscriptions[1].id, statut: 'PRESENT', heureMarquage: new Date('2025-10-01T08:05:00') },
					{ seanceId: seanceCours1.id, eleveId: eleves[2].id, inscriptionId: inscriptions[2].id, statut: 'ABSENT', heureMarquage: new Date('2025-10-01T08:00:00') }
				]
			});

			const examen1 = await tx.examen.create({
				data: { nom: 'Devoir 1', date: new Date('2025-10-15'), periode: '1er trimestre', classeId: classe2ndeA.id, anneeId: annee.id }
			});
			const sousExamen1 = await tx.sousExamen.create({
				data: { examenId: examen1.id, nom: 'Partie A' }
			});
			await tx.note.createMany({
				data: [
					{ valeur: 16, coefficient: 2, eleveId: eleves[0].id, coursId: coursMath2ndeA.id, examenId: examen1.id, sousExamenId: sousExamen1.id, inscriptionId: inscriptions[0].id },
					{ valeur: 12, coefficient: 2, eleveId: eleves[1].id, coursId: coursMath2ndeA.id, examenId: examen1.id, sousExamenId: sousExamen1.id, inscriptionId: inscriptions[1].id },
					{ valeur: 9, coefficient: 2, eleveId: eleves[2].id, coursId: coursMath2ndeA.id, examenId: examen1.id, sousExamenId: sousExamen1.id, inscriptionId: inscriptions[2].id }
				]
			});

			await tx.absence.create({
				data: { eleveId: eleves[2].id, inscriptionId: inscriptions[2].id, date: new Date('2025-10-01'), justifie: false }
			});
			await tx.retard.create({
				data: { eleveId: eleves[0].id, inscriptionId: inscriptions[0].id, date: new Date('2025-10-02'), duree: '10min', justifie: false }
			});

			const incident = await tx.incident.create({
				data: { type: 'NOTE', message: 'Comportement exemplaire', auteur: 'Jean Dupont', eleveId: eleves[0].id, anneeId: annee.id, inscriptionId: inscriptions[0].id }
			});

			const rapport = await tx.rapport.create({
				data: { type: 'RETARD', message: 'Retard de 10min', auteur: 'Paul Rabe', compteId: compteSurv.id, eleveId: eleves[0].id, inscriptionId: inscriptions[0].id, anneeId: annee.id }
			});
			await tx.rapportLigne.create({
				data: { rapportId: rapport.id, type: 'RETARD', eleveId: eleves[0].id, date: new Date('2025-10-02'), retardId: undefined }
			});

			await tx.professeur.update({ where: { id: professeur1.id }, data: { nbCours: 3 } });
			await tx.professeur.update({ where: { id: professeur2.id }, data: { nbCours: 2 } });
			await tx.surveillant.update({ where: { id: surveillant.id }, data: { nbCours: 1 } });

			return {
				anneeScolaire: { id: annee.id, nom: annee.nom },
				classes: [classe2ndeA, classe1ereA, classeTerminaleA].map(c => ({ id: c.id, nom: c.nom })),
				matieres: [matiereMath, matiereFrancais, matierePhysique, matiereHistoire].map(m => ({ id: m.id, nom: m.nom })),
				professeurs: [professeur1, professeur2].map(p => ({ id: p.id, nbCours: p.nbCours })),
				surveillant: { id: surveillant.id, nbCours: surveillant.nbCours },
				eleves: eleves.map(e => ({ id: e.id, name: e.name, lastname: e.lastname })),
				cours: [coursMath2ndeA, coursFrancais2ndeA, coursPhysique1ereA, coursHistoire1ereA].map(c => ({ id: c.id })),
				seancesEdt: [seanceEdt1, seanceEdt2].map(s => ({ id: s.id })),
				seancesCours: [seanceCours1, seanceCours2].map(s => ({ id: s.id })),
				examen: { id: examen1.id },
				incident: { id: incident.id },
				rapport: { id: rapport.id }
			};
		});

		return json({ success: true, data: result });
	} catch (e) {
		console.error('Seed error:', e);
		return fail(500, { error: (e as Error).message || 'Erreur lors du seed' });
	}
};
