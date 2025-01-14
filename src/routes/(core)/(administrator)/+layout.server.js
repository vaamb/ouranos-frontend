import { redirect } from '@sveltejs/kit';

import { permissions } from '$lib/utils/consts.js';
import { User } from '$lib/utils/factories.js';

export async function load({ parent }) {
	const data = await parent();
	const currentUser = User(data.userData);

	if (!currentUser.can(permissions.ADMIN)) {
		redirect(307, '/');
	}
}
