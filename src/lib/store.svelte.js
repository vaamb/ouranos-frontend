import { derived, get, writable } from 'svelte/store';

import { User } from '$lib/utils/factories.js';
import { CONNECTION_STATUS } from '$lib/utils/consts.js';
import { capitalize, dynamicSort } from '$lib/utils/functions.js';

class AppState {
	currentUser = $state(User());
	flashMessage = $state([]);
	pingServerStatus = $state(CONNECTION_STATUS.CONNECTED);
	pingServerLastSeen = $state(new Date(0));
	pingServerLatency = $state(null);
}

export const appState = new AppState();

class GaiaState {

}

export const gaiaState = new GaiaState();

class InfraState {
	servers = $state({});

	get serversIds() {
		return Object.values(this.servers)
			.sort(dynamicSort('uid'))
			.map((obj) => ({ uid: obj['uid'], name: capitalize(obj['uid'].replace('_', ' ')) }));
	}
}

export const infraState = new InfraState();

class ServicesState {

}

export const servicesState = new ServicesState();


// Writable stores
export const ecosystems = writable({});
export const ecosystemsActuatorsState = writable({});
export const ecosystemsNycthemeralCycle = writable({});
export const ecosystemsManagement = writable({});
export const ecosystemsSensorsSkeleton = writable({});
export const ecosystemsSensorsDataCurrent = writable({});
export const ecosystemsSensorsDataHistoric = writable({});
export const ecosystemsState = writable({});
export const engines = writable({});
export const enginesState = writable({});
export const healthData = $state({});
export const serversCurrentData = writable({});
export const serversHistoricData = writable({});
export const services = writable([]);
export const rawWarnings = writable([]);
export const weatherCurrently = writable({});
export const weatherHourly = writable([]);
export const weatherDaily = writable([]);
export const wikiTopics = writable([]);

// Derived stores
export const ecosystemsIds = derived(ecosystems, (ecosystems) => {
	return Object.values(ecosystems)
		.map((obj) => ({ uid: obj['uid'], name: obj['name'] }));
});

export const enginesIds = derived(engines, (engines) => {
	return Object.values(engines)
		.sort(dynamicSort('uid'))
		.map((obj) => ({ uid: obj['uid'], sid: obj['sid'] }));
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
	return Array.prototype.slice.call(arguments).join('-');
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
	if (now - appState.pingServerLastSeen > 60000) {
		return {};
	}
	return getStoreData(store, storageKey);
};

export const updateStoreData = function (store, data) {
	// Utility function to easily update stored data outside .svelte files
	store.set({ ...get(store), ...data });
};
