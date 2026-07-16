import { browser } from '$app/environment';

import axios from 'axios';

import {
	actuatorTypes,
	API_URL,
	CONNECTION_STATUS,
	eventLevels,
	eventVisibility,
	LOCAL_API_URL,
	SERVER_STATUS
} from '$lib/utils/consts.js';

const client = axios.create({
	baseURL: browser ? API_URL : LOCAL_API_URL
});

const assertAuthInfo = function (options) {
	if (!browser && !options.headers?.Cookie) {
		throw new Error('Missing auth headers');
	}
};

// Server-related actions
export const fetchServerInfo = async function () {
	return await client
		.get(`/app/version`)
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
	return client
		.get(`/auth/current_user`, {
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

// Engines-related actions
export const fetchEngines = async function () {
	return client
		.get(`/gaia/engine`, {
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
	return client
		.get(`/gaia/ecosystem`, {
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
	return client
		.get(`/gaia/ecosystem/management`, {
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
	return client
		.get(`/gaia/ecosystem/u/${ecosystemUID}/light`)
		.then((response) => {
			const data = response.data;
			delete data['ecosystem_uid'];
			return data;
		})
		.catch(() => {
			return {};
		});
};

export const fetchEcosystemEnvironmentParameters = async function (ecosystemUID) {
	return client
		.get(`/gaia/ecosystem/u/${ecosystemUID}/environment_parameter`)
		.then((response) => {
			return response['data']['environment_parameters'];
		})
		.catch(() => {
			return [];
		});
};

export const fetchEcosystemWeatherEvents = async function (ecosystemUID) {
	return client
		.get(`/gaia/ecosystem/u/${ecosystemUID}/weather_event`)
		.then((response) => {
			return response['data']['weather_events'];
		})
		.catch(() => {
			return [];
		});
};

export const fetchEcosystemActuatorsState = async function (ecosystemUID) {
	return client
		.get(`/gaia/ecosystem/u/${ecosystemUID}/actuators_state`)
		.then((response) => {
			const data = response.data;
			const states = data['actuators_state'].reduce((a, v) => ({ ...a, [v['type']]: v }), {});
			const result = {};
			for (const actuatorType of actuatorTypes) {
				result[actuatorType] = states[actuatorType];
			}
			return result;
		})
		.catch(() => {
			return {};
		});
};

export const fetchEcosystemActuatorRecords = async function (ecosystemUID, actuatorType) {
	return client
		.get(`/gaia/ecosystem/u/${ecosystemUID}/actuator_records/u/${actuatorType}`)
		.then((response) => {
			return {
				timestamp: new Date(response['data']['span'][1]),
				span: response['data']['span'],
				values: response['data']['values']
			};
		})
		.catch(() => {
			return {};
		});
};

export const fetchEcosystemHardware = async function (ecosystemUID) {
	return client
		.get(`/gaia/ecosystem/u/${ecosystemUID}/hardware`, {
			params: { in_config: true }
		})
		.then((response) => {
			return response.data;
		})
		.catch(() => {
			return [];
		});
};

export const fetchSensorsCurrentData = async function () {
	return client
		.get(`/gaia/ecosystem/sensor/data/current`, {
			params: { ecosystems: 'recent' }
		})
		.then((response) => {
			return response['data'];
		})
		.catch(() => {
			return [];
		});
};

export const fetchSensorHistoricData = async function (
	ecosystemUID,
	sensorUID,
	measure,
	windowLength = undefined
) {
	return client
		.get(`/gaia/ecosystem/u/${ecosystemUID}/sensor/u/${sensorUID}/data/${measure}/historic`, {
			params: { window_length: windowLength }
		})
		.then((response) => {
			return {
				timestamp: new Date(response['data']['span'][1]),
				span: response['data']['span'],
				values: response['data']['values']
			};
		})
		.catch(() => {
			return {};
		});
};

export const fetchEcosystemSensorsSkeleton = async function (ecosystemUID, level = null) {
	return client
		.get(`/gaia/ecosystem/u/${ecosystemUID}/sensor/skeleton`, {
			params: { level: level }
		})
		.then((response) => {
			return response['data']['sensors_skeleton'];
		})
		.catch(() => {
			return {};
		});
};

export const fetchHealthLatestDataForMeasure = async function (ecosystemUID, measure, sensors) {
	const values = await Promise.all(
		sensors.map((sensor) =>
			client
				.get(
					`/gaia/ecosystem/u/${ecosystemUID}/sensor/u/${sensor['uid']}/data/${measure}/historic`,
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
	return average(rv).toFixed(4);
};

export const fetchCameraPicturesInfo = async function (ecosystemUID) {
	return client
		.get(`/gaia/ecosystem/u/${ecosystemUID}/image_info`)
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
export const fetchWeatherForecast = async function (exclude = []) {
	// let exclude = ['currently', 'hourly', 'daily'];

	let params = new URLSearchParams();
	if (exclude.length > 0) {
		for (const param of exclude) {
			params.append('exclude', param);
		}
	}

	return client
		.get(`/app/services/weather/forecast`, {
			params: params
		})
		.then((response) => {
			return {
				currently: response['data']['currently'],
				hourly: response['data']['hourly'],
				daily: response['data']['daily']
			};
		})
		.catch(() => {
			return {
				currently: undefined,
				hourly: [],
				daily: []
			};
		});
};

export const fetchSuntimes = async function () {
	return client
		.get(`/app/services/weather/sun_times`)
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
			return [];
		});
};

// Server-related actions
export const fetchServers = async function (clientSessionCookie, clientUserAgent) {
	return client
		.get(`/system`, {
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
				server['last_seen'] = new Date(); //TODO: find another way ?
			});
			return servers.reduce((a, v) => ({ ...a, [v['uid']]: v }), {});
		})
		.catch(() => {
			return {};
		});
};

export const fetchServerCurrentData = async function (serverUid) {
	return client
		.get(`/system/${serverUid}/data/current`, {
			withCredentials: true
		})
		.then((response) => {
			return response['data']['values'];
		})
		.catch(() => {
			return [];
		});
};

export const fetchServerHistoricData = async function (serverUid) {
	return client
		.get(`/system/${serverUid}/data/historic`, {
			withCredentials: true
		})
		.then((response) => {
			return response['data']['values'];
		})
		.catch(() => {
			return [];
		});
};

export const fetchServices = async function () {
	return client
		.get(`/app/services`)
		.then((response) => {
			return response.data;
		})
		.catch(() => {
			return [];
		});
};

export const fetchWarnings = async function (clientSessionCookie, clientUserAgent) {
	return client
		.get(`/gaia/warning`, {
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
				warning['seen_on'] = new Date(warning['seen_on']);
				warning['solved_on'] = new Date(warning['solved_on']);
				warning['level'] = eventLevels[warning['level']];
			});
			return warnings;
		})
		.catch(() => {
			return [];
		});
};

// Calendar-related actions
export const fetchCalendarEvents = async function (startTime = undefined, endTime = undefined) {
	return client
		.get(`/app/services/calendar`, {
			params: {
				start_time: startTime,
				end_time: endTime,
				visibility: 'private'
			},
			withCredentials: true
		})
		.then((response) => {
			const events = response.data;
			events.forEach((event) => {
				event['start_time'] = new Date(event['start_time']);
				event['end_time'] = new Date(event['end_time']);
				event['level'] = eventLevels[event['level']];
				event['visibility'] = eventVisibility[event['visibility']];
			});
			return events;
		})
		.catch(() => {
			return [];
		});
};

// Wiki-related actions
export const fetchWikiTopics = async function () {
	return client
		.get(`/app/services/wiki/topics`)
		.then((response) => {
			return response.data;
		})
		.catch(() => {
			return [];
		});
};

export const fetchWikiArticles = async function (topic_name) {
	return client
		.get(`/app/services/wiki/topics/u/${topic_name}/articles`)
		.then((response) => {
			return response.data;
		})
		.catch(() => {
			return [];
		});
};

export const fetchWikiPictures = async function (topic_name, article_name) {
	return client
		.get(`/app/services/wiki/topics/u/${topic_name}/u/${article_name}/pictures`)
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
	return client
		.get(`/user/u/${username}`, {
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
	return client
		.get(`/user`, {
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
