import { error } from '@sveltejs/kit';

import { APP_MODE, AppMode } from '../conf.js';
import { fetchCurrentUserData, fetchServerInfo } from '$lib/actions.js';
import { User } from '$lib/utils/factories.js';

export async function load({ cookies, request }) {
	const rv = {
		development: APP_MODE === AppMode.development
	};
	const { appVersion, serverStatus } = await fetchServerInfo();
	rv.appVersion = appVersion;
	rv.serverStatus = serverStatus;

	const sessionCookie = cookies.get('session');
	if (sessionCookie !== undefined) {
		const clientSessionCookie = 'session=' + sessionCookie;
		const clientUserAgent = request.headers.get('user-agent');
		const { currentUserData } = await fetchCurrentUserData(clientSessionCookie, clientUserAgent);
		rv.userData = new User(currentUserData).flatten();
	} else {
		rv.userData = new User().flatten();
	}

	switch (APP_MODE) {
		case AppMode.development:
		case AppMode.testing:
		case AppMode.production:
			rv.maintenance = false;
			return rv;
		case AppMode.maintenance:
			rv.maintenance = true;
			return rv;
		default:
			error(500, 'We are experiencing an unexpected issue, come back later');
	}
}
