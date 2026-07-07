import type { PageServerLoad, Actions } from './$types';
import { getIncidents, getEleves, prisma } from '$lib/server/prisma';
import type { Incident, IncidentType } from '$lib/types/Incident.type';
import type { Prisma } from '@prisma/client';
import { fail, redirect } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';


function mapIncident(prismaIncident: Prisma.IncidentGetPayload<{
	include: { eleve: { include: { personne: true } }; reactions: true; comments: true }
}>): Incident {
	return {
		id: prismaIncident.id,
		eleveId: prismaIncident.eleveId,
		eleveNom: prismaIncident.eleve?.personne?.lastname || '',
		elevePrenom: prismaIncident.eleve?.personne?.name || '',
		type: prismaIncident.type.toLowerCase() as IncidentType,
		message: prismaIncident.message,
		auteur: prismaIncident.auteur,
		auteurId: prismaIncident.compteId || undefined,
		date: prismaIncident.date.toISOString(),
		reactions: prismaIncident.reactions.map((r) => ({ emoji: r.emoji, user: r.user })),
		comments: prismaIncident.comments.map((c) => ({
			id: c.id,
			author: c.author,
			text: c.text,
			date: c.date.toISOString()
		}))
	};
}

type EleveInfo = {
	id: string;
	nom: string;
	prenom: string;
	classe: string;
	dateNaissance: string;
};

export const load: PageServerLoad = async ({ locals }) => {
	const incidents = await getIncidents();
	const elevesRaw = await getEleves();
	const eleves: EleveInfo[] = elevesRaw.map(e => ({
		id: e.id,
		nom: e.personne.lastname,
		prenom: e.personne.name,
		classe: e.inscriptions?.find(i => i.actif)?.classe?.nom || '',
		dateNaissance: e.dateNaissance?.toISOString().split('T')[0] || ''
	}));
	return { incidents: incidents.map(mapIncident), eleves, currentUserId: locals.user?.userId };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();
		console.log('Form Data:', Object.fromEntries(data.entries()));
		const eleveId = data.get('eleveId') as string;
		const type = (data.get('type') as string)?.toUpperCase();
		const message = data.get('message') as string;
		const author = locals.user?.prenom || 'Admin';
		const compteId = locals.user?.userId;

		if (!eleveId || !type || !message?.trim()) {
			return fail(400, { error: 'Champs requis manquants' });
		}

		const validTypes = ['INFO', 'ERREUR', 'NOTE', 'ABSENT'] as const;
		if (!validTypes.includes(type as typeof validTypes[number])) {
			return fail(400, { error: 'Type invalide' });
		}

		try {
			await prisma.$transaction(async (tx) => {
				await tx.incident.create({
					data: {
						eleveId,
						type: type as typeof validTypes[number],
						message: message.trim(),
						auteur: author,
						compteId: compteId || null
					}
				});

				const updateData: { incidentsCount?: number; notesPositives?: number; notesNegatives?: number } = {
					incidentsCount: { increment: 1 }
				};

				if (type === 'NOTE') {
					updateData.notesPositives = { increment: 1 };
				} else if (type === 'ERREUR') {
					updateData.notesNegatives = { increment: 1 };
				}

				await tx.eleve.update({
					where: { id: eleveId },
					data: updateData
				});
			});
		} catch (e: unknown) {
			console.error('Create incident error:', e);
			return fail(500, { error: 'Erreur lors de la création' });
		}

		logActivity(locals.user, 'creation_incident', `Création d'un incident de type ${type}`).catch(() => {});

		throw redirect(303, '/incidents');
	},

	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const incidentId = data.get('incidentId') as string;

		if (!incidentId) {
			return fail(400, { error: 'ID de l\'incident requis' });
		}

		try {
			const incident = await prisma.incident.findUnique({
				where: { id: incidentId }
			});

			if (!incident) {
				return fail(404, { error: 'Incident introuvable' });
			}

			if (incident.compteId && incident.compteId !== locals.user?.userId) {
				return fail(403, { error: 'Seul l\'auteur peut supprimer cet incident' });
			}

			await prisma.$transaction(async (tx) => {
				await tx.incident.delete({ where: { id: incidentId } });

				const updateData: { incidentsCount?: number; notesPositives?: number; notesNegatives?: number } = {
					incidentsCount: { decrement: 1 }
				};

				if (incident.type === 'NOTE') {
					updateData.notesPositives = { decrement: 1 };
				} else if (incident.type === 'ERREUR') {
					updateData.notesNegatives = { decrement: 1 };
				}

				await tx.eleve.update({
					where: { id: incident.eleveId },
					data: updateData
				});
			});

			logActivity(locals.user, 'suppression_incident', `Suppression d'un incident: ${incident.message.substring(0, 50)}...`).catch(() => {});
		} catch (e: unknown) {
			console.error('Delete incident error:', e);
			return fail(500, { error: 'Erreur lors de la suppression' });
		}

		throw redirect(303, '/incidents');
	},

	comment: async ({ request, locals }) => {
		const data = await request.formData();
		const incidentId = data.get('incidentId') as string;
		const text = data.get('text') as string;
		const author = locals.user?.prenom || 'Admin';
		console.log('Comment action called with:', { incidentId, text, author });

		if (!incidentId || !text?.trim()) {
			return fail(400, { error: 'Champs requis manquants' });
		}

		try {
			const comment = await prisma.comment.create({
				data: {
					incidentId,
					author,
					text: text.trim()
				}
			});
			console.log('Comment created:', comment);
		} catch (e: unknown) {
			console.error('Comment error:', e);
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
		} catch (e: unknown) {
			console.error('Reaction error:', e);
			return fail(500, { error: 'Erreur lors de l\'ajout de la réaction' });
		}

		logActivity(locals.user, 'creation_incident', 'Ajout d\'une réaction sur un incident').catch(() => {});

		throw redirect(303, '/incidents');
	}
};