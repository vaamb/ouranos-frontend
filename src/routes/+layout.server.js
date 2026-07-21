import { fetchCurrentUserData, fetchServerContractsVersion, fetchServerInfo } from '$lib/queries.js';
import { getAppMode } from '$lib/utils/consts.js';
import { createUser } from '$lib/utils/factories.js';

export async function load({ cookies, request }) {
	const rv = {
		appMode: getAppMode()
	};

	const [{ appVersion, serverStatus }, { rest: restContract }] = await Promise.all([
		fetchServerInfo(),
		fetchServerContractsVersion()
	]);
	rv.appVersion = appVersion;
	rv.serverStatus = serverStatus;
	rv.restContract = restContract;

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
		rv.userData = createUser(currentUserData).flatten();
	} else {
		rv.userData = createUser().flatten();
	}
	return rv;
}
