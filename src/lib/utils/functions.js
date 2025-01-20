import humanizeDuration from 'humanize-duration';

import { CONNECTION_STATUS } from '$lib/utils/consts.js';

const timeRegex = new RegExp('^([0-9]{2}:){1,2}[0-9]{2}$');

export const dynamicSort = function (property) {
	// from https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
	let sortOrder = 1;
	if (property[0] === '-') {
		sortOrder = -1;
		property = property.substr(1);
	}
	return function (a, b) {
		/* next line works with strings and numbers,
		 * and you may want to customize it to your needs
		 */
		let result = a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
		return result * sortOrder;
	};
};

export const isEmpty = function (obj) {
	if (obj === undefined) {
		return true;
	}
	return Object.keys(obj).length === 0;
};

export const isDate = function (date) {
	return Object.prototype.toString.call(date) === '[object Date]';
};

export const isTime = function (time) {
	return timeRegex.test(time);
};

export const isNumber = function (number) {
	return !Number.isNaN(Number(number)) && !(number === '');
};

export const isBool = function (bool) {
	return bool === 'true' || bool === 'false';
};

export const isObject = function (object) {
	return typeof object === 'object' && object !== null;
};

export const capitalize = function (string) {
	if (typeof string !== 'string') return '';
	return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export const formatDateTime = function (date) {
	if (isDate(date)) {
		return (
			date.toLocaleDateString('en-GB') +
			', ' +
			date.toLocaleTimeString([], { timeStyle: 'short', hour12: false })
		);
	} else {
		return '';
	}
};

export const timeStringToDate = function (timeString) {
	if (timeString !== null) {
		return formatDateTime(new Date(timeString));
	} else {
		return 'NA';
	}
};

export const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const months = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

export const formatDate = function (date) {
	if (isDate(date)) {
		const day = days[date.getDay()];
		const month = months[date.getMonth()];
		return ''.concat(day, ' ', date.getDate(), ' ', month);
	} else {
		return '';
	}
};

export const computeServerUptime = function (serverStartTime, now) {
	if (serverStartTime) {
		return humanizeDuration(now - serverStartTime, {
			largest: 2,
			units: ['y', 'mo', 'w', 'd', 'h', 'm', 's'],
			maxDecimalPoints: 0,
			delimiter: ' and '
		});
	} else {
		return 'Not connected';
	}
};

export const isConnected = function (connectable) {
	return connectable['connected'] !== CONNECTION_STATUS.DISCONNECTED;
};

export const computeEcosystemStatusClass = function (ecosystem) {
	if (isConnected(ecosystem)) {
		if (ecosystem['status']) {
			return 'on';
		} else {
			return 'off';
		}
	} else {
		return 'deco';
	}
};

export const getStatusClass = function (status) {
	if (status) {
		return 'on';
	} else {
		return 'off';
	}
};

const strHoursToDate = function (strHour) {
	const now = new Date();
	const hour = strHour.split(':');
	now.setHours(hour[0], hour[1], hour[2]);
	return now;
};

export const computeLightingHours = function (ecosystemLight) {
	let rv = [];
	if (['fixed', 'mimic'].includes(ecosystemLight['method'])) {
		const start = strHoursToDate(ecosystemLight['morning_start']);
		const end = strHoursToDate(ecosystemLight['evening_end']);
		rv.push(
			`${
				'Lighting from ' +
				start.toLocaleTimeString([], { timeStyle: 'short' }) +
				' to ' +
				end.toLocaleTimeString([], { timeStyle: 'short' })
			}`
		);
	} else if (ecosystemLight['method'] === 'elongate') {
		for (const TOD of ['morning', 'evening']) {
			if (ecosystemLight[TOD + '_start'] && ecosystemLight[TOD + '_end']) {
				const start = strHoursToDate(ecosystemLight[TOD + '_start']);
				const end = strHoursToDate(ecosystemLight[TOD + '_end']);
				if (start < end) {
					rv.push(
						`${
							capitalize(TOD) +
							' lighting from ' +
							start.toLocaleTimeString([], { timeStyle: 'short' }) +
							' to ' +
							end.toLocaleTimeString([], { timeStyle: 'short' })
						}`
					);
				}
			}
		}
	}
	return rv;
};

export const serviceEnabled = function (services, serviceName) {
	const service = services.filter((object) => {
		return object.name === serviceName;
	});
	const serviceObj = service[0];
	if (serviceObj) {
		return serviceObj.status;
	} else {
		return false;
	}
};

export const getParamStatus = function (store, ecosystemUID, param) {
	const ecosystem = store[ecosystemUID];
	if (ecosystem) {
		return ecosystem[param] === true;
	}
	return false;
};

export const setCookie = function (name, value, expDays = 90) {
	let date = new Date();
	date.setTime(date.getTime() + expDays * 24 * 60 * 60 * 1000);
	const expires = 'expires=' + date.toUTCString();
	document.cookie = name + '=' + value + '; ' + expires + '; path=/;SameSite=Lax';
};

export const getEcosystemUID = function (ecosystems, ecosystemName) {
	const Ids = Object.values(ecosystems).find((id) => {
		return id.name === ecosystemName;
	});
	if (!isEmpty(Ids)) {
		return Ids.uid;
	}
};
