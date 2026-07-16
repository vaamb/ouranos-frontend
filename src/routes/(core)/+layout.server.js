import {
	fetchEcosystems,
	fetchEcosystemsManagement,
	fetchEngines,
	fetchServers,
	fetchServices,
	fetchWarnings,
	fetchWikiTopics
} from '$lib/queries.js';
import { createUser } from '$lib/utils/factories.js';

export async function load({ cookies, parent, request }) {
	const data = await parent();
	let currentUser = createUser(data.userData);

	// Authenticated users have a session token available (User data comes from this token)
	const authHeaders = currentUser.isAuthenticated
		? {
				'Cookie': 'session=' + cookies.get('session'),
				'User-Agent': request.headers.get('user-agent')
			}
		: undefined;

	const [ecosystems, ecosystemsManagement, engines, services, servers, warnings, wikiTopics] =
		await Promise.all([
			fetchEcosystems(),
			fetchEcosystemsManagement(),
			fetchEngines(),
			fetchServices(),
			currentUser.isAuthenticated ? fetchServers({ headers: authHeaders }) : {},
			currentUser.isAuthenticated ? fetchWarnings({ headers: authHeaders }) : [],
			fetchWikiTopics()
		]);

	return {
		ecosystems: ecosystems['info'],
		ecosystemsState: ecosystems['states'],
		ecosystemsManagement,
		engines: engines['info'],
		enginesState: engines['states'],
		services,
		servers,
		warnings,
		wikiTopics
	};
}
