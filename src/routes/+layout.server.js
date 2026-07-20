import { fetchCurrentUserData, fetchServerContractsVersion, fetchServerInfo } from '$lib/queries.js';
import { getAppMode } from '$lib/utils/consts.js';
import { createUser } from '$lib/utils/factories.js';

export async function load({ cookies, request }) {
	const rv = {
		appMode: getAppMode()
	};
	const { appVersion, serverStatus } = await fetchServerInfo();
	const { rest } = await fetchServerContractsVersion()

	rv.appVersion = appVersion;
	rv.serverStatus = serverStatus;
	rv.restContract = rest

	const sessionCookie = cookies.get('session');
	if (sessionCookie !== undefined) {
		const clientSessionCookie = 'session=' + sessionCookie;
		const clientUserAgent = request.headers.get('user-agent');
		const { currentUserData } = await fetchCurrentUserData({
			headers: {
				'Cookie': clientSessionCookie,
				'User-Agent': clientUserAgent
			}
		});
		rv.userData = createUser(currentUserData, sessionCookie).flatten();
	} else {
		rv.userData = createUser().flatten();
	}
	return rv;
}
