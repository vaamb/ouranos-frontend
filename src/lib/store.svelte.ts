import type {
	Ecosystem,
	EcosystemState,
	EcosystemActuatorState,
	EcosystemManagement,
	EcosystemNycthemeralCycle,
	EcosystemSensorRecord,
	EcosystemSensorHistoricTimedValues,
	EcosystemSensorsSkeleton,
	Engine,
	EngineState,
	FlashMessage,
	User,
	Warning
} from '$lib/types.ts';

import { createUser } from '$lib/utils/factories.js';
import { CONNECTION_STATUS } from '$lib/utils/consts.js';
import { capitalize, dynamicSort } from '$lib/utils/functions.js';

class AppState {
	currentUser = $state<User>(createUser());
	flashMessages = $state<FlashMessage[]>([]);
	pingServerStatus = $state<number>(CONNECTION_STATUS.CONNECTED);
	pingServerLastSeen = $state<Date>(new Date(0));
	pingServerLatency = $state<number | null>(null);
}

export const appState = new AppState();

class GaiaState {
	// ecosystems
	ecosystems = $state<Record<string, Ecosystem>>({});
	ecosystemsActuatorsState = $state<Record<string, Record<string, EcosystemActuatorState>>>({});
	ecosystemsManagement = $state<Record<string, EcosystemManagement>>({});
	ecosystemsNycthemeralCycle = $state<Record<string, EcosystemNycthemeralCycle>>({});
	ecosystemsSensorsDataCurrent = $state<Record<string, EcosystemSensorRecord>>({});
	ecosystemsSensorsDataHistoric = $state<Record<string, EcosystemSensorHistoricTimedValues>>({});
	ecosystemsSensorsSkeleton = $state<Record<string, EcosystemSensorsSkeleton>>({});
	ecosystemsState = $state<Record<string, EcosystemState>>({});
	healthData = $state<Record<string, number>>({});
	// engines
	engines = $state<Record<string, Engine>>({});
	enginesState = $state<Record<string, EngineState>>({});
	// warnings
	warnings = $state<Warning[]>([]);

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

// Store-related utility functions
export const getKey = function () {
	return Array.prototype.slice.call(arguments).join('-');
};

export const getFreshStateData = function (state, storageKey) {
	const now = new Date();
	if (now - appState.pingServerLastSeen > 60000) {
		return null;
	}
	return state[storageKey] ?? null;
};
