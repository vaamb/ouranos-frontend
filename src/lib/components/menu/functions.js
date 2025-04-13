import {
	faBook,
	faCalendarDay,
	faCloud,
	faCog,
	faDatabase,
	faGlobe,
	faHeartbeat,
	faHome,
	faSeedling,
	faServer,
	faThermometerHalf,
	faToggleOff,
	faUsers,
	faVideo
} from '@fortawesome/free-solid-svg-icons';

import { permissions } from '$lib/utils/consts.js';
import { capitalize, serviceEnabled, slugify } from '$lib/utils/functions.js';

const MenuItem = function (name, path, icon = undefined, children = [], color = undefined) {
	return {
		name: name,
		icon: icon,
		path: path,
		children: children,
		color: color
	};
};

export const generateListOfMenuItems = function (
	currentUser,
	ecosystemsIds,
	ecosystemsManagement,
	enginesIds,
	services,
	systemsIds,
	wikiTopics
) {
	let menuItems = [MenuItem('Home', '/', faHome)];

	if (serviceEnabled(services, 'calendar')) {
		menuItems.push(MenuItem('Calendar', '/calendar', faCalendarDay));
	}

	if (serviceEnabled(services, 'weather')) {
		menuItems.push(MenuItem('Weather Forecast', '/weather', faCloud));
	}

	if (currentUser.can(permissions.OPERATE)) {
		if (enginesIds.length > 0) {
			let children = [MenuItem('Overview', '/engine/overview/settings')];
			for (const id of enginesIds) {
				children.push(MenuItem(id.uid, `/engine/${id.uid}/settings`));
			}
			menuItems.push(MenuItem('Engines', '#', faServer, children));
		}
	}

	let ecosystemMenuItemsAvailable = [
		{
			name: 'Actuators',
			icon: faToggleOff,
			path: 'actuators',
			management: ['switches']
		},
		{
			name: 'Ecosystem health',
			icon: faHeartbeat,
			path: 'sensors/ecosystem',
			management: ['health', 'ecosystem_data']
		},
		{
			name: 'Environment',
			icon: faThermometerHalf,
			path: 'sensors/environment',
			management: ['sensors', 'environment_data']
		},
		{
			name: 'Plants',
			icon: faSeedling,
			path: 'sensors/plants',
			management: ['sensors', 'plants_data']
		},
		{
			name: 'Camera',
			icon: faVideo,
			path: 'camera',
			management: ['pictures']
		}
	];

	// Might want to use a `hasAnyManagements` instead
	const hasAllManagements = function (ecosystemManagement, managements) {
		for (const management of managements) {
			if (! ecosystemManagement[management]) {
				return false;
			}
		}
		return true;
	}

	let ecosystemMenus = [];
	for (const id of ecosystemsIds) {
		const uid = id['uid'];
		const ecosystemManagement = ecosystemsManagement[uid];
		let children = [];
		if (currentUser.can(permissions.OPERATE)) {
			children.push(MenuItem('Settings', `/ecosystem/${slugify(id['name'])}/settings`, faCog));
		}
		for (const menuItemAvailable of ecosystemMenuItemsAvailable) {
			if (hasAllManagements(ecosystemManagement, menuItemAvailable['management'])) {
				children.push(
					MenuItem(
						menuItemAvailable['name'],
						`/ecosystem/${slugify(id['name'])}/${menuItemAvailable['path']}`,
						menuItemAvailable['icon']
					)
				);
			}
		}
		ecosystemMenus.push(MenuItem(id['name'], '#', undefined, children, 'var(--green)'));
	}
	if (ecosystemMenus.length > 0) {
		menuItems.push(MenuItem('Ecosystems', '#', faGlobe, ecosystemMenus));
	}

	if (currentUser.can(permissions.ADMIN)) {
		// System menu
		let systemMenus = [MenuItem('Services', '/admin/services/settings', undefined)];
		for (const id of systemsIds) {
			const uid = id['uid'];
			const children = [
				MenuItem('Logs', `/admin/system/${uid}/logs`),
				MenuItem('Server load', `/admin/system/${uid}/load`)
			];
			systemMenus.push(MenuItem(id['name'], '#', undefined, children, 'var(--derived-50)'));
		}
		menuItems.push(MenuItem('Systems', '#', faDatabase, systemMenus));

		// User menu
		menuItems.push(MenuItem('Users', '/user', faUsers));
	}

	if (serviceEnabled(services, 'wiki')) {
		let wikiMenus = [];

		wikiMenus.push(MenuItem('Index', '/wiki'));

		for (const topic of wikiTopics) {
			wikiMenus.push(MenuItem(capitalize(topic['name']), `/wiki/u/${topic['slug']}`));
		}

		menuItems.push(MenuItem('Wiki', '#', faBook, wikiMenus));
	}
	return menuItems;
};
