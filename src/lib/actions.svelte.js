import axios from 'axios';

import {
	fetchEcosystemActuatorsState,
	fetchEcosystemNycthemeralCycleData,
	fetchSensorsCurrentData,
	fetchSensorHistoricData,
	fetchEcosystemSensorsSkeleton,
	fetchHealthLatestDataForMeasure,
	fetchServerCurrentData,
	fetchServerHistoricData,
	fetchWeatherForecast
} from '$lib/queries.js';
import { API_URL, APP_MODE, getAppMode } from '$lib/utils/consts.js';
import { createFlashMessage, createUser } from '$lib/utils/factories.js';
import { isEmpty } from '$lib/utils/functions.js';
import {
	connectSocketio,
	disconnectSocketio,
	startUserHeartbeat,
	stopUserHeartbeat
} from '$lib/socketio.svelte.js';
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
				// Update socketio identity on the server-side
				disconnectSocketio();
				connectSocketio();
				startUserHeartbeat();
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
				appState.currentUser = createUser();
				// Last user heartbeat before we update its identity
				stopUserHeartbeat();
				// Update socketio identity on the server-side
				disconnectSocketio();
				connectSocketio();
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
export const syncEcosystemNycthemeralCycleData = async function (ecosystemUID) {
	const dataKey = getKey(ecosystemUID);
	const storedData = getFreshStateData(gaiaState.ecosystemsNycthemeralCycle, dataKey);
	if (storedData !== null) {
		return storedData;
	}
	const data = await fetchEcosystemNycthemeralCycleData(ecosystemUID);
	gaiaState.ecosystemsNycthemeralCycle[dataKey] = data;
	return data;
};

export const syncEcosystemActuatorsState = async function (ecosystemUID) {
	const dataKey = getKey(ecosystemUID);
	const storedData = getFreshStateData(gaiaState.ecosystemsActuatorsState, dataKey);
	if (storedData !== null) {
		return storedData;
	}
	const data = await fetchEcosystemActuatorsState(ecosystemUID);
	gaiaState.ecosystemsActuatorsState[dataKey] = data;
	return data;
};

export const syncSensorCurrentData = async function (ecosystemUID, sensorUID, measure) {
	const dataKey = sensorUID !== 'priming' ? getKey(ecosystemUID, sensorUID, measure) : 'priming';
	const storedData = getFreshStateData(gaiaState.ecosystemsSensorsDataCurrent, dataKey);
	if (storedData !== null && checkSensorDataRecency(storedData, 1)) {
		return storedData;
	}
	const data = await fetchSensorsCurrentData();
	if (isEmpty(data)) {
		return {};
	}
	const accumulator = {};
	for (const ecosystem of data) {
		for (const sensorRecord of ecosystem['values']) {
			const storageKey = getKey(
				sensorRecord['ecosystem_uid'],
				sensorRecord['sensor_uid'],
				sensorRecord['measure']
			);
			accumulator[storageKey] = {
				timestamp: new Date(sensorRecord['timestamp']),
				value: sensorRecord['value']
			};
		}
	}
	// Special case when 'priming' the store
	if (dataKey === 'priming') {
		accumulator[dataKey] = {
			timestamp: new Date(),
			value: true
		};
	}
	gaiaState.ecosystemsSensorsDataCurrent = accumulator;
	return accumulator[dataKey];
};

export const syncSensorHistoricData = async function (
	ecosystemUID,
	sensorUID,
	measure,
	sensorLevel = 'environment'
) {
	const dataKey = getKey(ecosystemUID, sensorUID, measure);
	const storedData = getFreshStateData(gaiaState.ecosystemsSensorsDataHistoric, dataKey);
	if (storedData !== null && checkSensorDataRecency(storedData, 10)) {
		return storedData;
	}
	// sensorLevel in ['environment', 'plants', 'ecosystem']
	let windowLength;
	if (['environment', 'plants'].includes(sensorLevel)) {
		windowLength = 7;
	} else if (sensorLevel === 'ecosystem') {
		windowLength = 31;
	} else {
		throw Error;
	}
	const data = await fetchSensorHistoricData(ecosystemUID, sensorUID, measure, windowLength);
	gaiaState.ecosystemsSensorsDataHistoric[dataKey] = data;
	return data;
};

export const syncEcosystemSensorsSkeleton = async function (ecosystemUID, level = null) {
	const dataKey = getKey(ecosystemUID, level);
	const storedData = getFreshStateData(gaiaState.ecosystemsSensorsSkeleton, dataKey);
	if (storedData !== null) {
		return storedData;
	}
	const data = await fetchEcosystemSensorsSkeleton(ecosystemUID, level);
	gaiaState.ecosystemsSensorsSkeleton[dataKey] = data;
	return data;
};

export const syncHealthLatestDataForMeasure = async function (ecosystemUID, measure, sensors) {
	const dataKey = getKey(ecosystemUID, measure);
	const storedData = gaiaState.healthData[dataKey];
	if (storedData !== undefined) {
		return storedData;
	}
	const data = await fetchHealthLatestDataForMeasure(ecosystemUID, measure, sensors);
	gaiaState.healthData[dataKey] = data;
	return data;
};

// Weather-related actions
export const syncWeatherForecast = async function (include = ['currently', 'hourly', 'daily']) {
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

	const data = await fetchWeatherForecast(exclude);
	if (data['currently']) {
		servicesState.weatherCurrently = data['currently'];
	}
	if (data['hourly']) {
		servicesState.weatherHourly = data['hourly'];
	}
	if (data['daily']) {
		servicesState.weatherDaily = data['daily'];
	}
};

// Server-related actions
export const syncServerCurrentData = async function (serverUID) {
	const dataKey = getKey(serverUID);
	const storedData = getFreshStateData(infraState.serversCurrentData, dataKey);
	if (storedData !== null) {
		return storedData;
	}
	const data = await fetchServerCurrentData(serverUID);
	infraState.serversCurrentData[dataKey] = data;
	return data;
};

export const syncServerHistoricData = async function (serverUID) {
	const dataKey = getKey(serverUID);
	const storedData = getFreshStateData(infraState.serversHistoricData, dataKey);
	if (storedData !== null) {
		return storedData;
	}
	const data = await fetchServerHistoricData(serverUID);
	infraState.serversHistoricData[dataKey] = data;
	return data;
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
