import {
  fetchEcosystems,
  fetchEcosystemsManagement,
  fetchEngines,
  fetchServices,
  fetchWarnings,
} from "$lib/actions.js";
import { User } from "$lib/utils/factories.js";

export async function load({ cookies }) {
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
    const resp = await fetchWarnings();
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