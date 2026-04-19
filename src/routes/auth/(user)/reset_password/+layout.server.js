import { redirect } from '@sveltejs/kit';

import { createUser } from '$lib/utils/factories.js';

export async function load({ parent }) {
	const data = await parent();
	const currentUser = createUser(data.userData);

	if (!currentUser.isConfirmed) {
		redirect(307, '/');
	}
}
