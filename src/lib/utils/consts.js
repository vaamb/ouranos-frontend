import { PUBLIC_BASE_URL, PUBLIC_LOCAL_API_URL } from '$env/static/public'

export const BASE_URL = PUBLIC_BASE_URL;
export const API_URL = BASE_URL + '/api';
export const LOCAL_API_URL = PUBLIC_LOCAL_API_URL;

export const SERVER_STATUS = {
	unreachable: -1,
	unknown: 0,
	connected: 1
};

export const CONTENT = {
	maintenance: -1,
	loading: 0,
	display: 1
};

export const permissions = {
	VIEW: 1,
	EDIT: 2,
	OPERATE: 4,
	ADMIN: 8
};

export const climateParameters = ['temperature', 'humidity', 'light'];

export const hardwareLevels = ['environment', 'plants'];

export const actuatorTypes = ['light', 'heater', 'cooler', 'humidifier', 'dehumidifier'];

export const hardwareTypes = ['sensor', ...actuatorTypes];

export const eventLevels = ['Low', 'Elevated', 'High', 'Severe', 'Critical'];
