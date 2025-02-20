import { derived, get, writable } from 'svelte/store';

import { User } from '$lib/utils/factories.js';
import { CONNECTION_STATUS } from '$lib/utils/consts.js';
import { capitalize, dynamicSort } from '$lib/utils/functions.js';

// Writable stores
export const currentUser = writable(User());
export const ecosystems = writable({});
export const ecosystemsActuatorsRecords = writable({});
export const ecosystemsActuatorsState = writable({});
export const ecosystemsNycthemeralCycle = writable({});
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
export const services = writable([]);
export const rawWarnings = writable([]);
export const weatherCurrently = writable({});
export const weatherHourly = writable([]);
export const weatherDaily = writable([]);
export const wikiTopics = writable([]);

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

export const warnings = derived([rawWarnings, ecosystems], ([rawWarnings, ecosystems]) => {
	rawWarnings.forEach((warning) => {
		if (ecosystems[warning['created_by']]) {
			warning['created_by'] = ecosystems[warning['created_by']]['name'];
		}
	});
	return rawWarnings;
});

// Store-related utility functions
export const getStoreDataKey = function () {
	if (arguments.length <= 1) {
		return arguments[0];
	} else {
		let rv = arguments[0];
		const remainingArgs = Array.prototype.slice.call(arguments, 1);
		for (const value of Object.values(remainingArgs)) {
			rv = rv + '_' + value;
		}
		return rv;
	}
};

export const getStoreData = function (store, storageKey) {
	// Utility function to easily access stored data outside .svelte files
	const storeData = get(store)[storageKey];
	if (storeData) {
		return storeData;
	} else {
		return {};
	}
};

export const getFreshStoreData = function (store, storageKey) {
	const now = new Date();
	if (now - get(pingServerLastSeen) > 60000) {
		return {};
	}
	return getStoreData(store, storageKey);
};

export const updateStoreData = function (store, data) {
	// Utility function to easily update stored data outside .svelte files
	store.set({ ...get(store), ...data });
};
