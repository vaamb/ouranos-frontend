import {
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
  let warnings = []
  if (currentUser.isAuthenticated) {
    const clientSessionCookie = 'session=' + cookies.get('session');
    const clientUserAgent = request.headers.get('user-agent');
    const resp = await fetchWarnings(clientSessionCookie, clientUserAgent);
    warnings = resp.warnings
  }

  return {
    ecosystemsValues: ecosystems,
    ecosystemsIdsValues: ecosystemsIds,
    ecosystemsManagementValues: ecosystemsManagement,
    enginesValues: engines,
    enginesIdsValues: enginesIds,
    servicesValues: services,
    warningsValues: warnings,
  }
}