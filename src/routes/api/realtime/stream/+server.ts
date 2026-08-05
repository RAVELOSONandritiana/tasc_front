import type { RequestHandler } from './$types';
import { subscribeToRealtime, canSeeRealtime } from '$lib/server/realtime';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

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

			unsubscribe = subscribeToRealtime((event) => {
				if (canSeeRealtime(event.scope ?? 'ALL', locals.user)) {
					send('realtime', event);
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
