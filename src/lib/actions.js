import { get } from "svelte/store"
import { goto } from "$app/navigation";

import axios from "axios";

import { API_URL, SERVER_STATUS } from "$lib/utils/consts.js";
import { Message, User } from "$lib/utils/factories.js";
import { dynamicSort } from "$lib/utils/functions.js";
import {
  currentUser,
  flashMessage,
} from "$lib/store.js";
import { APP_MODE, AppMode } from "../conf.js";


const formatParam = function(param) {
  if (APP_MODE === AppMode.development) {
    return null;
  } else {
    return param
  }
}

export const fetchServerInfo = async function() {
  return await axios
    .get(`${API_URL}/app/version`)
    .then((response) => {
      if (response.status === 200) {
        return {
          appVersion: response.data,
          serverStatus: SERVER_STATUS.connected,
        };
      }
    })
    .catch(() => {
      return {
        appVersion: null,
        serverStatus: SERVER_STATUS.unreachable,
      };
    });
}

// Auth-related actions
export const fetchCurrentUserData = async function(clientSessionCookie, clientUserAgent) {
  return axios
    .get(`${API_URL}/auth/current_user`,
      {
        headers: {
          "Cookie": clientSessionCookie,
          "User-Agent": clientUserAgent,
        },
        withCredentials: true
      }
    )
    .then((response) => {
      return {
        currentUserData: response.data
      }
    })
    .catch(() => {
      return {
        currentUserData: undefined
      }
    });
}

export const logIn = async function(username, password, remember = false) {
  return axios
    .get(`${API_URL}/auth/login`, {
      withCredentials: true,
      auth: {
        username: username,
        password: password,
      },
      params: {
        remember: remember
      }
    })
    .then((response) => {
      if (response.status === 200) {
        const user = User(response.data.user);
        currentUser.set(user);
        let msgs = get(flashMessage);
        msgs.push(Message("You are now logged in " + user.username))
        flashMessage.set(msgs)
        goto("/");
      }
    })
    .catch((fetchError) => {
      if (fetchError.response) {
        if (fetchError.response.status === 401) {
          return fetchError.response.data.detail;
        } else if (fetchError.response.status === 500) {
          return "It seems like we have an issue on our side"
        }
      }
    });
}

export const logOut = function () {
  axios
    .get(`${API_URL}/auth/logout`, {
      withCredentials: true
    })
    .then((response) => {
      if (response.status === 200) {
        const user = User()
        currentUser.set(user);
      }
    })
  .catch((fetchError) => {
    console.log(fetchError)
  })
}

// Engines-related actions
export const fetchEngines = async function() {
  return axios
    .get(`${API_URL}/gaia/engine`, {
      params: { engines_id: formatParam("recent") },
    })
    .then((response) => {
      const engines = response.data.reduce(
        (a, v) => ({...a, [v["uid"]]: v}), {}
      );
      const sorted = response.data.sort(dynamicSort("uid"));
      const enginesIds = sorted.map(obj => (
        {uid: obj.uid, sid: obj.sid}
      ));
      return {
        engines: engines,
        enginesIds: enginesIds,
      };
    })
    .catch(() => {
      return {
        engines: {},
        enginesIds: [],
      };
    });
};

// Ecosystems-related actions
export const fetchEcosystems = async function() {
  return axios
    .get(`${API_URL}/gaia/ecosystem`, {
      params: { ecosystems_id: formatParam("recent") },
    })
    .then((response) => {
      const ecosystems = response.data.reduce(
        (a, v) => ({...a, [v["uid"]]: v}), {}
      );
      const sorted = response.data.sort(dynamicSort("name"));
      const ecosystemsIds = sorted.map(obj => (
        {uid: obj.uid, name: obj.name}
      ));

      return {
        ecosystems: ecosystems,
        ecosystemsIds: ecosystemsIds,
      };
    })
    .catch(() => {
      return {
        ecosystems: {},
        ecosystemsIds: [],
      };
    });
};

export const fetchEcosystemsManagement = async function() {
  return axios
    .get(`${API_URL}/gaia/ecosystem/management`, {
      params: { ecosystems: formatParam("recent") },
    })
    .then((response) => {
      const object = response.data.reduce(
        (a, v) => ({...a, [v["uid"]]: v}), {}
      );
      return {
        ecosystemsManagement: object,
      };
    })
    .catch(() => {
      return {
        ecosystemsManagement: {},
      };
    });
};

export const fetchEcosystemsLight = async function() {
  return axios
    .get(`${API_URL}/gaia/ecosystem/light`, {
      params: { ecosystems: formatParam("recent") },
    })
    .then((response) => {
      const object = response.data.reduce(
        (a, v) => ({...a, [v["ecosystem_uid"]]: v}), {}
      );
      return {
        ecosystemsLight: object,
      }
    })
    .catch(() => {
      return {
        ecosystemsLight: {},
      }
    });
}

export const fetchEcosystemsCurrentSensorsData = async function() {
  return axios
    .get(`${API_URL}/gaia/ecosystem/current_data`, {
      params: { ecosystems: formatParam("recent") },
    })
    .then((response) => {
      const object = response.data.reduce(
        (a, v) => ({...a, [v["ecosystem_uid"]]: v}), {}
      );
      return {
        ecosystemsCurrentSensorsData: object
      }
    })
    .catch(() => {
      return {
        ecosystemsCurrentSensorsData: {}
      }
    });
}

export const fetchSensorHistoricMeasureData = async function(sensorUid, measure) {
  return axios
    .get(`${API_URL}/sensor/sensor/u/${sensorUid}/${measure}`, {
      params: { historic_data: true, current_data: false },
    })
    .then((response) => {
      const object = response.data.reduce(
        (a, v) => ({...a, [v["uid"]]: v}), {}
      );
      return {
        ecosystemsSensorsSkeleton: object,
      }
    })
    .catch(() => {
      return {
        ecosystemsSensorsSkeleton: {},
      }
    });
}

export const fetchEcosystemsSensorsSkeleton = async function() {
  return axios
    .get(`${API_URL}/gaia/ecosystem/sensors_skeleton`, {
      params: { ecosystems: formatParam("recent") },
    })
    .then((response) => {
      const object = response.data.reduce(
        (a, v) => ({...a, [v["uid"]]: v}), {}
      );
      return {
        ecosystemsSensorsSkeleton: object,
      }
    })
    .catch(() => {
      return {
        ecosystemsSensorsSkeleton: {},
      }
    });
}

// Weather-related actions
export const fetchWeatherForecast = async function(exclude=null) {
  return axios
    .get(`${API_URL}/weather/forecast`, {
      params: {exclude: exclude}
    })
    .then((response) => {
      let weatherCurrently = {};
      let weatherHourly = [];
      let weatherDaily = [];

      if (Object.prototype.hasOwnProperty.call(response.data, "currently")) {
        weatherCurrently = response.data.currently;
      }
      if (Object.prototype.hasOwnProperty.call(response.data, "hourly")) {
        weatherHourly = response.data.hourly;
      }
      if (Object.prototype.hasOwnProperty.call(response.data, "daily")) {
        weatherDaily = response.data.daily;
      }

      return {
        weatherCurrentlyValue: weatherCurrently,
        weatherHourlyValue: weatherHourly,
        weatherDailyValue: weatherDaily,
      }
    })
    .catch(() => {
      return {
        weatherCurrentlyValue: {},
        weatherHourlyValue: [],
        weatherDailyValue: [],
      }
    });
}

// Server-related actions
export const fetchServerCurrentData = async function(clientSessionCookie, clientUserAgent) {
  return axios
    .get(`${API_URL}/system/data/current`,
      {
        headers: {
          "Cookie": clientSessionCookie,
          "User-Agent": clientUserAgent,
        },
        withCredentials: true
      }
    )
    .then((response) => {
      return {
        serverCurrentData: response.data.values
      }
    })
    .catch(() => {
      return {
        serverCurrentData: {}
      }
    });
}

export const fetchServerStartTime = async function(clientSessionCookie, clientUserAgent) {
  return axios
    .get(`${API_URL}/system/start_time`,
      {
        headers: {
          "Cookie": clientSessionCookie,
          "User-Agent": clientUserAgent,
        },
        withCredentials: true
      }
    )
    .then((response) => {
      return {
        serverStartTime: response.data,
      };
    })
    .catch(() => {
      return {
        serverStartTime: null,
      };
    });
}

export const fetchServices = async function() {
  return axios
    .get(`${API_URL}/app/services`)
    .then((response) => {
      return {
        services: response.data
      }
    })
    .catch(() => {
      return {
        services: []
      }
    });
}

export const fetchWarnings = async function() {
  return axios
    .get(`${API_URL}/gaia/warning`)
    .then((response) => {
      return {
        warnings: response.data
      }
    })
    .catch(() => {
      return {
        warnings: []
      }
    });
}
