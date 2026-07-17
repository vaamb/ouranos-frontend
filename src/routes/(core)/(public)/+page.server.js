import {
	fetchCalendarEvents,
	fetchCameraPicturesInfo,
	fetchEcosystemActuatorsState,
	fetchEcosystemNycthemeralCycleData,
	fetchEcosystemSensorsSkeleton,
	fetchSensorsCurrentData,
	fetchServerCurrentData,
	fetchSuntimes,
	fetchWeatherForecast
} from '$lib/queries.js';
import { permissions } from '$lib/utils/consts.js';
import { createUser } from '$lib/utils/factories.js';
import { capitalize, dynamicSort, isConnected, serviceEnabled } from '$lib/utils/functions.js';
import { getKey } from '$lib/store.svelte.ts';

export async function load({ cookies, parent, request }) {
	const { ecosystems, ecosystemsManagement, ecosystemsState, servers, services, userData } =
		await parent();
	let currentUser = createUser(userData);

	const authHeaders = currentUser.isAuthenticated
		? {
				Cookie: 'session=' + cookies.get('session'),
				'User-Agent': request.headers.get('user-agent')
			}
		: undefined;

	// Ecosystems
	const ecosystemsIDs = Object.values(ecosystems).map((obj) => ({
		uid: obj['uid'],
		name: obj['name']
	}));

	const ecosystemsNycthemeralCycle = {};
	const ecosystemsCameraPicturesInfo = {};
	const ecosystemsSensorsSkeleton = {};
	const ecosystemsActuatorsState = {};

	const canManage = function (uid, management) {
		return ecosystemsManagement?.[uid]?.[management] === true;
	};

	const fetchEcosystemData = async function (uid) {
		const [
			nycthemeralCycle,
			cameraPicturesInfo,
			ecosystemSensorsSkeleton,
			environmentSensorsSkeleton,
			plantsSensorsSkeleton,
			actuatorsState
		] = await Promise.all([
			fetchEcosystemNycthemeralCycleData(uid),
			canManage(uid, 'recent_picture') ? fetchCameraPicturesInfo(uid) : {},
			canManage(uid, 'ecosystem_data') ? fetchEcosystemSensorsSkeleton(uid, 'ecosystem') : {},
			canManage(uid, 'environment_data') ? fetchEcosystemSensorsSkeleton(uid, 'environment') : {},
			canManage(uid, 'plants_data') ? fetchEcosystemSensorsSkeleton(uid, 'plants') : {},
			canManage(uid, 'actuators') ? fetchEcosystemActuatorsState(uid) : {}
		]);
		ecosystemsCameraPicturesInfo[getKey(uid)] = cameraPicturesInfo;
		ecosystemsNycthemeralCycle[getKey(uid)] = nycthemeralCycle;
		ecosystemsSensorsSkeleton[getKey(uid, 'ecosystem')] = ecosystemSensorsSkeleton;
		ecosystemsSensorsSkeleton[getKey(uid, 'environment')] = environmentSensorsSkeleton;
		ecosystemsSensorsSkeleton[getKey(uid, 'plants')] = plantsSensorsSkeleton;
		ecosystemsActuatorsState[getKey(uid)] = actuatorsState;
	};

		const ecosystemIsConnected = function (uid) {
			return isConnected(ecosystemsState[uid]);
		};

		const ecosystemIsRunning = function (uid) {
			return ecosystemsState[uid]['status'];
		};

		const ecosystemIsOperational = function (uid) {
			return ecosystemIsConnected(uid) && ecosystemIsRunning(uid);
		};

	// Only fetch data for operational ecosystems
	const ecosystemsPromises = Promise.all(
		ecosystemsIDs
			.map((ecosystemIDs) => ecosystemIDs['uid'])
			.filter((uid) => ecosystemIsOperational(uid))
			.map((uid) => fetchEcosystemData(uid))
	);

	const currentSensorsDataPromise = fetchSensorsCurrentData();

	// Servers
	let serversCurrentData = {};

	let serversPromises = new Promise((resolve) => resolve(''));
	if (currentUser.can(permissions.ADMIN)) {
		const serverIDs = Object.values(servers)
			.sort(dynamicSort('uid'))
			.map((obj) => ({ uid: obj['uid'], name: capitalize(obj['uid'].replace('_', ' ')) }));

		serversPromises = Promise.all(
			serverIDs.map(async ({ uid }) => {
				serversCurrentData[uid] = await fetchServerCurrentData(uid, { headers: authHeaders });
			})
		);
	}

	// Services
	const weatherForecastPromise = serviceEnabled(services, 'weather')
		? fetchWeatherForecast(['hourly', 'daily'])
		: { currently: undefined };

	const suntimesPromise = serviceEnabled(services, 'suntimes') ? fetchSuntimes() : [];

	const calendarEventsPromise = serviceEnabled(services, 'calendar')
		? fetchCalendarEvents(undefined, undefined, { headers: authHeaders })
		: [];

	const [weatherForecast, suntimes, calendarEvents, currentSensorsData] = await Promise.all([
		weatherForecastPromise,
		suntimesPromise,
		calendarEventsPromise,
		currentSensorsDataPromise,
		ecosystemsPromises,
		serversPromises
	]);

	return {
		ecosystemsNycthemeralCycleData: ecosystemsNycthemeralCycle,
		ecosystemsCameraPicturesInfo,
		ecosystemsSensorsSkeleton,
		ecosystemsActuatorsState,
		currentSensorsData,
		serversCurrentData,
		currentWeatherForecast: weatherForecast.currently,
		suntimes,
		calendarEvents
	};
}
