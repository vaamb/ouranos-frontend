import {
	fetchEcosystems,
	fetchEcosystemsManagement,
	fetchEngines,
	fetchServers,
	fetchServices,
	fetchWarnings,
	fetchWikiTopics
} from '$lib/actions.svelte.js';
import { User } from '$lib/utils/factories.js';

export async function load({ cookies, parent, request }) {
	const data = await parent();
	let currentUser = User(data.userData);

	const clientSessionCookie = 'session=' + cookies.get('session');
	const clientUserAgent = request.headers.get('user-agent');
	const ecosystems = await fetchEcosystems();
	const engines = await fetchEngines();

	return {
		ecosystems: ecosystems['info'],
		ecosystemsState: ecosystems['states'],
		ecosystemsManagement: await fetchEcosystemsManagement(),
		engines: engines['info'],
		enginesState: engines['states'],
		services: await fetchServices(),
		servers: currentUser.isAuthenticated
			? await fetchServers(clientSessionCookie, clientUserAgent)
			: {},
		warnings: currentUser.isAuthenticated
			? await fetchWarnings(clientSessionCookie, clientUserAgent)
			: [],
		wikiTopics: await fetchWikiTopics()
	};
}
