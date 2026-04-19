import { fetchCurrentUserData, fetchServerInfo } from '$lib/actions.svelte.js';
import { getAppMode } from '$lib/utils/consts.js';
import { createUser } from '$lib/utils/factories.js';

export async function load({ cookies, request }) {
	const rv = {
		appMode: getAppMode()
	};
	const { appVersion, serverStatus } = await fetchServerInfo();
	rv.appVersion = appVersion;
	rv.serverStatus = serverStatus;

	const sessionCookie = cookies.get('session');
	if (sessionCookie !== undefined) {
		const clientSessionCookie = 'session=' + sessionCookie;
		const clientUserAgent = request.headers.get('user-agent');
		const { currentUserData } = await fetchCurrentUserData(clientSessionCookie, clientUserAgent);
		rv.userData = createUser(currentUserData, sessionCookie).flatten();
	} else {
		rv.userData = createUser().flatten();
	}
	return rv;
}
