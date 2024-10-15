import { PUBLIC_APP_MODE, PUBLIC_BASE_URL, PUBLIC_LOCAL_API_URL } from '$env/static/public';

export const BASE_URL = PUBLIC_BASE_URL;
export const API_URL = BASE_URL + '/api';
export const STATIC_URL = BASE_URL + '/static'
export const LOCAL_API_URL = PUBLIC_LOCAL_API_URL;

export const SERVER_STATUS = {
	unreachable: -1,
	unknown: 0,
	connected: 1
};

export const CONNECTION_STATUS = {
	DISCONNECTED: 0,
	RECONNECTED: -1,
	CONNECTED: 1,
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

export const APP_MODE = {
	development: 'development',
	testing: 'testing',
	production: 'production',
	maintenance: 'maintenance'
};

export const getAppMode = function () {
	switch (PUBLIC_APP_MODE) {
		case 'production':
			return APP_MODE.production;
		case 'maintenance':
			return APP_MODE.maintenance;
		case 'testing':
			return APP_MODE.testing;
		case 'development':
			return APP_MODE.development;
		default:
			return APP_MODE.development;
	}
};

export const ECOSYSTEM_CONNECTION_TIMEOUT = 30;

export const climateParameters = ['temperature', 'humidity', 'light'];

export const hardwareLevels = ['environment', 'plants'];

export const actuatorTypes = ['light', 'heater', 'cooler', 'humidifier', 'dehumidifier', 'fan'];

export const hardwareTypes = ['sensor', ...actuatorTypes];

export const eventLevels = ['Low', 'Elevated', 'High', 'Severe', 'Critical'];
