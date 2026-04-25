import { redirect } from '@sveltejs/kit';

import { permissions } from '$lib/utils/consts.js';
import { createUser } from '$lib/utils/factories.js';

export async function load({ parent }) {
	const data = await parent();
	const currentUser = createUser(data.userData);

	if (!currentUser.can(permissions.OPERATE)) {
		redirect(307, '/');
	}
}
