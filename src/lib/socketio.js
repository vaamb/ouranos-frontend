import { get } from 'svelte/store';

import { Manager } from "socket.io-client";

import { base_URL } from "$lib/utils/consts.js";
import {
  ecosystemsActuatorData,
  ecosystemsCurrentSensorsData,
    ecosystemsLightData,
    ecosystemsManagement,
  serverCurrentData,
  serverLastSeen,
  serverLatency
} from "$lib/store.js";


let latencyArray = [];
let pingTime = null;
let pingLoop = null;


const manager = new Manager(base_URL, {
  autoConnect: false,
  reconnectionDelayMax: 30000,
  transports: ["websocket", "polling"]
});

const socketio = manager.socket("/");

export const connectSocketio = function() {
  socketio.connect();
}

export const disconnectSocketio = function() {
  socketio.disconnect();
}

const pingServer = function () {
  pingTime = new Date();
  socketio.emit("ping");
}

// Reserved events
socketio.on("connect", (msg) => {
  pingLoop = setInterval(pingServer, 3000);
})

socketio.on("disconnect", (msg) => {
  clearInterval(pingLoop);
})

// Custom events
socketio.on("pong", (msg) => {
  const now = new Date();
  serverLastSeen.set(now);
  latencyArray.push(now - pingTime);
  latencyArray = latencyArray.slice(-5);
  let sum = 0;
  for (let i = 0; i < latencyArray.length; i++) {
    sum += latencyArray[i];
  }
  serverLatency.set(
    (Math.round((10 * sum) / latencyArray.length) / 10).toFixed(1)
  );
});

socketio.on("current_server_data", (data) => {
  serverCurrentData.set(data);
});

socketio.on("actuator_data", (data) => {
  let currentData = get(ecosystemsActuatorData)
  const updatedData = data.reduce(
    (a, v) => ({...a, [v["uid"]]: v["data"]}), {}
  );
  ecosystemsActuatorData.set(Object.assign(currentData, updatedData));
})

socketio.on("current_sensors_data", (data) => {
  let currentData = get(ecosystemsCurrentSensorsData)
  const updatedData = data.reduce(
    (a, v) => ({...a, [v["uid"]]: v["data"]}), {}
  );
  ecosystemsCurrentSensorsData.set(Object.assign(currentData, updatedData));
});

socketio.on("on_light_data", (data) => {
  let currentData = get(ecosystemsLightData)
  const updatedData = data.reduce(
    (a, v) => ({...a, [v["uid"]]: v["data"]}), {}
  );
  ecosystemsLightData.set(Object.assign(currentData, updatedData));
});

socketio.on("on_management", (data) => {
  let currentData = get(ecosystemsManagement)
  const updatedData = data.reduce(
    (a, v) => ({...a, [v["uid"]]: v["data"]}), {}
  );
  ecosystemsManagement.set(Object.assign(currentData, updatedData));
});
