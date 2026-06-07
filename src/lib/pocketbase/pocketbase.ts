import { env } from "$env/dynamic/public";

import PocketBase from 'pocketbase';

const pb = new PocketBase(env.PUBLIC_POCKET_BASE_URL);

await pb.admins.authWithPassword(env.PUBLIC_POCKETBASE_EMAIL, env.PUBLIC_POCKETBASE_PASSWORD)

export default pb;