import { redirect } from '@sveltejs/kit';

import { fetchUserDescription } from '$lib/actions.svelte.js';
import { User } from '$lib/utils/factories.js';
import { permissions } from '$lib/utils/consts.js';

export async function load({ cookies, params, parent, request }) {
	const rv = {
		userDescription: undefined
	}
	const sessionCookie = cookies.get('session');
	// If no cookies -> anonymous user -> cannot access the resource
	if (sessionCookie === undefined) {
		redirect(307, '/');
		return rv
	}
	const data = await parent();
	const currentUser = User(data.userData);
	let username = params['username'];
	// If the logged user isn't the same as the requested user and is not an admin -> cannot access the resource
	if (currentUser['username'] !== username && !currentUser.can(permissions.ADMIN)) {
		redirect(307, '/');
		return rv
	}
	const clientSessionCookie = 'session=' + sessionCookie;
	const clientUserAgent = request.headers.get('user-agent');
	rv.userDescription = await fetchUserDescription(clientSessionCookie, clientUserAgent, username);
	return rv
}
