import { get } from 'svelte/store';
import { Manager } from 'socket.io-client';

import { APP_MODE, BASE_URL, getAppMode } from '$lib/utils/consts.js';
import {
	currentUser,
	ecosystems,
	ecosystemsActuatorsState,
	ecosystemsLightData,
	ecosystemsManagement,
	ecosystemsSensorsDataCurrent,
	ecosystemsSensorsDataHistoric,
	engines,
	getFreshStoreData,
	getStoreDataKey,
	pingServerLastSeen,
	pingServerLatency,
	servers,
	serversCurrentData,
	updateStoreData,
	weatherCurrently,
	weatherDaily,
	weatherHourly
} from '$lib/store.svelte.js';

// Socket.IO manager, connection and disconnection
const manager = new Manager(BASE_URL, {
	autoConnect: false,
	reconnectionDelayMax: 30000,
	transports: ['websocket', 'polling']
});

export const socketio = manager.socket('/');

export const connectSocketio = function () {
	socketio.connect();
};

export const disconnectSocketio = function () {
	socketio.disconnect();
};

// Ping-related events
let latencyArray = [];
let pingTime = null;
let pingLoop = null;

const pingServer = function () {
	pingTime = new Date();
	socketio.emit('ping');
};

socketio.on('connect', () => {
	pingLoop = setInterval(pingServer, 10000);
});

socketio.on('disconnect', () => {
	clearInterval(pingLoop);
});

socketio.on('pong', () => {
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

// User-related events
let userHeartbeatLoop = null;

const userHeartbeat = function (userToken) {
	return function () {
		socketio.emit('user_heartbeat', userToken);
	};
};

export const logInSocketio = function (userToken) {
	socketio.emit('login', userToken);
	userHeartbeat(userToken)();
	userHeartbeatLoop = setInterval(userHeartbeat(userToken), 30000);
};

socketio.on('login_ack', (data) => {
	if (data['result'] === 'failure') {
		clearInterval(userHeartbeatLoop);
		const appMode = getAppMode();
		if (appMode === APP_MODE.development) {
			console.log(data);
		} else {
			console.log(
				'There was an issue registering your socketio session. Please contact the administrator.'
			);
		}
	}
});

export const logOutSocketio = function (userToken) {
	socketio.emit('logout', userToken);
	userHeartbeat(userToken)();
	clearInterval(userHeartbeatLoop);
};

socketio.on('logout_ack', (data) => {
	// For later use
});

socketio.on('user_heartbeat_ack', () => {
	const user = get(currentUser);
	user.last_seen = new Date();
	currentUser.set(user);
});

// Rooms
export const joinRoom = function (roomName) {
	socketio.emit('join_room', roomName);
};

socketio.on('join_room_ack', (data) => {
	if (data['result'] === 'failure') {
		const appMode = getAppMode();
		if (appMode === APP_MODE.development) {
			console.log(data);
		} else {
			console.log(
				'There was an issue joining the requested room. Please contact the administrator.'
			);
		}
	}
});

export const leaveRoom = function (roomName) {
	socketio.emit('leave_room', roomName);
};

socketio.on('leave_room_ack', (data) => {
	if (data['result'] === 'failure') {
		const appMode = getAppMode();
		if (appMode === APP_MODE.development) {
			console.log(data);
		} else {
			console.log(
				'There was an issue leaving the requested room. Please contact the administrator.'
			);
		}
	}
});

// Weather
socketio.on('weather_current', (data) => {
	weatherCurrently.set(data);
});

socketio.on('weather_hourly', (data) => {
	weatherHourly.set(data);
});

socketio.on('weather_daily', (data) => {
	weatherDaily.set(data);
});

// Ecosystems
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
	if (serversObj[dataKey]) {
		serversObj[dataKey]['last_seen'] = new Date();
		servers.set(serversObj);
		updateStoreData(serversCurrentData, { [dataKey]: data });
	}
});

socketio.on('actuators_data', (data) => {
	const dataByEcosystem = data.reduce((acc, record) => {
		const ecosystemUid = record['ecosystem_uid'];
		if (!acc[ecosystemUid]) {
			acc[ecosystemUid] = {};
		}
		acc[ecosystemUid][record['type']] = {
			active: record['active'] || false,
			level: record['level'] || null,
			mode: record['mode'] || 'automatic',
			status: record['status'] || false,
			type: record['type']
		};
		return acc;
	}, {});

	const currentEcosystemsActuatorData = get(ecosystemsActuatorsState);
	for (const ecosystemUid in dataByEcosystem) {
		currentEcosystemsActuatorData[ecosystemUid] = {
			...currentEcosystemsActuatorData[ecosystemUid],
			...dataByEcosystem[ecosystemUid]
		};
	}
	updateStoreData(ecosystemsActuatorsState, currentEcosystemsActuatorData);
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
		const timestamp = new Date(sensorRecord['timestamp']);
		const lowerSpan = new Date(timestamp - 1000 * 60 * 60 * 24 * 7);
		updatedData[storageKey] = {
			span: [lowerSpan, timestamp],
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
