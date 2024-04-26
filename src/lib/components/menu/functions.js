import {
	faHome,
	faCloud,
	faThermometerHalf,
	faCog,
	faServer,
	faSeedling,
	faHeartbeat,
	faToggleOff,
	faVideo,
	faDatabase
} from '@fortawesome/free-solid-svg-icons';

import { permissions } from '$lib/utils/consts.js';
import { serviceEnabled } from '$lib/utils/functions.js';

const MenuItem = function (name, path, icon=undefined, children = []) {
	return {
		name: name,
		icon: icon,
		path: path,
		children: children
	};
}

export const generateListOfMenuItems = function (
	currentUser,
	ecosystemsIds,
	ecosystemsManagement,
	enginesIds,
	services
) {
	let menuItems = [MenuItem('Home', '/', faHome)]

	if (serviceEnabled(services, 'weather')) {
		menuItems.push(MenuItem('Weather Forecast', 'weather', faCloud));
	}

	/*
	let submenus = {
		environment_data: [],
		plants_data: [],
		health: [],
		switches: [],
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
			name: 'Environments',
			icon: faThermometerHalf,
			path: '/sensors/environment',
			management: 'environment_data'
		},
		{
			name: 'Plants',
			icon: faSeedling,
			path: '/sensors/plants',
			management: 'plants_data'
		},
		{
			name: 'Plant health',
			icon: faHeartbeat,
			path: '/health',
			management: 'health'
		},
		{
			name: 'Switches',
			icon: faToggleOff,
			path: '/switches',
			management: 'switches'
		},
		{
			name: 'Pictures',
			icon: faVideo,
			path: '/pictures',
			management: 'webcam'
		}
	];

	/*
	for (const menuItem of ecosystemMenuItems) {
		const management = menuItem.management;
		if (Object.prototype.hasOwnProperty.call(submenus, management)) {
			if (submenus[management].length > 0) {
				let children = [];
				for (const ecosystemId of submenus[management]) {
					children.push(MenuItem(ecosystemId.name, '/' + ecosystemId.name));
				}
				menuItems.push(MenuItem(menuItem.name, menuItem.path, menuItem.icon, children));
			}
		}
	}
	 */

	if (currentUser.can(permissions.OPERATE)) {
		if (enginesIds.length > 0) {
			let children = [MenuItem('Overview', '/settings/engine/overview')];
			for (const id of enginesIds) {
				children.push(MenuItem(id.uid, '/settings/engine/' + id.uid));
			}
			menuItems.push(MenuItem('Engines', '/settings/engine', faServer, children));
		}
		/*
		if (ecosystemsIds.length > 0) {
			let children = [];
			for (const id of ecosystemsIds) {
				children.push(MenuItem(id.name, '/settings/ecosystem/' + id.name));
			}
			menuItems.push(MenuItem('Ecosystems', '/settings/ecosystem', faCog, children));
		}
		*/
	}

	let ecosystemMenus = []
	for (const id of ecosystemsIds) {
		const uid = id['uid']
		const ecosystemManagement = ecosystemsManagement[uid];
		let children = []
		if (currentUser.can(permissions.OPERATE)) {
			children.push(MenuItem("Settings", '/settings/ecosystem/' + id.name, faCog));
		}
		for (const menuItem of ecosystemMenuItems) {
			const management = menuItem['management']
			if (ecosystemManagement[management]) {
				children.push(
					MenuItem(
						menuItem['name'],
						menuItem['path'] + "/" + id['name'],
						menuItem['icon'],
					)
				)
			}
		}
		ecosystemMenus.push(MenuItem(id['name'], "#", undefined, children))
	}
	if (ecosystemMenus.length > 0) {
		menuItems.push(MenuItem("Ecosystems", "#", faSeedling, ecosystemMenus))
	}

	if (currentUser.can(permissions.ADMIN)) {
		let children = [
            MenuItem('Server load', '/admin/system/server'),
            // MenuItem('Logs', '/logs')
        ];
		menuItems.push(MenuItem('System', '/admin/system', faDatabase, children));
	}
	return menuItems;
};

export const restartServer = function () {
	// TODO
};
