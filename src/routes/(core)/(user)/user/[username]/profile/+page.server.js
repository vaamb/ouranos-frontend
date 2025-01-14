import { redirect } from '@sveltejs/kit';

import { User } from '$lib/utils/factories.js';
import { permissions } from '$lib/utils/consts.js';

export async function load({ parent, url }) {
	const data = await parent();
	const currentUser = User(data.userData);
	let username = url.pathname;
	username = username.replace('/user/u/', '');
	username = username.replace('/profile', '');
	if (currentUser['username'] !== username && !currentUser.can(permissions.ADMIN)) {
		redirect(307, '/');
	}
}
