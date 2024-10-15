import { derived, writable } from 'svelte/store';

import { User } from '$lib/utils/factories.js';
import { CONNECTION_STATUS } from '$lib/utils/consts.js';
import { capitalize, dynamicSort } from '$lib/utils/functions.js';

// Writable stores
export const calendarEvents = writable([]);
export const currentUser = writable(User());
export const ecosystems = writable({});
export const ecosystemsActuatorsRecords = writable({});
export const ecosystemsActuatorsState = writable({});
export const ecosystemsLightData = writable({});
export const ecosystemsManagement = writable({});
export const ecosystemsSensorsSkeleton = writable({});
export const ecosystemsSensorsDataCurrent = writable({});
export const ecosystemsSensorsDataHistoric = writable({});
export const engines = writable({});
export const flashMessage = writable([]);
export const servers = writable({});
export const serversCurrentData = writable({});
export const serversHistoricData = writable({});
export const pingServerStatus = writable(CONNECTION_STATUS.CONNECTED);
export const pingServerLastSeen = writable(new Date(0));
export const pingServerLatency = writable(null);
export const services = writable();
export const warnings = writable([]);
export const weatherCurrently = writable({});
export const weatherHourly = writable([]);
export const weatherDaily = writable([]);

// Derived stores
export const ecosystemsIds = derived(ecosystems, (ecosystems) => {
	return Object.values(ecosystems)
		.sort(dynamicSort('name'))
		.map((obj) => ({ uid: obj['uid'], name: obj['name'] }));
});

export const enginesIds = derived(engines, (engines) => {
	return Object.values(engines)
		.sort(dynamicSort('uid'))
		.map((obj) => ({ uid: obj['uid'], sid: obj['sid'] }));
});

export const serversIds = derived(servers, (servers) => {
	return Object.values(servers)
		.sort(dynamicSort('uid'))
		.map((obj) => ({ uid: obj['uid'], name: capitalize(obj['uid'].replace('_', ' ')) }));
});
