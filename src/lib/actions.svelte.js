import axios from 'axios';

import {
	actuatorTypes,
	API_URL,
	APP_MODE,
	getAppMode
} from '$lib/utils/consts.js';
import { createFlashMessage, createUser } from '$lib/utils/factories.js';
import { isEmpty } from '$lib/utils/functions.js';
import { logInSocketio, logOutSocketio } from '$lib/socketio.svelte.js';
import {
	appState,
	gaiaState,
	getFreshStateData,
	getKey,
	infraState,
	servicesState
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
			errorMsg = createFlashMessage(error.response.data.detail, 'Encountered an error');
		} else {
			errorMsg = createFlashMessage(JSON.stringify(error.response.data), 'Encountered an error');
		}
	} else {
		errorMsg = createFlashMessage(ERROR_MSG);
	}
	appState.flashMessages.push(errorMsg);
};

//TODO: move in utils ?
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

// Auth-related actions
export const refreshSessionCookie = async function () {
	return axios.get(`${API_URL}/auth/refresh_session`, {
		withCredentials: true
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
				const user = createUser(response.data.user, sessionToken);
				appState.currentUser = user;
				appState.flashMessages.push(createFlashMessage('You are now logged in ' + user.username));
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
				const user = appState.currentUser;
				appState.currentUser = createUser();
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

// Ecosystems-related actions
export const fetchEcosystemNycthemeralCycleData = async function (ecosystemUID) {
	const dataKey = getKey(ecosystemUID);
	const storedData = getFreshStateData(gaiaState.ecosystemsNycthemeralCycle, dataKey);
	if (storedData !== null) {
		return storedData;
	}
	return axios
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/light`)
		.then((response) => {
			const data = response.data;
			delete data['ecosystem_uid'];
			gaiaState.ecosystemsNycthemeralCycle[dataKey] = data;
			return data;
		})
		.catch(() => {
			return {};
		});
};

export const fetchEcosystemActuatorsState = async function (ecosystemUID) {
	const dataKey = getKey(ecosystemUID);
	const storedData = getFreshStateData(gaiaState.ecosystemsActuatorsState, dataKey);
	if (storedData !== null) {
		return storedData;
	}
	return axios
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/actuators_state`)
		.then((response) => {
			const data = response.data;
			const states = data['actuators_state'].reduce((a, v) => ({ ...a, [v['type']]: v }), {});
			const result = {};
			for (const actuatorType of actuatorTypes) {
				result[actuatorType] = states[actuatorType];
			}
			gaiaState.ecosystemsActuatorsState[dataKey] = result;
			return result;
		})
		.catch(() => {
			return {};
		});
};

export const fetchSensorCurrentData = async function (ecosystemUID, sensorUID, measure) {
	const dataKey = getKey(sensorUID, measure);
	const storedData = getFreshStateData(gaiaState.ecosystemsSensorsDataCurrent, dataKey);
	if (storedData !== null && checkSensorDataRecency(storedData, 1)) {
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
					const storageKey = getKey(sensorRecord['sensor_uid'], sensorRecord['measure']);
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
			gaiaState.ecosystemsSensorsDataCurrent = accumulator;
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
	const dataKey = getKey(sensorUID, measure);
	const storedData = getFreshStateData(gaiaState.ecosystemsSensorsDataHistoric, dataKey);
	if (storedData !== null && checkSensorDataRecency(storedData, 10)) {
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
			gaiaState.ecosystemsSensorsDataHistoric[dataKey] = data;
			return data;
		})
		.catch(() => {
			return {};
		});
};

export const fetchEcosystemSensorsSkeleton = async function (ecosystemUID, level = null) {
	const dataKey = getKey(ecosystemUID, level);
	const storedData = getFreshStateData(gaiaState.ecosystemsSensorsSkeleton, dataKey);
	if (storedData !== null) {
		return storedData;
	}
	return axios
		.get(`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/sensor/skeleton`, {
			params: { level: level }
		})
		.then((response) => {
			const data = response['data']['sensors_skeleton'];
			gaiaState.ecosystemsSensorsSkeleton[dataKey] = data;
			return data;
		})
		.catch(() => {
			return {};
		});
};

export const fetchHealthLatestDataForMeasure = async function (ecosystemUID, measure, sensors) {
	const dataKey = getKey(ecosystemUID, measure);
	const storedData = gaiaState.healthData[dataKey];
	if (storedData !== undefined) {
		return storedData;
	}
	const values = await Promise.all(
		sensors.map((sensor) =>
			axios
				.get(
					`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/sensor/u/${sensor['uid']}/data/${measure}/historic`,
					{ params: { window_length: 1 } }
				)
				.then((response) => {
					if (response['data']['values'].length === 0) {
						return null;
					}
					return response['data']['values'][0][1];
				})
		)
	);
	const rv = values.filter((value) => value !== null);
	if (rv.length === 0) {
		return null;
	}
	const average = (array) => array.reduce((a, b) => a + b) / array.length;
	const result = average(rv).toFixed(4);
	gaiaState.healthData[dataKey] = result;
	return result;
};

// Weather-related actions
export const fetchWeatherForecast = async function (include = ['currently', 'hourly', 'daily']) {
	let exclude = ['currently', 'hourly', 'daily'];

	// TODO: check for data recency
	if (include.includes('currently') && isEmpty(servicesState.weatherCurrently)) {
		exclude = exclude.filter((element) => element !== 'currently');
	}
	if (include.includes('hourly') && !servicesState.weatherHourly.length > 0) {
		exclude = exclude.filter((element) => element !== 'hourly');
	}
	if (include.includes('daily') && !servicesState.weatherDaily.length > 0) {
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
				servicesState.weatherCurrently = response['data']['currently'];
			}
			if (response['data']['hourly']) {
				servicesState.weatherHourly = response['data']['hourly'];
			}
			if (response['data']['daily']) {
				servicesState.weatherDaily = response['data']['daily'];
			}
		})
		.catch(() => {
			if (!exclude.includes('currently')) {
				servicesState.weatherCurrently = undefined;
			}
			if (!exclude.includes('hourly')) {
				servicesState.weatherHourly = [];
			}
			if (!exclude.includes('daily')) {
				servicesState.weatherDaily = [];
			}
		});
};

// Server-related actions
export const fetchServerCurrentData = async function (serverUid) {
	const dataKey = getKey(serverUid);
	const storedData = getFreshStateData(infraState.serversCurrentData, dataKey);
	if (storedData !== null) {
		return storedData;
	}

	return axios
		.get(`${API_URL}/system/${serverUid}/data/current`, {
			withCredentials: true
		})
		.then((response) => {
			const data = response['data']['values'];
			infraState.serversCurrentData[dataKey] = data;
			return data;
		})
		.catch(() => {
			const data = [];
			infraState.serversCurrentData[dataKey] = data;
			return data;
		});
};

export const fetchServerHistoricData = async function (serverUid) {
	const dataKey = getKey(serverUid);
	const storedData = getFreshStateData(infraState.serversHistoricData, dataKey);
	if (storedData !== null) {
		return storedData;
	}

	return axios
		.get(`${API_URL}/system/${serverUid}/data/historic`, {
			withCredentials: true
		})
		.then((response) => {
			const data = response['data']['values'];
			infraState.serversHistoricData[dataKey] = data;
			return data;
		})
		.catch(() => {
			const data = [];
			infraState.serversHistoricData[dataKey] = data;
			return data;
		});
};

export const updateService = async function (serviceName, status) {
	return axios(`${API_URL}/app/services/u/${serviceName}`, {
		method: 'put',
		withCredentials: true,
		data: { status: status }
	})
		.then((response) => {
			appState.flashMessages.push(createFlashMessage(response.data, null, 1500));
		})
		.catch((error) => {
			setFlashMsgError(error);
		});
};

// Requests-related actions
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
			appState.flashMessages.push(createFlashMessage(response.data, null, 3000));
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
			appState.flashMessages.push(createFlashMessage(response.data, null, 1500));
		})
		.catch((error) => {
			setFlashMsgError(error);
		});
};
