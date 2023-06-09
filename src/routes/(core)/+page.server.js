import {
  fetchEcosystemsCurrentSensorsData,
  fetchEcosystemsLight,
  fetchServerCurrentData,
  fetchServerStartTime,
  fetchWeatherForecast
} from "$lib/actions.js";

import { permissions } from "$lib/utils/consts.js";
import { User } from "$lib/utils/factories.js";

export async function load({ cookies, request }) {
  const userDataCookie = cookies.get("userDataCache")
  let currentUser = User()
  if (userDataCookie) {
    currentUser = User(JSON.parse(userDataCookie));
  }

  const { weatherCurrently } = await fetchWeatherForecast("hourly,daily");

  const { ecosystemsCurrentSensorsData } = await fetchEcosystemsCurrentSensorsData();
  const { ecosystemsLight } = await fetchEcosystemsLight();

  let serverCurrentData = {};
  let serverStartTime = null;
  if (currentUser.can(permissions.ADMIN)) {
    const clientSessionCookie = "session=" + cookies.get("session")
    const clientUserAgent = request.headers.get("user-agent")
    const resp1 = await fetchServerCurrentData(clientSessionCookie, clientUserAgent);
    serverCurrentData = resp1.serverCurrentData;
    const resp2 = await fetchServerStartTime(clientSessionCookie, clientUserAgent);
    serverStartTime = resp2.serverStartTime;
  }

  return {
    ecosystemsCurrentSensorsDataValues: ecosystemsCurrentSensorsData,
    ecosystemsLightValues: ecosystemsLight,
    serverCurrentDataValues: serverCurrentData,
    serverStartTimeValue: serverStartTime,
    weatherCurrentlyValues: weatherCurrently,
  };
}