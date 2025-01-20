import {
	fetchEcosystems,
	fetchEcosystemsManagement,
	fetchEngines,
	fetchServers,
	fetchServices,
	fetchWarnings
} from '$lib/actions.svelte.js';
import { User } from '$lib/utils/factories.js';

export async function load({ cookies, request, parent }) {
	const data = await parent();
	let currentUser = User(data.userData);
	const ecosystems = await fetchEcosystems();
	const ecosystemsManagement = await fetchEcosystemsManagement();
	const engines = await fetchEngines();
	const services = await fetchServices();
	let warnings = [];
	let servers = {};
	if (currentUser.isAuthenticated) {
		const clientSessionCookie = 'session=' + cookies.get('session');
		const clientUserAgent = request.headers.get('user-agent');
		warnings = await fetchWarnings(clientSessionCookie, clientUserAgent);
		servers = await fetchServers(clientSessionCookie, clientUserAgent);
	}

	return {
		ecosystemsValues: ecosystems,
		ecosystemsManagementValues: ecosystemsManagement,
		enginesValues: engines,
		servicesValues: services,
		serversValues: servers,
		warningsValues: warnings
	};
}
