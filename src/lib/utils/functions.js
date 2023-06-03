import humanizeDuration from "humanize-duration";
import { graphs } from "$lib/utils/styling.js";

export const dynamicSort = function(property) {
  // from https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
  let sortOrder = 1;
  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a, b) {
    /* next line works with strings and numbers,
     * and you may want to customize it to your needs
     */
    let result =
      a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
    return result * sortOrder;
  };
}

export const isEmpty = function(obj) {
  if (obj === undefined) {
    return true;
  }
  return Object.keys(obj).length === 0;
}

export function capitalize(string) {
  if (typeof string !== "string") return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Date time related
const isDate = function(date) {
  return Object.prototype.toString.call(date) === '[object Date]';
}

export const formatDateTime = function(date) {
  if (isDate(date)) {
    return (
      date.toLocaleDateString("en-GB") +
      ", " +
      date.toLocaleTimeString([], { timeStyle: "short", hour12: false })
    );
  } else {
    return ""
  }
}

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const formatDate = function (date) {
  if (isDate(date)) {
    const day = days[date.getDay()];
    const month = months[date.getMonth()];
    return "".concat(day, " ", date.getDate(), " ", month);
  } else {
    return ""
  }
}

const weatherIconTranslation = {
  "clear-day": "wi wi-day-sunny",
  "clear-night": "wi wi-night-clear",
  "rain": "wi wi-rain",
  "snow": "wi wi-snow",
  "sleet": "wi wi-sleet",
  "wind": "wi wi-cloudy-gusts",
  "fog": "wi wi-fog",
  "cloudy": "wi wi-cloudy",
  "partly-cloudy-day": "wi wi-day-cloudy",
  "partly-cloudy-night": "wi wi-night-alt-cloudy",
};

export const getWeatherIcon = function(weather) {
  return weatherIconTranslation[weather];
}

export const computeUptime = function(serverLastSeen, serverStartTime) {
  if (serverStartTime) {
    const now = new Date();
    if (now - serverLastSeen < 15 * 1000) {
      return humanizeDuration((now - serverStartTime), {
        largest: 2,
        units: ["y", "mo", "w", "d", "h", "m", "s"],
        maxDecimalPoints: 0,
        delimiter: " and ",
      });
    }
  }
  return "Lost connection with server";
}

export const computeEcosystemStatusClass = function(ecosystem) {
  if (ecosystem["connected"]) {
    if (ecosystem["status"]) {
      return "on";
    } else {
      return "off";
    }
  } else {
    return "deco";
  }
}

export const computeLightStatusClass = function(ecosystemLight) {
  if (ecosystemLight["status"]) {
    return "on";
  } else {
    return "off";
  }
}

export const computeLightingHours = function(ecosystemLight) {
  let rv = "";
  if (["elongate", "mimic"].includes(ecosystemLight["method"])) {
    for (const TOD of ["morning", "evening"]) {
      if (ecosystemLight[TOD + "_start"] && ecosystemLight[TOD + "_end"]) {
        const start = new Date(ecosystemLight[TOD + "_start"]);
        const end = new Date(ecosystemLight[TOD + "_end"]);
        if (start < end) {
          rv += `<p> ${
            capitalize(TOD) +
            " lighting from " +
            start.toLocaleTimeString([], { timeStyle: "short" }) +
            " to " +
            end.toLocaleTimeString([], { timeStyle: "short" })
          } </p>`;
        }
      }
    }
  }
  return rv;
}

export const computeCurrentSensorsAverages = function(ecosystemCurrentSensorsData, sensorsLevel) {
  const order = graphs[sensorsLevel].order;
  const units = graphs[sensorsLevel].units;

  const object = {};
  if(! ecosystemCurrentSensorsData.average) {
    return "<p>No sensor data available</p>"
  }
  for (const measureRecord of ecosystemCurrentSensorsData.average) {
    const measure = measureRecord.measure;
    object[measure] = Math.round(measureRecord.value).toFixed(1);
  }
  let rv = "";
  for (const measure of order) {
    if (object[measure]) {
      rv += `<p>${
        capitalize(measure).replace("_", " ") + ": " + object[measure] + units[measure]
      }</p>`;
    }
  }
  if (rv) {
    return rv;
  } else {
    return "<p>No sensor data available</p>";
  }
}

export const serviceEnabled = function(services, serviceName) {
  const service = services.filter(object => {
    return object.name === serviceName;
  });
  const serviceObj = service[0]
  if (serviceObj) {
    return serviceObj.status;
  } else {
    return false;
  }
}

export const setCookie = function(name, value, expDays=90) {
  let date = new Date();
    date.setTime(date.getTime() + (expDays * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + "; " + expires + "; path=/;SameSite=Lax";
}

export const getEcosystemUid = function (ecosystemIds, ecosystemName) {
  const Ids = ecosystemIds.find(id => {
    return id.name === ecosystemName;
  });
  if (! isEmpty(Ids)) {
    return Ids.uid;
  }
}