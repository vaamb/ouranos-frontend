import { writable } from "svelte/store"

import { cookieStore } from "$lib/cookieStore.js";
import { User } from "$lib/utils/factories.js";

export const currentUser = cookieStore("userDataCache", User());
export const ecosystems = writable({});
export const ecosystemsIds = writable([]);
export const ecosystemsCurrentSensorsData = writable({});
export const ecosystemsLight = writable({});
export const ecosystemsManagement = writable({});
export const ecosystemsSensorsSkeleton = writable({})
export const engines = writable({});
export const enginesIds = writable([]);
export const flashMessage = writable([]);
export const serverCurrentData = writable({});
export const serverLastSeen = writable(new Date(0));
export const serverLatency = writable(null);
export const services = writable();
export const warnings = writable([]);
export const weatherCurrently = writable({});
export const weatherHourly = writable([]);
export const weatherDaily = writable([]);
