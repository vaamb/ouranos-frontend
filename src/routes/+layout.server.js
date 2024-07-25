import { fetchCurrentUserData, fetchServerInfo } from '$lib/actions.js';
import { getAppMode } from "$lib/utils/consts.js";
import { User } from '$lib/utils/factories.js';

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
		rv.userData = new User(currentUserData, sessionCookie).flatten();
	} else {
		rv.userData = new User().flatten();
	}
	return rv;
}
