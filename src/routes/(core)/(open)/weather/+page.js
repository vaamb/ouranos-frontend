export const ssr = false;

import { redirect } from '@sveltejs/kit';

export async function load({ parent }) {
	const data = await parent();

	const service = data['services'].find((service) => {
		return service['name'] ===  'weather';
	})
	if (!service['status']) {
		redirect(307, '/');
	}
}
