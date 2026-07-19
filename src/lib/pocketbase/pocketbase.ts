import { env } from '$env/dynamic/public';

import PocketBase from 'pocketbase';

const pb = new PocketBase(env.PUBLIC_POCKET_BASE_URL);

export async function auth() {
	try {
		await pb.admins.authWithPassword(
			env.PUBLIC_POCKETBASE_EMAIL ?? 'hgbmichel@gmail.com',
			env.PUBLIC_POCKETBASE_PASSWORD ?? '1234567890'
		);
	} catch (e) {
		console.warn('PocketBase auth failed, continuing offline:', e);
	}
}

export async function deletePbImage(url: string | null | undefined): Promise<void> {
	if (!url) return;
	try {
		const segments = url.split('/');
		const recordId = segments[segments.length - 2];
		const collection = segments[segments.length - 3];
		if (!recordId || !collection) return;
		await auth();
		await pb.collection(collection).delete(recordId).catch(() => {});
	} catch {
		// Best-effort cleanup : on ignore les echecs pour ne pas bloquer l'appelant.
	}
}

export default pb;
