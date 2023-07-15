import { get } from 'svelte/store';
import { goto } from '$app/navigation';

import axios from 'axios';

import { API_URL, SERVER_STATUS, SERVER_URL } from '$lib/utils/consts.js';
import { Message, User } from '$lib/utils/factories.js';
import {
	dynamicSort,
	getStoreDataKey,
	checkSensorDataRecency,
	getStoreData,
	updateStoreData,
	isEmpty
} from '$lib/utils/functions.js';
import {
	currentUser,
	ecosystemsActuatorData,
	ecosystemsSensorsDataCurrent,
	ecosystemsSensorsDataHistoric,
	ecosystemsSensorsSkeleton,
	flashMessage
} from '$lib/store.js';
import { APP_MODE, AppMode } from '../conf.js';

const formatParam = function (param) {
	if (APP_MODE === AppMode.testing) {
		return null;
	} else {
		return param;
	}
};

export const fetchServerInfo = async function () {
	return await axios
		.get(`${SERVER_URL}/app/version`)
		.then((response) => {
			if (response.status === 200) {
				return {
					appVersion: response.data,
					serverStatus: SERVER_STATUS.connected
				};
			}
		})
		.catch(() => {
			return {
				appVersion: null,
				serverStatus: SERVER_STATUS.unreachable
			};
		});
};

// Auth-related actions
export const fetchCurrentUserData = async function (clientSessionCookie, clientUserAgent) {
	return axios
		.get(`${SERVER_URL}/auth/current_user`, {
			headers: {
				Cookie: clientSessionCookie,
				'User-Agent': clientUserAgent
			},
			withCredentials: true
		})
		.then((response) => {
			return {
				currentUserData: response.data
			};
		})
		.catch(() => {
			return {
				currentUserData: undefined
			};
		});
};

export const logIn = async function (username, password, remember = false) {
	return axios
		.get(`${API_URL}/auth/login`, {
			withCredentials: true,
			auth: {
				username: username,
				password: password
			},
			params: {
				remember: remember
			}
		})
		.then((response) => {
			if (response.status === 200) {
				const user = User(response.data.user);
				currentUser.set(user);
				const msgs = get(flashMessage);
				msgs.push(Message('You are now logged in ' + user.username));
				flashMessage.set(msgs);
				goto('/');
			}
		})
		.catch((fetchError) => {
			if (fetchError.response) {
				if (fetchError.response.status === 401) {
					return fetchError.response.data.detail;
				} else if (fetchError.response.status === 500) {
					return 'It seems like we have an issue on our side';
				}
			}
		});
};

export const logOut = function () {
	axios
		.get(`${API_URL}/auth/logout`, {
			withCredentials: true
		})
		.then((response) => {
			if (response.status === 200) {
				const user = User();
				currentUser.set(user);
			}
		})
		.catch((fetchError) => {
			console.log(fetchError);
		});
};

// Engines-related actions
export const fetchEngines = async function () {
	return axios
		.get(`${SERVER_URL}/gaia/engine`, {
			params: { engines_id: formatParam('recent') }
		})
		.then((response) => {
			const engines = response.data.reduce((a, v) => ({ ...a, [v['uid']]: v }), {});
			const sorted = response.data.sort(dynamicSort('uid'));
			const enginesIds = sorted.map((obj) => ({ uid: obj.uid, sid: obj.sid }));
			return {
				engines: engines,
				enginesIds: enginesIds
			};
		})
		.catch(() => {
			return {
				engines: {},
				enginesIds: []
			};
		});
};

// Ecosystems-related actions
export const fetchEcosystems = async function () {
	return axios
		.get(`${SERVER_URL}/gaia/ecosystem`, {
			params: { ecosystems_id: formatParam('recent') }
		})
		.then((response) => {
			const ecosystems = response.data.reduce((a, v) => ({ ...a, [v['uid']]: v }), {});
			const sorted = response.data.sort(dynamicSort('name'));
			const ecosystemsIds = sorted.map((obj) => ({ uid: obj.uid, name: obj.name }));

			return {
				ecosystems: ecosystems,
				ecosystemsIds: ecosystemsIds
			};
		})
		.catch(() => {
			return {
				ecosystems: {},
				ecosystemsIds: []
			};
		});
};

export const fetchEcosystemsManagement = async function () {
	return axios
		.get(`${SERVER_URL}/gaia/ecosystem/management`, {
			params: { ecosystems: formatParam('recent') }
		})
		.then((response) => {
			const object = response.data.reduce((a, v) => ({ ...a, [v['uid']]: v }), {});
			return {
				ecosystemsManagement: object
			};
		})
		.catch(() => {
			return {
				ecosystemsManagement: {}
			};
		});
};

export const fetchEcosystemLighting = async function (ecosystemUID) {
	return axios
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/light`)
		.then((response) => {
			return response.data;
		})
		.catch(() => {
			return {};
		});
};

export const fetchEcosystemEnvironmentParameters = async function (ecosystemUID) {
	return axios
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/environment_parameters`)
		.then((response) => {
			return response.data;
		})
		.catch(() => {
			return {};
		});
};

export const fetchEcosystemActuatorsData = async function (ecosystemUID) {
	return axios
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/actuators_status`)
		.then((response) => {
			const data = response['data'];
			ecosystemUID = data['ecosystem_uid'];
			delete data['ecosystem_uid'];
			updateStoreData(ecosystemsActuatorData, { [ecosystemUID]: data });
			return data;
		})
		.catch(() => {
			return {};
		});
};

export const fetchEcosystemHardware = async function (ecosystemUID) {
	return axios
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/hardware`)
		.then((response) => {
			return response.data;
		})
		.catch(() => {
			return {};
		});
};

export const fetchSensorCurrentData = async function (sensorUID, measure) {
	const dataKey = getStoreDataKey(sensorUID, measure);
	const storedData = getStoreData(ecosystemsSensorsDataCurrent, dataKey);
	if (checkSensorDataRecency(storedData, 1)) {
		return storedData;
	}
	return axios
		.get(`${API_URL}/gaia/ecosystem/current_data`, {
			params: { ecosystems: formatParam('recent') }
		})
		.then((response) => {
			const accumulator = {};
			for (const ecosystem of response['data']) {
				for (const sensorRecord of ecosystem['data']) {
					const storageKey = getStoreDataKey(sensorRecord['sensor_uid'], sensorRecord['measure']);
					accumulator[storageKey] = {
						timestamp: new Date(sensorRecord['timestamp']),
						value: sensorRecord['value']
					};
				}
			}
			updateStoreData(ecosystemsSensorsDataCurrent, accumulator);
			return accumulator[dataKey];
		})
		.catch(() => {
			return {};
		});
};

export const fetchSensorHistoricData = async function (sensorUID, measure) {
	const dataKey = getStoreDataKey(sensorUID, measure);
	const storedData = getStoreData(ecosystemsSensorsDataHistoric, dataKey);
	if (!isEmpty(storedData) && checkSensorDataRecency(storedData, 10)) {
		return storedData;
	}

	return axios
		.get(`${API_URL}/gaia/sensor/u/${sensorUID}/data/historic`, {
			params: { measures: measure }
		})
		.then((response) => {
			const data = {
				timestamp: new Date(response.data[0].span[1]),
				values: response.data[0].values
			};
			updateStoreData(ecosystemsSensorsDataHistoric, { [dataKey]: data });
			return data;
		})
		.catch(() => {
			return {};
		});
};

export const fetchEcosystemSensorsSkeleton = async function (ecosystemUID, level = null) {
	const dataKey = getStoreDataKey(ecosystemUID, level);
	const storedData = getStoreData(ecosystemsSensorsSkeleton, dataKey);
	if (!isEmpty(storedData)) {
		return storedData;
	}
	return axios
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/sensors_skeleton`, {
			params: { level: level }
		})
		.then((response) => {
			const rv = {};
			for (const measureRecord of response['data']['sensors_skeleton']) {
				const sensorAccumulator = {};
				for (const sensor of measureRecord.sensors) {
					sensorAccumulator[sensor['uid']] = sensor.name;
				}
				rv[measureRecord.measure] = sensorAccumulator;
			}
			updateStoreData(ecosystemsSensorsSkeleton, { [dataKey]: rv });
			return rv;
		})
		.catch(() => {
			return {};
		});
};

// Weather-related actions
export const fetchWeatherForecast = async function (exclude = null) {
	return axios
		.get(`${API_URL}/weather/forecast`, {
			params: { exclude: exclude }
		})
		.then((response) => {
			let weatherCurrently = {};
			let weatherHourly = [];
			let weatherDaily = [];

			if (Object.prototype.hasOwnProperty.call(response.data, 'currently')) {
				weatherCurrently = response.data.currently;
			}
			if (Object.prototype.hasOwnProperty.call(response.data, 'hourly')) {
				weatherHourly = response.data.hourly;
			}
			if (Object.prototype.hasOwnProperty.call(response.data, 'daily')) {
				weatherDaily = response.data.daily;
			}

			return {
				weatherCurrentlyValue: weatherCurrently,
				weatherHourlyValue: weatherHourly,
				weatherDailyValue: weatherDaily
			};
		})
		.catch(() => {
			return {
				weatherCurrentlyValue: {},
				weatherHourlyValue: [],
				weatherDailyValue: []
			};
		});
};

// Server-related actions
export const fetchServerCurrentData = async function (clientSessionCookie, clientUserAgent) {
	return axios
		.get(`${SERVER_URL}/system/data/current`, {
			headers: {
				Cookie: clientSessionCookie,
				'User-Agent': clientUserAgent
			},
			withCredentials: true
		})
		.then((response) => {
			return {
				serverCurrentData: response.data.values
			};
		})
		.catch(() => {
			return {
				serverCurrentData: {}
			};
		});
};

export const fetchServerStartTime = async function (clientSessionCookie, clientUserAgent) {
	return axios
		.get(`${SERVER_URL}/system/start_time`, {
			headers: {
				Cookie: clientSessionCookie,
				'User-Agent': clientUserAgent
			},
			withCredentials: true
		})
		.then((response) => {
			return {
				serverStartTime: response.data
			};
		})
		.catch(() => {
			return {
				serverStartTime: null
			};
		});
};

export const fetchServices = async function () {
	return axios
		.get(`${SERVER_URL}/app/services`)
		.then((response) => {
			return {
				services: response.data
			};
		})
		.catch(() => {
			return {
				services: []
			};
		});
};

export const fetchWarnings = async function () {
	return axios
		.get(`${SERVER_URL}/gaia/warning`)
		.then((response) => {
			return {
				warnings: response.data
			};
		})
		.catch(() => {
			return {
				warnings: []
			};
		});
};

export const crudRequest = function (relRoute, action, payload) {
	let method;
	if (action === 'create') {
		method = 'post';
	} else if (action === 'update') {
		method = 'put';
	} else if (action === 'delete') {
		method = 'delete';
	} else {
		throw Error;
	}

	const options = {
		method: method,
		withCredentials: true
	};
	if (action !== 'delete') {
		options['data'] = payload;
	}

	return axios(`${API_URL}/${relRoute}`, options)
		.then((response) => {
			const msgs = get(flashMessage);
			msgs.push(Message(response.data.msg, null, 3000));
			flashMessage.set(msgs);
		})
		.catch((error) => {
			const msgs = get(flashMessage);
			if (error.response.data.msg) {
				msgs.push(Message(error.response.data.msg));
			} else {
				msgs.push(Message(error.response.data));
			}
			flashMessage.set(msgs);
		});
};

export const updateActuatorMode = function (ecosystemUID, actuatorType, mode) {
	return axios(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/turn_actuator`, {
		method: 'put',
		withCredentials: true,
		data: {
			actuator: actuatorType,
			mode: mode
		}
	})
		.then((response) => {
			const msgs = get(flashMessage);
			msgs.push(Message(response.data.msg, null, 1500));
			flashMessage.set(msgs);
		})
		.catch((error) => {
			const msgs = get(flashMessage);
			if (error.response.data.msg) {
				msgs.push(Message(error.response.data.msg));
			} else {
				msgs.push(Message(error.response.data));
			}
			flashMessage.set(msgs);
		});
};
