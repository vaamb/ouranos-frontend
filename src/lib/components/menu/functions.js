import {
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
	faVideo
} from '@fortawesome/free-solid-svg-icons';

import { permissions } from '$lib/utils/consts.js';
import { serviceEnabled } from '$lib/utils/functions.js';

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
	systemsIds
) {
	let menuItems = [MenuItem('Home', '/', faHome)];

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
			name: 'Environment',
			icon: faThermometerHalf,
			path: 'sensors/environment',
			management: 'environment_data'
		},
		{
			name: 'Plants',
			icon: faSeedling,
			path: 'sensors/plants',
			management: 'plants_data'
		},
		{
			name: 'Plant health',
			icon: faHeartbeat,
			path: 'health',
			management: 'health'
		},
		{
			name: 'Actuators',
			icon: faToggleOff,
			path: 'actuators',
			management: 'switches'
		},
		{
			name: 'Camera',
			icon: faVideo,
			path: 'camera',
			management: 'pictures'
		}
	];

	let ecosystemMenus = [];
	for (const id of ecosystemsIds) {
		const uid = id['uid'];
		const ecosystemManagement = ecosystemsManagement[uid];
		let children = [];
		if (currentUser.can(permissions.OPERATE)) {
			children.push(MenuItem('Settings', `/ecosystem/${id['name']}/settings`, faCog));
		}
		for (const menuItemAvailable of ecosystemMenuItemsAvailable) {
			const management = menuItemAvailable['management'];
			if (ecosystemManagement[management]) {
				children.push(
					MenuItem(
						menuItemAvailable['name'],
						`/ecosystem/${id['name']}/${menuItemAvailable['path']}`,
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
		let systemMenus = [];
		for (const id of systemsIds) {
			const uid = id['uid'];
			const children = [
				MenuItem('Logs', `/admin/system/${uid}/logs`),
				MenuItem('Server load', `/admin/system/${uid}/load`)
			];
			systemMenus.push(MenuItem(id['name'], '#', undefined, children, 'var(--derived-50)'));
		}
		menuItems.push(MenuItem('Systems', '#', faDatabase, systemMenus));
	}
	return menuItems;
};

export const restartServer = function () {
	// TODO
};
