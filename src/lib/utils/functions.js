import humanizeDuration from 'humanize-duration';

import { CONNECTION_STATUS } from '$lib/utils/consts.js';

const dateRegex = new RegExp('^[0-9]{2}[-\/][0-9]{2}-([0-9]{2}|[0-9]{4})$');
const timeRegex = new RegExp('^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$');

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
	return dateRegex.test(date);
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

export const isDateObject = function (date) {
	return Object.prototype.toString.call(date) === '[object Date]';
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
	if (isDateObject(date)) {
		const day = days[date.getDay()];
		const month = months[date.getMonth()];
		return ''.concat(day, ' ', date.getDate(), ' ', month);
	} else {
		return '';
	}
};

export const formatDateTime = function (date, timeStyle = 'medium') {
	if (isDateObject(date)) {
		return (
			date.toLocaleDateString('en-GB') +
			' ' +
			date.toLocaleTimeString([], { timeStyle: timeStyle, hour12: false })
		);
	} else {
		return '';
	}
};

export const serializeDatetime = function (value) {
	return `${value.getFullYear()}-${(value.getMonth() + 1).toString().padStart(2, '0')}-${value.getDate().toString().padStart(2, '0')}T${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}:${value.getSeconds().toString().padStart(2, '0')}`;
};

export const deserializeDatetime = function (value) {
	return new Date(value);
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

export const computeLightingHours = function (ecosystemLight, timeStyle = 'medium') {
	let rv = [];
	if (ecosystemLight['lighting'] === 'fixed') {
		const start = strHoursToDate(ecosystemLight['morning_start']);
		const end = strHoursToDate(ecosystemLight['evening_end']);
		rv.push(
			`${
				'Lighting from ' +
				start.toLocaleTimeString([], { timeStyle: timeStyle, hour12: false }) +
				' to ' +
				end.toLocaleTimeString([], { timeStyle: timeStyle, hour12: false })
			}`
		);
	} else if (ecosystemLight['lighting'] === 'elongate') {
		for (const TOD of ['morning', 'evening']) {
			if (ecosystemLight[TOD + '_start'] && ecosystemLight[TOD + '_end']) {
				const start = strHoursToDate(ecosystemLight[TOD + '_start']);
				const end = strHoursToDate(ecosystemLight[TOD + '_end']);
				if (start < end) {
					rv.push(
						`${
							capitalize(TOD) +
							' lighting from ' +
							start.toLocaleTimeString([], { timeStyle: timeStyle, hour12: false }) +
							' to ' +
							end.toLocaleTimeString([], { timeStyle: timeStyle, hour12: false })
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

export const slugify = function (str) {
	return str
		.toLowerCase()
		.replace(' ', '_');
};
