import {
	fetchEcosystems,
	fetchEcosystemsManagement,
	fetchEngines,
	fetchServers,
	fetchServices,
	fetchWarnings,
	fetchWikiTopics
} from '$lib/actions.svelte.js';
import { createUser } from '$lib/utils/factories.js';

export async function load({ cookies, parent, request }) {
	const data = await parent();
	let currentUser = createUser(data.userData);

	const clientSessionCookie = 'session=' + cookies.get('session');
	const clientUserAgent = request.headers.get('user-agent');

	const [ecosystems, ecosystemsManagement, engines, services, servers, warnings, wikiTopics] =
		await Promise.all([
			fetchEcosystems(),
			fetchEcosystemsManagement(),
			fetchEngines(),
			fetchServices(),
			currentUser.isAuthenticated ? fetchServers(clientSessionCookie, clientUserAgent) : {},
			currentUser.isAuthenticated ? fetchWarnings(clientSessionCookie, clientUserAgent) : [],
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
