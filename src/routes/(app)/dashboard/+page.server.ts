import type { PageServerLoad } from './$types';
import { getEleves, getProfesseurs, getSurveillants, getClasses, getIncidents, getNotifications, getActiveAnneeScolaire, prisma } from '$lib/server/prisma';
import { formatClasseNom } from '$lib/utils';

function toISODate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
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
		recentIncidents: incidents.slice(0, 5).map(i => ({
			id: i.id,
			type: i.type.toLowerCase(),
			message: i.message,
			eleveNom: i.eleve?.personne?.lastname || '',
			elevePrenom: i.eleve?.personne?.name || '',
			date: i.date.toISOString()
		})),
		recentNotifications: notifications.slice(0, 5).map(n => ({
			id: n.id,
			title: n.title,
			description: n.description,
			time: n.time
		}))
	};

	const incidentsByType = incidents.reduce((acc, i) => {
		const type = i.type.toLowerCase();
		acc[type] = (acc[type] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const incidentsTrend = await prisma.activite.findMany({
		where: {
			action: 'creation_incident',
			createdAt: { gte: rangeStart, lte: rangeEnd }
		},
		select: {
			createdAt: true
		},
		orderBy: { createdAt: 'asc' }
	});

	const countsByDay = incidentsTrend.reduce((acc, a) => {
		const key = toISODate(a.createdAt);
		acc[key] = (acc[key] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const incidentsTrendDays: { date: string; count: number; showLabel: boolean }[] = [];
	const cursor = new Date(rangeStart);
	cursor.setHours(0, 0, 0, 0);
	const endDay = new Date(rangeEnd);
	endDay.setHours(0, 0, 0, 0);
	const labelStep = Math.max(1, Math.ceil((Math.round((endDay.getTime() - cursor.getTime()) / 86400000) + 1) / 15));
	let idx = 0;
	while (cursor.getTime() <= endDay.getTime()) {
		const key = toISODate(cursor);
		incidentsTrendDays.push({
			date: cursor.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
			count: countsByDay[key] || 0,
			showLabel: idx === 0 || idx % labelStep === 0
		});
		cursor.setDate(cursor.getDate() + 1);
		idx++;
	}

	const inscriptions = await prisma.inscription.findMany({
		where: anneeId ? { anneeId, actif: true } : { actif: true },
		include: {
			classe: { select: { id: true, nom: true, niveau: true, serie: true } },
			absences: { where: { date: { gte: rangeStart, lte: rangeEnd } } },
			retards: { where: { date: { gte: rangeStart, lte: rangeEnd } } }
		}
	});

	const absences = inscriptions.filter(i => i.absences && i.absences.length > 0).length;
	const presents = inscriptions.length - absences;
	const attendanceData = [
		{ label: 'Présent', count: Math.max(presents, 0) },
		{ label: 'Absent', count: Math.max(absences, 0) }
	];

	const delaysByClass = inscriptions.reduce((acc, ins) => {
		const count = ins.retards?.length || 0;
		if (count > 0) {
			const className = formatClasseNom(ins.classe?.niveau, ins.classe?.nom) || 'Inconnue';
			const existing = acc.find(a => a.className === className);
			if (existing) {
				existing.count += count;
			} else {
				acc.push({ className, count });
			}
		}
		return acc;
	}, [] as { className: string; count: number }[]);

	const classSizes = inscriptions.reduce((acc, ins) => {
		const className = formatClasseNom(ins.classe?.niveau, ins.classe?.nom) || 'Inconnue';
		const existing = acc.find(c => c.className === className);
		if (existing) {
			existing.count += 1;
		} else {
			acc.push({ className, count: 1 });
		}
		return acc;
	}, [] as { className: string; count: number }[]);

	const teacherAbsences = await prisma.absence.count({
		where: {
			date: { gte: rangeStart, lte: rangeEnd }
		}
	});

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
		teacherAbsences,
		classSizes
	};

	return {
		stats,
		classes,
		chartData,
		anneeStart: anneeStartISO,
		todayISO,
		rangeStart: toISODate(rangeStart),
		rangeEnd: toISODate(rangeEnd)
	};
};
