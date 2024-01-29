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
	faBellConcierge,
	faDatabase
} from '@fortawesome/free-solid-svg-icons';

import { permissions } from '$lib/utils/consts.js';

export function MenuItem(name, icon, path, children = []) {
	if (!path.startsWith('/')) {
		path = '/' + path;
	}
	return {
		name: name,
		icon: icon,
		path: path,
		children: children
	};
}

export function MenuItemChild(name, path) {
	if (!path.startsWith('/')) {
		path = '/' + path;
	}
	return {
		name: name,
		path: path
	};
}

export const generateMenuLayout = function (
	currentUser,
	ecosystemsIds,
	ecosystemsManagement,
	enginesIds,
	weatherEnabled
) {
	let menuLayout = {
		title: 'GAIA',
		items: [MenuItem('Home', faHome, '/')]
	};

	if (weatherEnabled === true) {
		menuLayout.items.push(MenuItem('Weather Forecast', faCloud, 'weather'));
	}

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
			name: 'Webcam',
			icon: faVideo,
			path: '/webcam',
			management: 'webcam'
		}
	];

	for (const menuItem of ecosystemMenuItems) {
		const management = menuItem.management;
		if (Object.prototype.hasOwnProperty.call(submenus, management)) {
			if (submenus[management].length > 0) {
				let children = [];
				for (const ecosystemId of submenus[management]) {
					children.push(MenuItemChild(ecosystemId.name, '/' + ecosystemId.name));
				}
				menuLayout.items.push(MenuItem(menuItem.name, menuItem.icon, menuItem.path, children));
			}
		}
	}

	if (currentUser.can(permissions.OPERATE)) {
		{
			let children = [];
			for (const id of ecosystemsIds) {
				children.push(MenuItemChild(id.name, '/' + id.name));
			}
			menuLayout.items.push(MenuItem('Ecosystems', faCog, '/settings/ecosystem', children));
		}
		{
			let children = [MenuItemChild('Overview', '/overview')];
			for (const id of enginesIds) {
				children.push(MenuItemChild(id.uid, '/' + id.uid));
			}
			menuLayout.items.push(MenuItem('Engines', faServer, '/settings/engine', children));
		}
	}

	if (currentUser.can(permissions.ADMIN)) {
		menuLayout.items.push(MenuItem('Services', faBellConcierge, '/services'));
		let children = [
            MenuItemChild('Server load', '/server'),
            MenuItemChild('Logs', '/logs')
        ];
		menuLayout.items.push(MenuItem('System', faDatabase, '/system', children));
	}
	return menuLayout;
};

export const restartServer = function () {
	// TODO
};
