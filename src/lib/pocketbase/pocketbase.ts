import { env } from "$env/dynamic/public";

import PocketBase from 'pocketbase';

const pb = new PocketBase(env.PUBLIC_POCKET_BASE_URL);

await pb.admins.authWithPassword('hgbmichel@gmail.com','1234567890')

export default pb;