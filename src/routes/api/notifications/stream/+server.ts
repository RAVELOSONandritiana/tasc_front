import type { RequestHandler } from './$types';
import { subscribe, canSeeNotification } from '$lib/server/notifications';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const role = locals.user.role;

	let unsubscribe: (() => void) | null = null;
	let heartbeat: ReturnType<typeof setInterval> | null = null;

	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();
			const send = (event: string, data: unknown) => {
				try {
					controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
				} catch {
					// controller already closed
				}
			};

			// Initial comment to open the stream immediately.
			controller.enqueue(encoder.encode(': connected\n\n'));

			unsubscribe = subscribe((notif) => {
				if (canSeeNotification(notif.scope, role)) {
					send('notification', notif);
				}
			});

			// Keep the connection alive through proxies.
			heartbeat = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(': ping\n\n'));
				} catch {
					// ignore
				}
			}, 25000);
		},
		cancel() {
			if (unsubscribe) unsubscribe();
			if (heartbeat) clearInterval(heartbeat);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive'
		}
	});
};
