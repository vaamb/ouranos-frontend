import { get } from 'svelte/store';

import axios from 'axios';

import {
	actuatorTypes,
	API_URL,
	APP_MODE,
	CONNECTION_STATUS,
	eventLevels,
	getAppMode,
	LOCAL_API_URL,
	SERVER_STATUS
} from '$lib/utils/consts.js';
import { Message, User } from '$lib/utils/factories.js';
import { isEmpty, slugify } from '$lib/utils/functions.js';
import { logInSocketio, logOutSocketio } from '$lib/socketio.svelte.js';
import {
	currentUser,
	ecosystemsActuatorsRecords,
	ecosystemsActuatorsState,
	ecosystemsNycthemeralCycle,
	ecosystemsSensorsDataCurrent,
	ecosystemsSensorsDataHistoric,
	ecosystemsSensorsSkeleton,
	flashMessage,
	getFreshStoreData,
	getStoreDataKey,
	serversCurrentData,
	serversHistoricData,
	updateStoreData,
	weatherCurrently,
	weatherDaily,
	weatherHourly
} from '$lib/store.svelte.js';

// Flash messages utility functions
const ERROR_MSG =
	'There was one or more error(s) while processing your request. Please contact the administrator.';

const setFlashMsgError = function (error) {
	const appMode = getAppMode();
	let errorMsg;
	if (appMode === APP_MODE.development) {
		console.log(error);
		if (error.response.data.detail !== undefined) {
			errorMsg = Message(error.response.data.detail, 'Encountered an error');
		} else {
			errorMsg = Message(JSON.stringify(error.response.data), 'Encountered an error');
		}
	} else {
		errorMsg = Message(ERROR_MSG);
	}
	const msgs = get(flashMessage);
	msgs.push(errorMsg);
	flashMessage.set(msgs);
};

export const probePath = async function (path) {
	return await axios
		.get(path)
		.then((response) => {
			return response.status === 200;
		})
		.catch(() => {
			return false;
		});
};

// Server-related actions
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
				const sessionToken = response.data.session_token;
				const user = User(response.data.user, sessionToken);
				currentUser.set(user);
				const msgs = get(flashMessage);
				msgs.push(Message('You are now logged in ' + user.username));
				flashMessage.set(msgs);
				logInSocketio(sessionToken);
				return {
					success: true,
					msg: null
				};
			} else {
				return {
					success: false,
					msg: ERROR_MSG
				};
			}
		})
		.catch((error) => {
			if (error.response) {
				if (error.response.status === 401) {
					return {
						success: false,
						msg: error.response.data.detail
					};
				} else if (error.response.status === 500) {
					return {
						success: false,
						msg: ERROR_MSG
					};
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
				const user = get(currentUser);
				currentUser.set(User());
				logOutSocketio(user.sessionToken);
			}
		})
		.catch((error) => {
			setFlashMsgError(error);
		});
};

// Engines and Ecosystems related utility functions
const checkSensorDataRecency = function (sensorData, minuteModulo) {
	if (!isEmpty(sensorData)) {
		const timestamp = new Date(sensorData['timestamp']);
		const timeSinceLastRecordThreshold = timestamp % (minuteModulo * 60 * 1000);
		const lastRecordThreshold = timestamp - timeSinceLastRecordThreshold;
		const now = new Date();
		return now - lastRecordThreshold <= (minuteModulo + 1) * 60 * 1000;
	} else {
		return false;
	}
};

// Engines-related actions
export const fetchEngines = async function () {
	return axios
		.get(`${LOCAL_API_URL}/gaia/engine`, {
			params: { engines_id: 'recent' }
		})
		.then((response) => {
			const data = response['data'];
			let enginesState = {};
			data.forEach((element) => {
				// Use a date for 'registration_date'
				element['registration_date'] = new Date(element['registration_date']);

				// Transfer 'last_seen' and 'connected' to enginesState
				const engineState = {};
				engineState['last_seen'] = new Date(element['last_seen']);
				delete element['last_seen'];
				engineState['connected'] = element['connected']
					? CONNECTION_STATUS.CONNECTED
					: CONNECTION_STATUS.DISCONNECTED;
				delete element['connected'];
				enginesState[element['uid']] = engineState;
			});
			return {
				info: data.reduce((a, v) => ({ ...a, [v['uid']]: v }), {}),
				states: enginesState
			};
		})
		.catch(() => {
			return {
				info: {},
				states: {}
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
			const data = response['data'];
			let ecosystemsState = {};
			data.forEach((element) => {
				// Use a date for 'registration_date'
				element['registration_date'] = new Date(element['registration_date']);

				// Transfer 'last_seen' and 'connected' to ecosystemsState
				const ecosystemState = {};
				ecosystemState['status'] = element['status'];
				delete element['status'];
				ecosystemState['last_seen'] = new Date(element['last_seen']);
				delete element['last_seen'];
				ecosystemState['connected'] = element['connected']
					? CONNECTION_STATUS.CONNECTED
					: CONNECTION_STATUS.DISCONNECTED;
				delete element['connected'];
				ecosystemsState[element['uid']] = ecosystemState;
			});
			return {
				info: data.reduce((a, v) => ({ ...a, [v['uid']]: v }), {}),
				states: ecosystemsState
			};
		})
		.catch(() => {
			return {
				info: {},
				states: {}
			};
		});
};

export const fetchEcosystemsManagement = async function () {
	return axios
		.get(`${LOCAL_API_URL}/gaia/ecosystem/management`, {
			params: { ecosystems: 'recent' }
		})
		.then((response) => {
			return response.data.reduce((a, v) => ({ ...a, [v['uid']]: v }), {});
		})
		.catch(() => {
			return {};
		});
};

export const fetchEcosystemNycthemeralCycleData = async function (ecosystemUID) {
	const dataKey = getStoreDataKey(ecosystemUID);
	const storedData = getFreshStoreData(ecosystemsNycthemeralCycle, dataKey);
	if (!isEmpty(storedData)) {
		return storedData;
	}
	return axios
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/light`)
		.then((response) => {
			const data = response.data;
			delete data['ecosystem_uid'];
			updateStoreData(ecosystemsNycthemeralCycle, { [dataKey]: data });
			return data;
		})
		.catch(() => {
			return {};
		});
};

export const fetchEcosystemEnvironmentParameters = async function (ecosystemUID) {
	return axios
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/environment_parameter`)
		.then((response) => {
			return response['data']['environment_parameters'];
		})
		.catch(() => {
			return [];
		});
};

export const fetchEcosystemActuatorsState = async function (ecosystemUID) {
	const dataKey = getStoreDataKey(ecosystemUID);
	const storedData = getFreshStoreData(ecosystemsActuatorsState, dataKey);
	if (!isEmpty(storedData)) {
		return storedData;
	}
	return axios
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/actuators_state`)
		.then((response) => {
			const data = response.data;
			const states = data['actuators_state'].reduce((a, v) => ({ ...a, [v['type']]: v }), {});
			for (const actuatorType of actuatorTypes) {
				storedData[actuatorType] = states[actuatorType];
			}
			updateStoreData(ecosystemsActuatorsState, { [dataKey]: storedData });
			return data;
		})
		.catch(() => {
			return {};
		});
};

export const fetchEcosystemActuatorRecords = async function (ecosystemUID, actuatorType) {
	const dataKey = getStoreDataKey(ecosystemUID, actuatorType);
	const storedData = getFreshStoreData(ecosystemsActuatorsRecords, dataKey);
	if (!isEmpty(storedData) && checkSensorDataRecency(storedData, 1)) {
		return storedData;
	}
	return axios
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/actuator_records/u/${actuatorType}`)
		.then((response) => {
			const data = {
				timestamp: new Date(response['data']['span'][1]),
				span: response['data']['span'],
				values: response['data']['values']
			};
			updateStoreData(ecosystemsActuatorsRecords, { [dataKey]: data });
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
			return [];
		});
};

export const fetchSensorCurrentData = async function (ecosystemUID, sensorUID, measure) {
	const dataKey = getStoreDataKey(sensorUID, measure);
	const storedData = getFreshStoreData(ecosystemsSensorsDataCurrent, dataKey);
	if (checkSensorDataRecency(storedData, 1)) {
		return storedData;
	}
	return axios
		.get(`${API_URL}/gaia/ecosystem/sensor/data/current`, {
			params: { ecosystems: 'recent' }
		})
		.then((response) => {
			const accumulator = {};
			for (const ecosystem of response['data']) {
				for (const sensorRecord of ecosystem['values']) {
					const storageKey = getStoreDataKey(sensorRecord['sensor_uid'], sensorRecord['measure']);
					accumulator[storageKey] = {
						timestamp: new Date(sensorRecord['timestamp']),
						value: sensorRecord['value']
					};
				}
			}
			// Special case when 'priming' the store
			if (sensorUID === 'priming') {
				accumulator[dataKey] = {
					timestamp: new Date(),
					value: true
				};
			}
			updateStoreData(ecosystemsSensorsDataCurrent, accumulator);
			return accumulator[dataKey];
		})
		.catch(() => {
			return {};
		});
};

export const fetchSensorHistoricData = async function (
	ecosystemUID,
	sensorUID,
	measure,
	windowLength = undefined
) {
	const dataKey = getStoreDataKey(sensorUID, measure);
	const storedData = getFreshStoreData(ecosystemsSensorsDataHistoric, dataKey);
	if (!isEmpty(storedData) && checkSensorDataRecency(storedData, 10)) {
		return storedData;
	}

	return axios
		.get(
			`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/sensor/u/${sensorUID}/data/${measure}/historic`,
			{
				params: { window_length: windowLength }
			}
		)
		.then((response) => {
			const data = {
				timestamp: new Date(response['data']['span'][1]),
				span: response['data']['span'],
				values: response['data']['values']
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
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/sensor/skeleton`, {
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

export const fetchCameraPicturesInfo = async function (ecosystemUID) {
	return axios
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/image_info`)
		.then((response) => {
			const cameraPicturesInfo = response['data'];
			cameraPicturesInfo.forEach((info) => {
				info['timestamp'] = new Date(info['timestamp']);
			});
			return cameraPicturesInfo.reduce((a, v) => ({ ...a, [v['camera_uid']]: v }), {});
		})
		.catch(() => {
			return {};
		});
};

// Weather-related actions
export const fetchWeatherForecast = async function (include = ['currently', 'hourly', 'daily']) {
	let exclude = ['currently', 'hourly', 'daily'];

	// TODO: check for data recency
	if (include.includes('currently') && isEmpty(get(weatherCurrently))) {
		exclude = exclude.filter((element) => element !== 'currently');
	}
	if (include.includes('hourly') && !get(weatherHourly).length > 0) {
		exclude = exclude.filter((element) => element !== 'hourly');
	}
	if (include.includes('daily') && !get(weatherDaily).length > 0) {
		exclude = exclude.filter((element) => element !== 'daily');
	}

	if (exclude.length >= 3) {
		return; // Useless call, already have all the data
	}

	let params = new URLSearchParams();
	if (exclude.length > 0) {
		for (const param of exclude) {
			params.append('exclude', param);
		}
	}

	return axios
		.get(`${API_URL}/app/services/weather/forecast`, {
			params: params
		})
		.then((response) => {
			if (response['data']['currently']) {
				weatherCurrently.set(response['data']['currently']);
			}
			if (response['data']['hourly']) {
				weatherHourly.set(response['data']['hourly']);
			}
			if (response['data']['daily']) {
				weatherDaily.set(response['data']['daily']);
			}
		})
		.catch(() => {
			if (!exclude.includes('currently')) {
				weatherCurrently.set({});
			}
			if (!exclude.includes('hourly')) {
				weatherHourly.set([]);
			}
			if (!exclude.includes('daily')) {
				weatherDaily.set([]);
			}
		});
};

export const fetchSuntimes = async function () {
	return axios
		.get(`${API_URL}/app/services/weather/sun_times`)
		.then((response) => {
			let data = response['data'];
			data.forEach((element) => {
				const datestamp = element['datestamp'];
				Object.entries(element).forEach(([key, value]) => {
					if (key !== 'datestamp') {
						element[key] = new Date(`${datestamp}T${element[key]}`);
					}
				});
				element['datestamp'] = new Date(datestamp);
			});
			return data;
		})
		.catch(() => {
			return {};
		});
};

// Server-related actions
export const fetchServers = async function (clientSessionCookie, clientUserAgent) {
	return axios
		.get(`${LOCAL_API_URL}/system`, {
			headers: {
				Cookie: clientSessionCookie,
				'User-Agent': clientUserAgent
			},
			withCredentials: true
		})
		.then((response) => {
			const servers = response.data;
			servers.forEach((server) => {
				server['start_time'] = new Date(server['start_time']);
				server['last_seen'] = new Date();
			});
			return servers.reduce((a, v) => ({ ...a, [v['uid']]: v }), {});
		})
		.catch(() => {
			return {};
		});
};

export const fetchServerCurrentData = async function (serverUid) {
	const dataKey = getStoreDataKey(serverUid);
	const storedData = getFreshStoreData(serversCurrentData, dataKey);

	if (!isEmpty(storedData)) {
		return storedData;
	}

	return axios
		.get(`${API_URL}/system/${serverUid}/data/current`, {
			withCredentials: true
		})
		.then((response) => {
			const data = response['data']['values'];
			updateStoreData(serversCurrentData, { [dataKey]: data });
			return data;
		})
		.catch(() => {
			const data = [];
			updateStoreData(serversCurrentData, { [dataKey]: data });
			return data;
		});
};

export const fetchServerHistoricData = async function (serverUid) {
	const dataKey = getStoreDataKey(serverUid);
	const storedData = getFreshStoreData(serversHistoricData, dataKey);

	if (!isEmpty(storedData)) {
		return storedData;
	}

	return axios
		.get(`${API_URL}/system/${serverUid}/data/historic`, {
			withCredentials: true
		})
		.then((response) => {
			const data = response['data']['values'];
			updateStoreData(serversHistoricData, { [dataKey]: data });
			return data;
		})
		.catch(() => {
			const data = [];
			updateStoreData(serversHistoricData, { [dataKey]: data });
			return data;
		});
};

export const fetchServices = async function (local = true) {
	const URL = local ? LOCAL_API_URL : API_URL;
	return axios
		.get(`${URL}/app/services`)
		.then((response) => {
			return response.data;
		})
		.catch(() => {
			return [];
		});
};

export const updateService = async function (serviceName, status) {
	return axios(`${API_URL}/app/services/u/${serviceName}`, {
		method: 'put',
		withCredentials: true,
		data: { status: status }
	})
		.then((response) => {
			const msgs = get(flashMessage);
			msgs.push(Message(response.data, null, 1500));
			flashMessage.set(msgs);
		})
		.catch((error) => {
			setFlashMsgError(error);
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
			return warnings;
		})
		.catch(() => {
			return [];
		});
};

// Calendar-related actions
export const fetchCalendarEvents = async function (
	startTime = undefined,
	endTime = undefined,
	limit = 10
) {
	return axios
		.get(`${API_URL}/app/services/calendar`, {
			params: {
				start_time: startTime,
				end_time: endTime,
				limit: limit
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
			return events;
		})
		.catch(() => {
			return [];
		});
};

export const fetchWikiTopics = async function () {
	return axios
		.get(`${LOCAL_API_URL}/app/services/wiki/topics`)
		.then((response) => {
			return response.data;
		})
		.catch(() => {
			return [];
		});
};

export const fetchWikiArticles = async function (topic_name) {
	return axios
		.get(`${LOCAL_API_URL}/app/services/wiki/topics/u/${topic_name}/articles`)
		.then((response) => {
			return response.data;
		})
		.catch(() => {
			return [];
		});
};

export const fetchWikiPictures = async function (topic_name, article_name) {
	return axios
		.get(`${LOCAL_API_URL}/app/services/wiki/topics/u/${topic_name}/u/${article_name}/pictures`)
		.then((response) => {
			return response.data;
		})
		.catch(() => {
			return [];
		});
};

// User-related actions
export const fetchUserDescription = async function (
	clientSessionCookie,
	clientUserAgent,
	username
) {
	return axios
		.get(`${LOCAL_API_URL}/user/u/${username}`, {
			headers: {
				Cookie: clientSessionCookie,
				'User-Agent': clientUserAgent
			},
			withCredentials: true
		})
		.then((response) => {
			return response.data;
		})
		.catch(() => {
			return undefined;
		});
};

export const fetchUsers = async function (page) {
	return axios
		.get(`${API_URL}/user`, {
			params: {
				page: page
			},
			withCredentials: true
		})
		.then((response) => {
			return response.data;
		})
		.catch(() => {
			return [];
		});
};

export const crudRequest = function (relRoute, action, payload = undefined) {
	let method;
	if (action === 'create') {
		method = 'post';
	} else if (action === 'update') {
		method = 'put';
	} else if (action === 'delete') {
		method = 'delete';
	} else if (action === 'get') {
		method = 'get';
	} else {
		throw Error;
	}

	const options = {
		method: method,
		withCredentials: true
	};
	if (payload !== undefined) {
		options['data'] = payload;
	}

	return axios(`${API_URL}/${relRoute}`, options)
		.then((response) => {
			const msgs = get(flashMessage);
			msgs.push(Message(response.data, null, 3000));
			flashMessage.set(msgs);
		})
		.catch((error) => {
			setFlashMsgError(error);
		});
};

export const updateActuatorMode = function (ecosystemUID, actuatorType, mode, countdown = null) {
	return axios(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/turn_actuator/u/${actuatorType}`, {
		method: 'put',
		withCredentials: true,
		data: {
			mode: mode,
			countdown: countdown || 0
		}
	})
		.then((response) => {
			const msgs = get(flashMessage);
			msgs.push(Message(response.data, null, 1500));
			flashMessage.set(msgs);
		})
		.catch((error) => {
			setFlashMsgError(error);
		});
};
