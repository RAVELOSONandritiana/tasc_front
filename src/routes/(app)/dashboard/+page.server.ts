import type { PageServerLoad } from './$types';
import { getEleves, getProfesseurs, getSurveillants, getClasses, getIncidents, getNotifications, getActiveAnneeScolaire, prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async () => {
	const annee = await getActiveAnneeScolaire();
	const anneeId = annee?.id;

	const [eleves, profs, surveillants, classes, incidents, notifications] = await Promise.all([
		anneeId ? getEleves(anneeId) : Promise.resolve([]),
		getProfesseurs(),
		getSurveillants(),
		anneeId ? getClasses(anneeId) : Promise.resolve([]),
		anneeId ? getIncidents(anneeId) : Promise.resolve([]),
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

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const weekAgo = new Date(today);
	weekAgo.setDate(weekAgo.getDate() - 7);

	const incidentsTrend = await prisma.activite.findMany({
		where: {
			action: 'creation_incident',
			createdAt: { gte: weekAgo }
		},
		select: {
			createdAt: true
		},
		orderBy: { createdAt: 'asc' }
	});

	const incidentsByDay = incidentsTrend.reduce((acc, a) => {
		const day = a.createdAt.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
		acc[day] = (acc[day] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const last7Days = [];
	for (let i = 6; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
		last7Days.push({
			date: dayLabel,
			count: incidentsByDay[dayLabel] || 0
		});
	}

	const inscriptions = await prisma.inscription.findMany({
		where: anneeId ? { anneeId, actif: true } : { actif: true },
		include: {
			classe: { select: { id: true, nom: true, niveau: true, serie: true } },
			absences: { where: { date: { gte: weekAgo } } },
			retards: { where: { date: { gte: weekAgo } } }
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
			const className = ins.classe?.nom || 'Inconnue';
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
		const className = ins.classe?.nom || 'Inconnue';
		const existing = acc.find(c => c.className === className);
		if (existing) {
			existing.count += 1;
		} else {
			acc.push({ className, count: 1 });
		}
		return acc;
	}, [] as { className: string; count: number }[]);

	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);
	const teacherAbsences = await prisma.absence.count({
		where: {
			date: { gte: todayStart }
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
		incidentsTrend: last7Days,
		teacherAbsences,
		classSizes
	};

	return { stats, classes, chartData };
};
