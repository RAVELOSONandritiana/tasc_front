import { env } from "$env/dynamic/public";

import PocketBase from 'pocketbase';

const pb = new PocketBase(env.PUBLIC_POCKET_BASE_URL);

export async function auth() {
	try {
		await pb.admins.authWithPassword(env.PUBLIC_POCKETBASE_EMAIL ?? 'hgbmichel@gmail.com', env.PUBLIC_POCKETBASE_PASSWORD ?? '1234567890');
	} catch (e) {
		console.warn('PocketBase auth failed, continuing offline:', e);
	}
}

export default pb;