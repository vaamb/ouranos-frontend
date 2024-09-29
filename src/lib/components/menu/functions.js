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

	/*
	let submenus = {
		environment_data: [],
		plants_data: [],
		health: [],
		actuators: [],
		webcam: []
	};
	for (const id of ecosystemsIds) {
		for (const submenu of Object.keys(submenus)) {
			const ecosystemManagement = ecosystemsManagement[id.uid] || {};
			if (ecosystemManagement[submenu]) {
				submenus[submenu].push({ uid: id.uid, name: id.name });
			}
		}
	}
	*/

	let ecosystemMenuItems = [
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
			name: 'Pictures',
			icon: faVideo,
			path: 'pictures',
			management: 'pictures'
		}
	];

	/*
	for (const menuItem of ecosystemMenuItems) {
		const management = menuItem.management;
		if (Object.prototype.hasOwnProperty.call(submenus, management)) {
			if (submenus[management].length > 0) {
				let children = [];
				for (const ecosystemId of submenus[management]) {
					children.push(MenuItem(ecosystemId.name, menuItem.path + '/' + ecosystemId.name));
				}
				menuItems.push(MenuItem(menuItem.name, menuItem.path, menuItem.icon, children));
			}
		}
	}
	 */

	if (currentUser.can(permissions.OPERATE)) {
		if (enginesIds.length > 0) {
			let children = [MenuItem('Overview', '/engine/overview/settings')];
			for (const id of enginesIds) {
				children.push(MenuItem(id.uid, `/engine/${id.uid}/settings`));
			}
			menuItems.push(MenuItem('Engines', '#', faServer, children));
		}
	}

	let ecosystemMenus = [];
	for (const id of ecosystemsIds) {
		const uid = id['uid'];
		const ecosystemManagement = ecosystemsManagement[uid];
		let children = [];
		if (currentUser.can(permissions.OPERATE)) {
			children.push(MenuItem('Settings', `/ecosystem/${id['name']}/settings`, faCog));
		}
		for (const menuItem of ecosystemMenuItems) {
			const management = menuItem['management'];
			if (ecosystemManagement[management]) {
				children.push(
					MenuItem(menuItem['name'], `/ecosystem/${id['name']}/${menuItem['path']}`, menuItem['icon'])
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
				MenuItem('Logs', `/admin/systems/${uid}/logs`),
				MenuItem('Server load', `/admin/systems/${uid}/load`)
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
