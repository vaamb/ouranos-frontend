import { Manager } from 'socket.io-client';

import { base_URL } from '$lib/utils/consts.js';
import { getStoreData, getStoreDataKey, updateStoreData } from '$lib/utils/functions.js';
import {
	ecosystemsActuatorData,
	ecosystemsLightData,
	ecosystemsManagement,
	ecosystemsSensorsDataCurrent,
	ecosystemsSensorsDataHistoric,
	serverCurrentData,
	serverLastSeen,
	serverLatency
} from '$lib/store.js';

let latencyArray = [];
let pingTime = null;
let pingLoop = null;

const manager = new Manager(base_URL, {
	autoConnect: false,
	reconnectionDelayMax: 30000,
	transports: ['websocket', 'polling']
});

const socketio = manager.socket('/');

export const connectSocketio = function () {
	socketio.connect();
};

export const disconnectSocketio = function () {
	socketio.disconnect();
};

const pingServer = function () {
	pingTime = new Date();
	socketio.emit('ping');
};

// Reserved events
socketio.on('connect', (msg) => {
	pingLoop = setInterval(pingServer, 3000);
});

socketio.on('disconnect', (msg) => {
	clearInterval(pingLoop);
});

// Custom events
socketio.on('pong', (msg) => {
	const now = new Date();
	serverLastSeen.set(now);
	latencyArray.push(now - pingTime);
	latencyArray = latencyArray.slice(-5);
	let sum = 0;
	for (let i = 0; i < latencyArray.length; i++) {
		sum += latencyArray[i];
	}
	serverLatency.set((Math.round((10 * sum) / latencyArray.length) / 10).toFixed(1));
});

socketio.on("current_server_data", (data) => {
  serverCurrentData.set(data);
});

socketio.on('actuator_data', (data) => {
	const updatedData = data.reduce((a, v) => ({ ...a, [v['uid']]: v['data'] }), {});
	updateStoreData(ecosystemsActuatorData, updatedData);
});

socketio.on('current_sensors_data', (data) => {
	const updatedData = {};
	for (const ecosystem of data) {
		if (!ecosystem['data']['records']) {
			continue;
		}
		for (const sensorRecord of ecosystem['data']['records']) {
			for (const measureRecord of sensorRecord['measures']) {
				const storageKey = getStoreDataKey(sensorRecord['sensor_uid'], measureRecord['measure']);
				updatedData[storageKey] = {
					timestamp: new Date(ecosystem['data']['timestamp']),
					value: measureRecord['value']
				};
			}
		}
	}
	updateStoreData(ecosystemsSensorsDataCurrent, updatedData);
});

socketio.on('historic_sensors_data_update', (data) => {
	const maxValues = 6 * 24 * 7; // one record every 10 mins for a week
	const updatedData = {};
	for (const ecosystem of data) {
		if (!ecosystem['data']['records']) {
			continue;
		}
		for (const sensorRecord of ecosystem['data']['records']) {
			for (const measureRecord of sensorRecord['measures']) {
				let storageKey = getStoreDataKey(sensorRecord['sensor_uid'], measureRecord['measure']);
				const currentData = getStoreData(ecosystemsSensorsDataHistoric, storageKey);
				if (!currentData['values']) {
					continue;
				}
				let values = currentData['values'];
				values.push([ecosystem['data']['timestamp'], measureRecord['value']]);
				updatedData[storageKey] = {
					timestamp: new Date(ecosystem['data']['timestamp']),
					values: values.slice(-maxValues)
				};
			}
		}
	}
	updateStoreData(ecosystemsSensorsDataHistoric, updatedData);
});

socketio.on('on_light_data', (data) => {
	const updatedData = data.reduce((a, v) => ({ ...a, [v['uid']]: v['data'] }), {});
	updateStoreData(ecosystemsLightData, updatedData);
});

socketio.on('on_management', (data) => {
	const updatedData = data.reduce((a, v) => ({ ...a, [v['uid']]: v['data'] }), {});
	updateStoreData(ecosystemsManagement, updatedData);
});
