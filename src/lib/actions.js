import { get } from 'svelte/store';
import { goto } from '$app/navigation';

import axios from 'axios';

import { API_URL, eventLevels, SERVER_STATUS, LOCAL_API_URL } from '$lib/utils/consts.js';
import { Message, User } from '$lib/utils/factories.js';
import {
	checkSensorDataRecency,
	dynamicSort,
	getFreshStoreData,
	getStoreDataKey,
	isEmpty,
	updateStoreData
} from '$lib/utils/functions.js';
import {
	currentUser,
	ecosystemsActuatorData,
	ecosystemsLightData,
	ecosystemsSensorsDataCurrent,
	ecosystemsSensorsDataHistoric,
	ecosystemsSensorsSkeleton,
	flashMessage,
	weatherCurrently,
	weatherDaily,
	weatherHourly
} from '$lib/store.js';

export const fetchServerInfo = async function () {
	return await axios
		.get(`${LOCAL_API_URL}/app/version`)
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
		.get(`${LOCAL_API_URL}/auth/current_user`, {
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

const extractEngineOrEcosystemData = function (dataArray, engineOrEcosystem) {
	dataArray.forEach((element) => {
		element['last_seen'] = new Date(element['last_seen']);
		element['registration_date'] = new Date(element['registration_date']);
	});
	const dataObject = dataArray.reduce((a, v) => ({ ...a, [v['uid']]: v }), {});
	const sortKey = engineOrEcosystem === 'engine' ? 'uid' : 'name';
	const sorted = dataArray.sort(dynamicSort(sortKey));
	const secKey = engineOrEcosystem === 'engine' ? 'sid' : 'name';
	const IDsArray = sorted.map((obj) => ({ uid: obj['uid'], [secKey]: obj[secKey] }));
	return {
		dataObject: dataObject,
		IDsArray: IDsArray
	};
};

// Engines-related actions
export const fetchEngines = async function () {
	return axios
		.get(`${LOCAL_API_URL}/gaia/engine`, {
			params: { engines_id: 'recent' }
		})
		.then((response) => {
			const data = response.data;
			const extracted = extractEngineOrEcosystemData(data, 'engine');
			return {
				engines: extracted['dataObject'],
				enginesIds: extracted['IDsArray']
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
		.get(`${LOCAL_API_URL}/gaia/ecosystem`, {
			params: { ecosystems_id: 'recent' }
		})
		.then((response) => {
			const data = response.data;
			const extracted = extractEngineOrEcosystemData(data, 'ecosystem');
			return {
				ecosystems: extracted['dataObject'],
				ecosystemsIds: extracted['IDsArray']
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
		.get(`${LOCAL_API_URL}/gaia/ecosystem/management`, {
			params: { ecosystems: 'recent' }
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

export const fetchEcosystemLightData = async function (ecosystemUID) {
	const dataKey = getStoreDataKey(ecosystemUID);
	const storedData = getFreshStoreData(ecosystemsLightData, dataKey);
	if (!isEmpty(storedData)) {
		return storedData;
	}
	return axios
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/light`)
		.then((response) => {
			const data = response.data;
			delete data['ecosystem_uid'];
			updateStoreData(ecosystemsLightData, { [dataKey]: data });
			return data;
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
	const dataKey = getStoreDataKey(ecosystemUID);
	const storedData = getFreshStoreData(ecosystemsActuatorData, dataKey);
	if (!isEmpty(storedData)) {
		return storedData;
	}
	return axios
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/actuators_status`)
		.then((response) => {
			const data = response.data;
			delete data['ecosystem_uid'];
			updateStoreData(ecosystemsActuatorData, { [dataKey]: data });
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
	const storedData = getFreshStoreData(ecosystemsSensorsDataCurrent, dataKey);
	if (checkSensorDataRecency(storedData, 1)) {
		return storedData;
	}
	return axios
		.get(`${API_URL}/gaia/ecosystem/current_data`, {
			params: { ecosystems: 'recent' }
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
	const storedData = getFreshStoreData(ecosystemsSensorsDataHistoric, dataKey);
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
	const storedData = getFreshStoreData(ecosystemsSensorsSkeleton, dataKey);
	if (!isEmpty(storedData)) {
		return storedData;
	}
	return axios
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/sensors_skeleton`, {
			params: { level: level }
		})
		.then((response) => {
			const data = response['data']['sensors_skeleton'];
			updateStoreData(ecosystemsSensorsSkeleton, { [dataKey]: data });
			return data;
		})
		.catch(() => {
			return {};
		});
};

// Weather-related actions
export const loadWeatherForecast = async function (include = null) {
	if (include === null) {
		include = ['currently', 'hourly', 'daily'];
	}
	if (include.includes('currently') && !isEmpty(get(weatherCurrently))) {
		include.filter((element) => element !== 'currently');
	}
	if (include.includes('hourly') && get(weatherHourly).length > 0) {
		include.filter((element) => element !== 'hourly');
	}
	if (include.includes('daily') && get(weatherDaily).length > 0) {
		include.filter((element) => element !== 'daily');
	}

	let exclude = ['currently', 'hourly', 'daily'];
	exclude.filter((element) => !include.includes(element));

	if (exclude.length >= 3) {
		return; // Useless call, already have all the data
	}

	return axios
		.get(`${API_URL}/weather/forecast`, {
			params: { exclude: exclude.join(',') }
		})
		.then((response) => {
			if (Object.prototype.hasOwnProperty.call(response.data, 'currently')) {
				weatherCurrently.set(response.data['currently']);
			}
			if (Object.prototype.hasOwnProperty.call(response.data, 'hourly')) {
				weatherHourly.set(response.data['hourly']);
			}
			if (Object.prototype.hasOwnProperty.call(response.data, 'daily')) {
				weatherDaily.set(response.data['daily']);
			}
		})
		.catch(() => {
			// TODO: handle
		});
};

// Server-related actions
export const fetchServerCurrentData = async function (clientSessionCookie, clientUserAgent) {
	return axios
		.get(`${LOCAL_API_URL}/system/data/current`, {
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
		.get(`${LOCAL_API_URL}/system/start_time`, {
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
		.get(`${LOCAL_API_URL}/app/services`)
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

export const fetchWarnings = async function (clientSessionCookie, clientUserAgent) {
	return axios
		.get(`${LOCAL_API_URL}/gaia/warning`, {
			headers: {
				Cookie: clientSessionCookie,
				'User-Agent': clientUserAgent
			},
			withCredentials: true
		})
		.then((response) => {
			const warnings = response.data;
			warnings.forEach((warning) => {
				warning['created_on'] = new Date(warning['created_on']);
				warning['level'] = eventLevels[warning['level']];
			});
			return {
				warnings: warnings
			};
		})
		.catch(() => {
			return {
				warnings: []
			};
		});
};

export const fetchCalendarEvents = async function (clientSessionCookie, clientUserAgent) {
	return axios
		.get(`${LOCAL_API_URL}/app/services/calendar`, {
			headers: {
				Cookie: clientSessionCookie,
				'User-Agent': clientUserAgent
			},
			withCredentials: true
		})
		.then((response) => {
			const events = response.data;
			events.forEach((event) => {
				event['start_time'] = new Date(event['start_time']);
				event['end_time'] = new Date(event['end_time']);
				event['level'] = eventLevels[event['level']];
			});
			return {
				events: events
			};
		})
		.catch(() => {
			const events = [];
			return {
				events: events
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
