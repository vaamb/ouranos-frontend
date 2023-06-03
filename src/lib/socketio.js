import { Manager } from "socket.io-client";

import { base_URL } from "$lib/utils/consts.js";
import {
  ecosystemsCurrentSensorsData,
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

socketio.on("current_sensors_data", (data) => {
  const object = data.reduce(
    (a, v) => ({...a, [v["ecosystem_uid"]]: v}), {}
  );
  ecosystemsCurrentSensorsData.set(object);
});
