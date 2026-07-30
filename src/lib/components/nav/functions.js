import { permissions } from '$lib/utils/consts.js';
import {
	capitalize,
	computeEcosystemStatusClass,
	dynamicSort,
	isConnected,
	serviceEnabled,
	slugify
} from '$lib/utils/functions.js';

/**
 * Ouranos has two kind of pages, and `NavLine` renders both:
 *
 *   siteViews - the views of the whole site (ex: home, weather, calendar), always on the line
 *   groups    - the places (ex: ecosystems subpages, servers subpages), each carrying exactly
 *               the views it has
 *
 * A view's `id` is its *kind* (`environment`, `settings`, `logs`), not its path,
 * so switching place can keep you on the same kind of view.
 */

const view = function (id, name, path, prefixes = []) {
	return { id: id, name: name, path: path, prefixes: prefixes };
};

// A place's state renders as a pill, and the word is domain-specific:
// an engine is Connected, an ecosystem is Running. `null` renders no pill.
const STATUS = {
	running: { tone: 'good', word: 'Running' },
	stopped: { tone: 'critical', word: 'Stopped' },
	unreachable: { tone: 'neutral', word: 'Disconnected' },
	connected: { tone: 'good', word: 'Connected' }
};

// The order is data > control > configuration, and it is the order the views
// appear in on the line.
const ECOSYSTEM_VIEWS = [
	{
		id: 'environment',
		name: 'Environment',
		path: 'sensors/environment',
		management: ['sensors', 'environment_data']
	},
	{ id: 'plants', name: 'Plants', path: 'sensors/plants', management: ['sensors', 'plants_data'] },
	{
		id: 'health',
		name: 'Health',
		path: 'sensors/health',
		management: ['health', 'ecosystem_data']
	},
	{ id: 'actuators', name: 'Actuators', path: 'actuators', management: ['actuators'] },
	{ id: 'camera', name: 'Camera', path: 'camera', management: ['pictures'] },
	{ id: 'settings', name: 'Settings', path: 'settings', management: [] }
];

const hasAllManagements = function (ecosystemManagement, managements) {
	for (const management of managements) {
		if (!ecosystemManagement[management]) {
			return false;
		}
	}
	return true;
};

const ecosystemStatus = function (ecosystemState) {
	if (!ecosystemState) {
		return STATUS.unreachable;
	}
	const cls = computeEcosystemStatusClass(ecosystemState);
	if (cls === 'on') {
		return STATUS.running;
	} else if (cls === 'off') {
		return STATUS.stopped;
	}
	return STATUS.unreachable;
};

export const generateNavigation = function (
	currentUser,
	ecosystemsIds,
	ecosystemsManagement,
	ecosystemsState,
	enginesIds,
	enginesState,
	services,
	serversIds,
	wikiTopics
) {
	// --- The views of the whole site ------------------------------------
	let siteViews = [view('home', 'Home', '/')];

	if (serviceEnabled(services, 'calendar')) {
		siteViews.push(view('calendar', 'Calendar', '/calendar'));
	}
	if (serviceEnabled(services, 'weather')) {
		siteViews.push(view('weather', 'Weather', '/weather'));
	}
	if (serviceEnabled(services, 'wiki') && currentUser.can(permissions.VIEW)) {
		// An article and a topic are both "the wiki" as far as the line goes.
		siteViews.push(view('wiki', 'Wiki', '/wiki', ['/wiki/']));
	}
	if (currentUser.can(permissions.ADMIN)) {
		// `/user/u/…` is a user opened from the list, so it keeps Users lit;
		// `/user/settings` is your own account and belongs to the account menu.
		siteViews.push(view('users', 'Users', '/user', ['/user/u/']));
	}

	// --- The places ------------------------------------------------------
	let groups = [];

	let ecosystems = [];
	for (const id of [...ecosystemsIds].sort(dynamicSort('name'))) {
		const uid = id['uid'];
		const slug = slugify(id['name']);
		const management = ecosystemsManagement[uid] || {};
		const views = ECOSYSTEM_VIEWS.filter((v) => hasAllManagements(management, v['management'])).map(
			(v) => view(v['id'], v['name'], `/ecosystem/${slug}/${v['path']}`)
		);
		ecosystems.push({
			id: uid,
			name: id['name'],
			base: `/ecosystem/${slug}/`,
			status: ecosystemStatus(ecosystemsState[uid]),
			views: views
		});
	}
	if (ecosystems.length > 0) {
		groups.push({ id: 'ecosystems', label: 'Ecosystems', lead: null, places: ecosystems });
	}

	if (currentUser.can(permissions.OPERATE) && enginesIds.length > 0) {
		const engines = enginesIds.map((id) => ({
			id: id['uid'],
			name: id['uid'],
			mono: true,
			base: `/engine/${id['uid']}/`,
			status:
				enginesState[id['uid']] && isConnected(enginesState[id['uid']])
					? STATUS.connected
					: STATUS.unreachable,
			views: [view('settings', 'Settings', `/engine/${id['uid']}/settings`)]
		}));
		groups.push({
			id: 'engines',
			label: 'Engines',
			lead: view('engine-overview', 'Overview', '/engine/overview/settings'),
			places: engines
		});
	}

	if (currentUser.can(permissions.ADMIN)) {
		const servers = serversIds.map((id) => ({
			id: id['uid'],
			name: id['name'],
			base: `/admin/system/${id['uid']}/`,
			status: null,
			views: [
				view('logs', 'Logs', `/admin/system/${id['uid']}/logs`),
				view('load', 'Server load', `/admin/system/${id['uid']}/load`)
			]
		}));
		groups.push({
			id: 'servers',
			label: 'Servers',
			lead: view('services', 'Services', '/admin/services/settings'),
			places: servers
		});
	}

	if (serviceEnabled(services, 'wiki') && currentUser.can(permissions.VIEW)) {
		// A topic is a place with no views of its own — its articles are not
		// known without fetching them — so it renders as a chip, not a row.
		const topics = wikiTopics.map((topic) => ({
			id: topic['slug'],
			name: capitalize(topic['name']),
			base: `/wiki/u/${topic['slug']}`,
			status: null,
			views: []
		}));
		if (topics.length > 0) {
			groups.push({ id: 'wiki-topics', label: 'Wiki topics', lead: null, places: topics });
		}
	}

	return { siteViews: siteViews, groups: groups };
};

/**
 * Which place, if any, the current pathname is inside — and which kind of view
 * it is showing. Derived from the path rather than passed down, so a page never
 * has to declare where it lives.
 */
export const locate = function (pathname, nav) {
	for (const group of nav['groups']) {
		for (const place of group['places']) {
			if (place['views'].length > 0 && pathname.startsWith(place['base'])) {
				const current = place['views'].find((v) => v['path'] === pathname);
				return { place: place, viewId: current ? current['id'] : null };
			}
		}
	}
	return { place: null, viewId: null };
};

export const isCurrentView = function (pathname, v) {
	if (pathname === v['path']) {
		return true;
	}
	return v['prefixes'].some((prefix) => pathname.startsWith(prefix));
};
