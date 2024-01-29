export const base_URL = 'http://127.0.0.1:5000';
export const API_URL = base_URL + '/api';

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

export const hardwareLevel = ['environment', 'plants'];

export const actuatorType = ['light', 'heater', 'cooler', 'humidifier', 'dehumidifier'];

export const hardwareType = ['sensor', ...actuatorType];
