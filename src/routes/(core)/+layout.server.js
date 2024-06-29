import {
	fetchCalendarEvents,
	fetchEcosystems,
	fetchEcosystemsManagement,
	fetchEngines,
	fetchServers,
	fetchServices,
	fetchWarnings
} from '$lib/actions.js';
import { User } from '$lib/utils/factories.js';

export async function load({ cookies, request, parent }) {
	const data = await parent();
	let currentUser = User(data.userData);
	const { ecosystems, ecosystemsIds } = await fetchEcosystems();
	const { ecosystemsManagement } = await fetchEcosystemsManagement();
	const { engines, enginesIds } = await fetchEngines();
	const { services } = await fetchServices();
	let events = [];
	let warnings = [];
	let servers = {};
	let serversIds = [];
	if (currentUser.isAuthenticated) {
		const clientSessionCookie = 'session=' + cookies.get('session');
		const clientUserAgent = request.headers.get('user-agent');
		const respEvents = await fetchCalendarEvents(clientSessionCookie, clientUserAgent);
		events = respEvents['events'];
		const respWarnings = await fetchWarnings(clientSessionCookie, clientUserAgent);
		warnings = respWarnings['warnings'];
		const respServers = await fetchServers(clientSessionCookie, clientUserAgent);
		servers = respServers['servers'];
		serversIds = respServers['serversIds'];
	}

	return {
		calendarEventsValues: events,
		ecosystemsValues: ecosystems,
		ecosystemsIdsValues: ecosystemsIds,
		ecosystemsManagementValues: ecosystemsManagement,
		enginesValues: engines,
		enginesIdsValues: enginesIds,
		servicesValues: services,
		serversValues: servers,
		serversIdsValues: serversIds,
		warningsValues: warnings
	};
}
