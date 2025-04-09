import { redirect } from '@sveltejs/kit';

import { User } from '$lib/utils/factories.js';

export async function load({ parent }) {
	const data = await parent();
	const currentUser = User(data.userData);

	if (currentUser.isConfirmed) {
		redirect(307, '/');
	}
}
