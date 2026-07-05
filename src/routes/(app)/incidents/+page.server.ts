import type { PageServerLoad, Actions } from './$types';
import { getIncidents, getEleves, prisma } from '$lib/server/prisma';
import type { Incident, IncidentType } from '$lib/types/Incident.type';
import { fail, redirect } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';


function mapIncident(prismaIncident: any): Incident {
	return {
		id: prismaIncident.id,
		eleveId: prismaIncident.eleveId,
		eleveNom: prismaIncident.eleve?.personne?.lastname || '',
		elevePrenom: prismaIncident.eleve?.personne?.name || '',
		type: prismaIncident.type.toLowerCase() as IncidentType,
		message: prismaIncident.message,
		auteur: prismaIncident.auteur,
		date: prismaIncident.date.toISOString(),
		reactions: prismaIncident.reactions.map((r: any) => ({ emoji: r.emoji, user: r.user })),
		comments: prismaIncident.comments.map((c: any) => ({
			id: c.id,
			author: c.author,
			text: c.text,
			date: c.date.toISOString()
		}))
	};
}

export const load: PageServerLoad = async () => {
	const incidents = await getIncidents();
	const elevesRaw = await getEleves();
	const eleves = elevesRaw.map(e => ({
		id: e.id,
		nom: e.personne.lastname,
		prenom: e.personne.name
	}));
	return { incidents: incidents.map(mapIncident), eleves };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();
		const eleveId = data.get('eleveId') as string;
		const type = data.get('type') as string;
		const message = data.get('message') as string;
		const author = locals.user?.prenom || 'Admin';

		if (!eleveId || !type || !message?.trim()) {
			return fail(400, { error: 'Champs requis manquants' });
		}

		const validTypes = ['INFO', 'ERREUR', 'NOTE', 'ABSENT'];
		if (!validTypes.includes(type)) {
			return fail(400, { error: 'Type invalide' });
		}

		try {
			await prisma.incident.create({
				data: {
					eleveId,
					type: type as any,
					message: message.trim(),
					auteur: author
				}
			});
		} catch (error) {
			return fail(500, { error: 'Erreur lors de la création' });
		}

		logActivity(locals.user, 'creation_incident', `Création d'un incident de type ${type}`).catch(() => {});

		throw redirect(303, '/incidents');
	},

	comment: async ({ request, locals }) => {
		const data = await request.formData();
		const incidentId = data.get('incidentId') as string;
		const text = data.get('text') as string;
		const author = locals.user?.prenom || 'Admin';

		if (!incidentId || !text?.trim()) {
			return fail(400, { error: 'Champs requis manquants' });
		}

		try {
			await prisma.comment.create({
				data: {
					incidentId,
					author,
					text: text.trim()
				}
			});
		} catch (error) {
			return fail(500, { error: 'Erreur lors de l\'ajout du commentaire' });
		}

		logActivity(locals.user, 'creation_incident', 'Ajout d\'un commentaire sur un incident').catch(() => {});

		throw redirect(303, '/incidents');
	},

	reaction: async ({ request, locals }) => {
		const data = await request.formData();
		const incidentId = data.get('incidentId') as string;
		const emoji = data.get('emoji') as string;
		const user = locals.user?.prenom || 'Admin';

		if (!incidentId || !emoji) {
			return fail(400, { error: 'Champs requis manquants' });
		}

		try {
			await prisma.reaction.create({
				data: {
					incidentId,
					emoji,
					user
				}
			});
		} catch (error) {
			return fail(500, { error: 'Erreur lors de l\'ajout de la réaction' });
		}

		logActivity(locals.user, 'creation_incident', 'Ajout d\'une réaction sur un incident').catch(() => {});

		throw redirect(303, '/incidents');
	}
};