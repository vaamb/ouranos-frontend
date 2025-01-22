import { redirect } from '@sveltejs/kit';

import { serviceEnabled } from '$lib/utils/functions.js';

export async function load({ parent }) {
	const data = await parent();

	if (!serviceEnabled(data['servicesValues'], 'calendar')) {
		redirect(307, '/');
	}
}
