import { redirect } from '@sveltejs/kit';

export function load({ params }: { params: { id: string } }) {
	throw redirect(303, `/classe/${params.id}/cours`);
}
