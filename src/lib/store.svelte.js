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
	// ecosystems
	ecosystems = $state({});
	ecosystemsActuatorsState = $state({});
	ecosystemsNycthemeralCycle = $state({});
	ecosystemsManagement = $state({});
	ecosystemsSensorsDataCurrent = $state({});
	ecosystemsSensorsDataHistoric = $state({});
	ecosystemsSensorsSkeleton = $state({});
	ecosystemsState = $state({});
	healthData = $state({});
	// engines
	engines = $state({});
	enginesState = $state({});

	// derived
	get ecosystemsIds() {
		return Object.values(this.ecosystems).map((obj) => ({ uid: obj['uid'], name: obj['name'] }));
	}

	get enginesIds() {
		return Object.values(this.engines)
			.sort(dynamicSort('uid'))
			.map((obj) => ({ uid: obj['uid'], sid: obj['sid'] }));
	}
}

export const gaiaState = new GaiaState();

class InfraState {
	servers = $state({});
	serversCurrentData = $state({});
	serversHistoricData = $state({});

	get serversIds() {
		return Object.values(this.servers)
			.sort(dynamicSort('uid'))
			.map((obj) => ({ uid: obj['uid'], name: capitalize(obj['uid'].replace('_', ' ')) }));
	}
}

export const infraState = new InfraState();

class ServicesState {
	services = $state([]);
	weatherCurrently = $state({});
	weatherDaily = $state([]);
	weatherHourly = $state([]);
	wikiTopics = $state([]);
}

export const servicesState = new ServicesState();


// Writable stores
export const rawWarnings = writable([]);

// Derived stores
export const warnings = derived([rawWarnings, gaiaState.ecosystems], ([rawWarnings, ecosystems]) => {
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

export const getFreshStateData = function (state, storageKey) {
	const now = new Date();
	if (now - appState.pingServerLastSeen > 60000) {
		return {};
	}
	return state[storageKey];
};

export const updateStoreData = function (store, data) {
	// Utility function to easily update stored data outside .svelte files
	store.set({ ...get(store), ...data });
};
