import { get } from 'svelte/store';
import { Manager } from 'socket.io-client';

import { BASE_URL } from '$lib/utils/consts.js';
import { getFreshStoreData, getStoreDataKey, updateStoreData } from '$lib/utils/functions.js';
import {
	ecosystems,
	ecosystemsActuatorData,
	ecosystemsLightData,
	ecosystemsManagement,
	ecosystemsSensorsDataCurrent,
	ecosystemsSensorsDataHistoric,
	engines,
	servers,
	serversCurrentData,
	pingServerLastSeen,
	pingServerLatency
} from '$lib/store.js';

let latencyArray = [];
let pingTime = null;
let pingLoop = null;

const manager = new Manager(BASE_URL, {
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
	pingLoop = setInterval(pingServer, 10000);
});

socketio.on('disconnect', (msg) => {
	clearInterval(pingLoop);
});

// Custom events
socketio.on('pong', (msg) => {
	const now = new Date();
	pingServerLastSeen.set(now);
	latencyArray.push(now - pingTime);
	latencyArray = latencyArray.slice(-5);
	let sum = 0;
	for (let i = 0; i < latencyArray.length; i++) {
		sum += latencyArray[i];
	}
	pingServerLatency.set((Math.round((10 * sum) / latencyArray.length) / 10).toFixed(1));
});

socketio.on('ecosystems_heartbeat', (data) => {
	const now = new Date();
	const enginesObj = get(engines);
	if (enginesObj[data['engine_uid']]) {
		enginesObj[data['engine_uid']]['last_seen'] = now;
		engines.set(enginesObj);
	}
	const ecosystemsObj = get(ecosystems);
	for (const ecosystemData of data['ecosystems']) {
		if (ecosystemsObj[ecosystemData['uid']]) {
			ecosystemsObj[ecosystemData['uid']]['last_seen'] = now;
			ecosystemsObj[ecosystemData['uid']]['status'] = ecosystemData['status'];
		}
	}
	ecosystems.set(ecosystemsObj);
});

socketio.on('current_server_data', (data) => {
	//TODO: temporary workaround, to change
	const serverUid = 'base_server';
	const dataKey = getStoreDataKey(serverUid);
	const serversObj = get(servers);
	serversObj[dataKey]['last_seen'] = new Date();
	servers.set(serversObj);
	updateStoreData(serversCurrentData, { [dataKey]: data });
});

socketio.on('actuator_data', (data) => {
	const updatedData = data.reduce((a, v) => ({ ...a, [v['uid']]: v['data'] }), {});
	updateStoreData(ecosystemsActuatorData, updatedData);
});

socketio.on('current_sensors_data', (data) => {
	const updatedData = {};
	for (const sensorRecord of data) {
		const storageKey = getStoreDataKey(sensorRecord['sensor_uid'], sensorRecord['measure']);
		updatedData[storageKey] = {
			timestamp: new Date(sensorRecord['timestamp']),
			value: sensorRecord['value']
		};
	}
	updateStoreData(ecosystemsSensorsDataCurrent, updatedData);
});

socketio.on('historic_sensors_data_update', (data) => {
	const maxValues = 6 * 24 * 7; // one record every 10 mins for a week
	const updatedData = {};
	for (const sensorRecord of data) {
		const storageKey = getStoreDataKey(sensorRecord['sensor_uid'], sensorRecord['measure']);
		const currentData = getFreshStoreData(ecosystemsSensorsDataHistoric, storageKey);
		if (!currentData['values']) {
			// No historic data, will wait for some to be loaded from api before appending new data
			continue;
		}
		let values = currentData['values'];
		values.push([sensorRecord['timestamp'], sensorRecord['value']]);
		updatedData[storageKey] = {
			timestamp: new Date(sensorRecord['timestamp']),
			values: values.slice(-maxValues)
		};
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
