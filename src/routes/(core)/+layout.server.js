import {
  fetchCalendarEvents,
  fetchEcosystems,
  fetchEcosystemsManagement,
  fetchEngines,
  fetchServices,
  fetchWarnings,
} from "$lib/actions.js";
import { User } from "$lib/utils/factories.js";

export async function load({ cookies, request }) {
  const userDataCookie = cookies.get("userDataCache")
  let currentUser = User()
  if (userDataCookie) {
    currentUser = User(JSON.parse(userDataCookie));
  }

  const { ecosystems, ecosystemsIds } = await fetchEcosystems();
  const { ecosystemsManagement } = await fetchEcosystemsManagement();
  const { engines, enginesIds } = await fetchEngines();
  const { services } = await fetchServices();
  let events = []
  let warnings = []
  if (currentUser.isAuthenticated) {
    const clientSessionCookie = 'session=' + cookies.get('session');
    const clientUserAgent = request.headers.get('user-agent');
    const respEvents = await fetchCalendarEvents(clientSessionCookie, clientUserAgent);
    events = respEvents['events']
    const respWarnings = await fetchWarnings(clientSessionCookie, clientUserAgent);
    warnings = respWarnings['warnings'];
  }

  return {
    calendarEventsValues: events,
    ecosystemsValues: ecosystems,
    ecosystemsIdsValues: ecosystemsIds,
    ecosystemsManagementValues: ecosystemsManagement,
    enginesValues: engines,
    enginesIdsValues: enginesIds,
    servicesValues: services,
    warningsValues: warnings,
  }
}