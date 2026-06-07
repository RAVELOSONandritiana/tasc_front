import { env } from "$env/dynamic/public";
import { env as envServer } from '$env/dynamic/private'

import PocketBase from 'pocketbase';

const pb = new PocketBase(env.PUBLIC_POCKET_BASE_URL);

await pb.admins.authWithPassword(envServer.POCKETBASE_EMAIL, envServer.POCKETBASE_PASSWORD)

export default pb;