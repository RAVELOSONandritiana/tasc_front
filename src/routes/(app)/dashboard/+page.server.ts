import type { PageServerLoad } from './$types';
import { getEleves, getProfesseurs, getSurveillants, getClasses, getIncidents, getNotifications, getActiveAnneeScolaire, getOperateurs, prisma } from '$lib/server/prisma';
import { formatClasseNom } from '$lib/utils';

function toISODate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function countByDayKey(records: { date?: Date | null; createdAt?: Date | null }[]): Record<string, number> {
	const map: Record<string, number> = {};
	for (const r of records) {
		const d = r.date ?? r.createdAt;
		if (!d) continue;
		const key = toISODate(d);
		map[key] = (map[key] || 0) + 1;
	}
	return map;
}

export const load: PageServerLoad = async ({ url }) => {
	const annee = await getActiveAnneeScolaire();
	const anneeId = annee?.id;

	const today = new Date();
	today.setHours(23, 59, 59, 999);

	const startParam = url.searchParams.get('start');
	const endParam = url.searchParams.get('end');

	const rangeStart = startParam ? new Date(`${startParam}T00:00:00`) : new Date(annee?.dateCreation ?? 0);
	rangeStart.setHours(0, 0, 0, 0);
	const rangeEnd = endParam ? new Date(`${endParam}T00:00:00`) : today;
	rangeEnd.setHours(23, 59, 59, 999);

	const anneeStartISO = toISODate(annee?.dateCreation ?? rangeStart);
	const todayISO = toISODate(today);

	const [eleves, profs, surveillants, classes, incidents, notifications, salles, operateurs] = await Promise.all([
		anneeId ? getEleves(anneeId) : Promise.resolve([]),
		getProfesseurs(),
		getSurveillants(),
		anneeId ? getClasses(anneeId) : Promise.resolve([]),
		anneeId ? getIncidents(anneeId, rangeStart, rangeEnd) : Promise.resolve([]),
		getNotifications(),
		prisma.salle.count(),
		getOperateurs()
	]);

	const stats = {
		eleves: eleves.length,
		professeurs: profs.length,
		surveillants: surveillants.length,
		operateurs: operateurs.length,
		classes: classes.length,
		salles,
		incidents: incidents.length,
		recentIncidents: incidents.slice(0, 5).map((i) => ({
			id: i.id,
			type: i.type.toLowerCase(),
			message: i.message,
			eleveNom: i.eleve?.personne?.lastname || '',
			elevePrenom: i.eleve?.personne?.name || '',
			date: i.date.toISOString()
		})),
		recentNotifications: notifications.slice(0, 5).map((n) => ({
			id: n.id,
			title: n.title,
			description: n.description,
			time: n.time
		}))
	};

	const incidentsByType = incidents.reduce(
		(acc, i) => {
			const type = i.type.toLowerCase();
			acc[type] = (acc[type] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>
	);

	const inscriptions = await prisma.inscription.findMany({
		where: anneeId ? { anneeId, actif: true } : { actif: true },
		include: {
			classe: { select: { id: true, nom: true, niveau: true, serie: true } },
			eleve: { include: { personne: true } },
			notes: { where: { date: { gte: rangeStart, lte: rangeEnd } } }
		}
	});

	// On compte les absences/retards par eleve (et non plus seulement via la
	// relation inscription.absences) : ainsi, un pointage dont l'absence n'a
	// pas pu etre rattachee a une inscription (inscriptionId null) reste
	// visible sur le dashboard.
	const eleveIds = inscriptions.map((i) => i.eleve.id);
	const allAbsences = await prisma.absence.findMany({
		where: { eleveId: { in: eleveIds }, date: { gte: rangeStart, lte: rangeEnd } },
		include: {
			eleve: {
				include: {
					personne: true,
					inscriptions: { where: { actif: true }, include: { classe: true } }
				}
			}
		}
	});
	const allRetards = await prisma.retard.findMany({
		where: { eleveId: { in: eleveIds }, date: { gte: rangeStart, lte: rangeEnd } },
		include: { eleve: { include: { personne: true } } }
	});

	const allAbsenceIds = allAbsences.map((a) => a.id);
	const allRetardIds = allRetards.map((r) => r.id);
	const lignesJustifiees = await prisma.rapportLigne.findMany({
		where: {
			OR: [{ absenceId: { in: allAbsenceIds } }, { retardId: { in: allRetardIds } }]
		},
		select: { absenceId: true, retardId: true }
	});
	// Une absence/retard est justifiée uniquement si elle est liée à un rapport.
	const justifiedAbsenceIds = new Set(
		lignesJustifiees.filter((l) => l.absenceId).map((l) => l.absenceId as string)
	);
	const unjustifiedAbsencesList = allAbsences
		.filter((a) => !justifiedAbsenceIds.has(a.id))
		.map((a) => ({
			id: a.id,
			eleveNom: a.eleve?.personne?.lastname || '',
			elevePrenom: a.eleve?.personne?.name || '',
			classe: formatClasseNom(a.eleve?.inscriptions?.find((i) => i.actif)?.classe?.niveau, a.eleve?.inscriptions?.find((i) => i.actif)?.classe?.nom) || '',
			date: a.date.toISOString()
		})	);

	const days: { key: string; label: string; showLabel: boolean }[] = [];
	const cursor = new Date(rangeStart);
	cursor.setHours(0, 0, 0, 0);
	const endDay = new Date(rangeEnd);
	endDay.setHours(0, 0, 0, 0);
	const totalDays = Math.max(1, Math.round((endDay.getTime() - cursor.getTime()) / 86400000) + 1);
	const labelStep = Math.max(1, Math.ceil(totalDays / 15));
	let idx = 0;
	while (cursor.getTime() <= endDay.getTime()) {
		days.push({
			key: toISODate(cursor),
			label: cursor.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
			showLabel: idx === 0 || idx % labelStep === 0
		});
		cursor.setDate(cursor.getDate() + 1);
		idx++;
	}

	// La tendance des incidents est calculee a partir des incidents de l'annee
	// scolaire active (deja filtres par anneeId), et non plus a partir des
	// activites de creation qui ne portent pas l'annee scolaire.
	const incidentsByDay = countByDayKey(incidents);
	const absencesByDay = countByDayKey(allAbsences);
	const retardsByDay = countByDayKey(allRetards);

	const incidentsTrendDays = days.map((d) => ({
		date: d.label,
		count: incidentsByDay[d.key] || 0,
		showLabel: d.showLabel
	}));

	const evolution = days.map((d) => ({
		date: d.label,
		showLabel: d.showLabel,
		absences: absencesByDay[d.key] || 0,
		retards: retardsByDay[d.key] || 0,
		incidents: incidentsByDay[d.key] || 0
	}));

	const absentsCount = new Set(allAbsences.map((a) => a.eleveId)).size;
	const presentsCount = inscriptions.length - absentsCount;
	const attendanceData = [
		{ label: 'Présent', count: Math.max(presentsCount, 0) },
		{ label: 'Absent', count: Math.max(absentsCount, 0) }
	];

	const justifiedCount = allAbsences.filter((a) => justifiedAbsenceIds.has(a.id)).length;
	const unjustifiedCount = allAbsences.length - justifiedCount;
	const absenceJustification = [
		{ label: 'Justifiée', count: justifiedCount, color: '#10b981' },
		{ label: 'Non justifiée', count: unjustifiedCount, color: '#ef4444' }
	];

	const classParEleve = new Map(
		inscriptions.map((i) => [
			i.eleve.id,
			formatClasseNom(i.classe?.niveau, i.classe?.nom) || 'Inconnue'
		])
	);

	const delaysByClass = allRetards.reduce(
		(acc, r) => {
			const className = classParEleve.get(r.eleveId) || 'Inconnue';
			const existing = acc.find((a) => a.className === className);
			if (existing) existing.count += 1;
			else acc.push({ className, count: 1 });
			return acc;
		},
		[] as { className: string; count: number }[]
	);

	const classSizes = inscriptions.reduce(
		(acc, ins) => {
			const className = formatClasseNom(ins.classe?.niveau, ins.classe?.nom) || 'Inconnue';
			const existing = acc.find((c) => c.className === className);
			if (existing) existing.count += 1;
			else acc.push({ className, count: 1 });
			return acc;
		},
		[] as { className: string; count: number }[]
	);

	const notesByClass: Record<string, { sum: number; n: number }> = {};
	const notesDistribution = [
		{ range: '0-5', count: 0 },
		{ range: '5-10', count: 0 },
		{ range: '10-15', count: 0 },
		{ range: '15-20', count: 0 }
	];
	let notesSum = 0;
	let notesN = 0;
	for (const ins of inscriptions) {
		const className = formatClasseNom(ins.classe?.niveau, ins.classe?.nom) || 'Inconnue';
		for (const note of ins.notes) {
			const v = Number(note.valeur);
			if (Number.isNaN(v)) continue;
			notesSum += v;
			notesN++;
			if (v < 5) notesDistribution[0].count++;
			else if (v < 10) notesDistribution[1].count++;
			else if (v < 15) notesDistribution[2].count++;
			else notesDistribution[3].count++;
			if (!notesByClass[className]) notesByClass[className] = { sum: 0, n: 0 };
			notesByClass[className].sum += v;
			notesByClass[className].n++;
		}
	}
	const avgNotesByClass = Object.entries(notesByClass)
		.map(([className, { sum, n }]) => ({
			className,
			avg: n > 0 ? Math.round((sum / n) * 10) / 10 : 0
		}))
		.sort((a, b) => a.avg - b.avg);
	const avgNotesGeneral = notesN > 0 ? Math.round((notesSum / notesN) * 10) / 10 : 0;

	const incidentsWithClass = await prisma.incident.findMany({
		where: anneeId ? { anneeId, date: { gte: rangeStart, lte: rangeEnd } } : { date: { gte: rangeStart, lte: rangeEnd } },
		include: {
			eleve: {
				include: {
					inscriptions: {
						where: { actif: true },
						include: { classe: { select: { nom: true, niveau: true, serie: true } } }
					}
				}
			}
		}
	});
	const incidentsByClass = incidentsWithClass
		.reduce(
			(acc, inc) => {
				const classe = inc.eleve?.inscriptions?.find((i) => i.actif)?.classe;
				const className = formatClasseNom(classe?.niveau, classe?.nom) || 'Inconnue';
				const existing = acc.find((a) => a.className === className);
				if (existing) existing.count += 1;
				else acc.push({ className, count: 1 });
				return acc;
			},
			[] as { className: string; count: number }[]
		)
		.sort((a, b) => b.count - a.count);

	const teacherAbsences = allAbsences.length;

	// Activité des opérateurs : pointages de cours effectués sur la période.
	const pointagesOperateur = await prisma.pointage.findMany({
		where: { operateurId: { not: null }, date: { gte: rangeStart, lte: rangeEnd } },
		select: { operateurId: true }
	});
	const operateurNom = new Map(operateurs.map((op) => [op.id, `${op.name} ${op.lastname}`]));
	const pointagesByOperateurMap = new Map<string, number>();
	for (const p of pointagesOperateur) {
		if (!p.operateurId) continue;
		pointagesByOperateurMap.set(p.operateurId, (pointagesByOperateurMap.get(p.operateurId) || 0) + 1);
	}
	const pointagesByOperateur = [...pointagesByOperateurMap.entries()]
		.map(([id, count]) => ({ nom: operateurNom.get(id) || 'Opérateur', count }))
		.sort((a, b) => b.count - a.count);
	const totalPointagesOperateur = pointagesOperateur.length;

	const additionalStats = {
		totalAbsences: allAbsences.length,
		totalRetards: allRetards.length,
		justifiedAbsences: justifiedCount,
		unjustifiedAbsences: unjustifiedCount,
		avgNotesGeneral,
		totalNotes: notesN
	};

	const chartData = {
		incidentsByType: Object.entries(incidentsByType).map(([type, count]) => ({
			type,
			count
		})),
		usersByRole: [
			{ role: 'Élèves', count: eleves.length, color: '#3b82f6' },
			{ role: 'Enseignants', count: profs.length, color: '#10b981' },
			{ role: 'Surveillants', count: surveillants.length, color: '#f59e0b' },
			{ role: 'Opérateurs', count: operateurs.length, color: '#8b5cf6' }
		],
		attendanceData,
		delaysByClass,
		incidentsTrend: incidentsTrendDays,
		evolution,
		teacherAbsences,
		classSizes,
		absenceJustification,
		notesDistribution,
		avgNotesByClass,
		incidentsByClass,
		pointagesByOperateur,
		totalPointagesOperateur
	};

	return {
		stats,
		classes,
		chartData,
		additionalStats,
		unjustifiedAbsencesList,
		totalPointagesOperateur,
		anneeStart: anneeStartISO,
		todayISO,
		rangeStart: toISODate(rangeStart),
		rangeEnd: toISODate(rangeEnd)
	};
};
