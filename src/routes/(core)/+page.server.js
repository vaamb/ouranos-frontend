import {
  fetchEcosystemsCurrentSensorsData,
  fetchEcosystemsLight,
  fetchServerCurrentData,
  fetchServerStartTime,
  fetchWeatherForecast
} from "$lib/actions.js";

import { permissions } from "$lib/utils/consts.js";
import { User } from "$lib/utils/factories.js";

export async function load({ cookies }) {
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
    const sessionCookie = "session=" + cookies.get("session")
    const resp1 = await fetchServerCurrentData(sessionCookie);
    console.log(resp1)
    serverCurrentData = resp1.serverCurrentData;
    const resp2 = await fetchServerStartTime(sessionCookie);
    serverStartTime = resp2.serverStartTime;
  }

  return {
    ecosystemsCurrentSensorsDataValues: ecosystemsCurrentSensorsData,
    ecosystemsLightValues: ecosystemsLight,
    serverCurrentDataValues: serverCurrentData.values,
    serverStartTimeValue: serverStartTime,
    weatherCurrentlyValues: weatherCurrently,
  };
}