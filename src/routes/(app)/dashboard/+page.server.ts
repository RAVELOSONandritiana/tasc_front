import type { PageServerLoad } from './$types';
import { getEleves, getProfesseurs, getSurveillants, getClasses, getIncidents, getNotifications, getActiveAnneeScolaire, prisma } from '$lib/server/prisma';
import { formatClasseNom } from '$lib/utils';
import { fail } from '@sveltejs/kit';

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

	const [eleves, profs, surveillants, classes, incidents, notifications] = await Promise.all([
		anneeId ? getEleves(anneeId) : Promise.resolve([]),
		getProfesseurs(),
		getSurveillants(),
		anneeId ? getClasses(anneeId) : Promise.resolve([]),
		anneeId ? getIncidents(anneeId, rangeStart, rangeEnd) : Promise.resolve([]),
		getNotifications()
	]);

	const stats = {
		eleves: eleves.length,
		professeurs: profs.length,
		surveillants: surveillants.length,
		classes: classes.length,
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

	const activites = await prisma.activite.findMany({
		where: {
			action: 'creation_incident',
			createdAt: { gte: rangeStart, lte: rangeEnd }
		},
		select: { createdAt: true },
		orderBy: { createdAt: 'asc' }
	});

	const inscriptions = await prisma.inscription.findMany({
		where: anneeId ? { anneeId, actif: true } : { actif: true },
		include: {
			classe: { select: { id: true, nom: true, niveau: true, serie: true } },
			eleve: { include: { personne: true } },
			absences: { where: { date: { gte: rangeStart, lte: rangeEnd } } },
			retards: { where: { date: { gte: rangeStart, lte: rangeEnd } } },
			notes: { where: { date: { gte: rangeStart, lte: rangeEnd } } }
		}
	});

	const allAbsenceIds = inscriptions.flatMap((i) => i.absences.map((a) => a.id));
	const allRetardIds = inscriptions.flatMap((i) => i.retards.map((r) => r.id));
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
	const justifiedRetardIds = new Set(
		lignesJustifiees.filter((l) => l.retardId).map((l) => l.retardId as string)
	);

	const unjustifiedAbsencesList = inscriptions.flatMap((ins) =>
		ins.absences
			.filter((a) => !justifiedAbsenceIds.has(a.id))
			.map((a) => ({
				id: a.id,
				eleveNom: ins.eleve?.personne?.lastname || '',
				elevePrenom: ins.eleve?.personne?.name || '',
				classe: formatClasseNom(ins.classe?.niveau, ins.classe?.nom),
				date: a.date.toISOString()
			}))
	);

	const allAbsences = inscriptions.flatMap((i) => i.absences);
	const allRetards = inscriptions.flatMap((i) => i.retards);

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

	const incidentsByDay = countByDayKey(activites);
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

	const absentsCount = inscriptions.filter((i) => i.absences && i.absences.length > 0).length;
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

	const delaysByClass = inscriptions.reduce(
		(acc, ins) => {
			const count = ins.retards?.length || 0;
			if (count > 0) {
				const className = formatClasseNom(ins.classe?.niveau, ins.classe?.nom) || 'Inconnue';
				const existing = acc.find((a) => a.className === className);
				if (existing) existing.count += count;
				else acc.push({ className, count });
			}
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
			{ role: 'Surveillants', count: surveillants.length, color: '#f59e0b' }
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
		incidentsByClass
	};

	return {
		stats,
		classes,
		chartData,
		additionalStats,
		unjustifiedAbsencesList,
		anneeStart: anneeStartISO,
		todayISO,
		rangeStart: toISODate(rangeStart),
		rangeEnd: toISODate(rangeEnd)
	};
};
