import { writable } from 'svelte/store';

import { User } from '$lib/utils/factories.js';

export const calendarEvents = writable([]);
export const currentUser = writable(User());
export const ecosystems = writable({});
export const ecosystemsIds = writable([]);
export const ecosystemsActuatorsRecords = writable({});
export const ecosystemsActuatorsState = writable({});
export const ecosystemsLightData = writable({});
export const ecosystemsManagement = writable({});
export const ecosystemsSensorsSkeleton = writable({});
export const ecosystemsSensorsDataCurrent = writable({});
export const ecosystemsSensorsDataHistoric = writable({});
export const engines = writable({});
export const enginesIds = writable([]);
export const flashMessage = writable([]);
export const servers = writable({});
export const serversIds = writable([]);
export const serversCurrentData = writable({});
export const serversHistoricData = writable({});
export const pingServerLastSeen = writable(new Date(0));
export const pingServerLatency = writable(null);
export const services = writable();
export const warnings = writable([]);
export const weatherCurrently = writable({});
export const weatherHourly = writable([]);
export const weatherDaily = writable([]);
