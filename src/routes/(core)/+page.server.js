import { fetchServerCurrentData, fetchServerStartTime } from '$lib/actions.js';

import { permissions } from '$lib/utils/consts.js';
import { User } from '$lib/utils/factories.js';

export async function load({ cookies, request, parent }) {
	let serverCurrentData = {};
	let serverStartTime = null;

	const data = await parent();
	let currentUser = User(data.userData);
	if (currentUser.can(permissions.ADMIN)) {
		const clientSessionCookie = 'session=' + cookies.get('session');
		const clientUserAgent = request.headers.get('user-agent');
		const resp1 = await fetchServerCurrentData(clientSessionCookie, clientUserAgent);
		serverCurrentData = resp1.serverCurrentData;
		const resp2 = await fetchServerStartTime(clientSessionCookie, clientUserAgent);
		serverStartTime = resp2.serverStartTime;
	}

	return {
		serverCurrentDataValues: serverCurrentData,
		serverStartTimeValue: serverStartTime
	};
}
