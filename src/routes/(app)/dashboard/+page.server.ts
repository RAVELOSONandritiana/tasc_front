import type { PageServerLoad } from './$types';
import { getEleves, getProfesseurs, getSurveillants, getClasses, getIncidents, getNotifications, prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async () => {
	const [eleves, profs, surveillants, classes, incidents, notifications] = await Promise.all([
		getEleves(),
		getProfesseurs(),
		getSurveillants(),
		getClasses(),
		getIncidents(),
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

	return { stats, classes };
};