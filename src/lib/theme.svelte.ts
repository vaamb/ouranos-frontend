import { browser } from '$app/environment';

import type { SunTimes } from '$lib/types.ts';

import { fetchSuntimes } from '$lib/queries.js';
import { servicesState } from '$lib/store.svelte.ts';
import { serviceEnabled } from '$lib/utils/functions.js';

export const THEME_MODES = ['auto', 'light', 'dark'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];
export type Theme = 'light' | 'dark';

export const THEME_LABELS: Record<ThemeMode, string> = {
	auto: 'Auto',
	light: 'Day',
	dark: 'Night'
};

// Both keys are also read by the inline restore script in `app.html`, which runs
// before the app boots. Renaming one means renaming it there too.
const MODE_KEY = 'ouranos-theme-mode';
const APPLIED_KEY = 'ouranos-theme';

const isMode = function (value: unknown): value is ThemeMode {
	return THEME_MODES.includes(value as ThemeMode);
};

const storedMode = function (): ThemeMode {
	if (!browser) {
		return 'auto';
	}
	try {
		const stored = localStorage.getItem(MODE_KEY);
		return isMode(stored) ? stored : 'auto';
	} catch {
		// Private-browsing modes can throw on access rather than return null.
		return 'auto';
	}
};

// Storage can be unavailable (private browsing, blocked cookies) and throws on
// access rather than failing quietly. Losing the memory of a theme is never
// worth breaking a page over, so every write goes through here.
const remember = function (key: string, value: string): boolean {
	try {
		localStorage.setItem(key, value);
	} catch {
		return false;
	}
	return true;
};

const prefersDark = function (): boolean {
	return browser && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// The last theme the app actually applied, as the pre-paint script in `app.html`
// reads it. Held in a module variable rather than re-read from storage on every
// access, and refreshed whenever a new theme is applied.
let lastApplied: Theme | null = null;

const readLastApplied = function (): Theme | null {
	if (!browser) {
		return null;
	}
	try {
		const stored = localStorage.getItem(APPLIED_KEY);
		return stored === 'dark' || stored === 'light' ? stored : null;
	} catch {
		return null;
	}
};

const sameDay = function (a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
};

// The site's own sun decides: light between sunrise and sunset, dark otherwise.
// Returns null when today's entry is missing or has no sunrise/sunset, so the
// caller can fall back.
const themeFromSun = function (now: Date, suntimes: Array<SunTimes>): Theme | null {
	const today = suntimes.find((entry) => sameDay(entry['datestamp'], now));
	if (!today || !today['sunrise'] || !today['sunset']) {
		return null;
	}
	return now >= today['sunrise'] && now < today['sunset'] ? 'light' : 'dark';
};

// Both `$state` fields below are plain literals on purpose, and are hydrated
// just after construction instead: giving a class field a `$state()` initializer
// that is a *call* makes Svelte emit a `/* @__PURE__ */` annotation in a spot
// Rollup then warns about and strips.
class ThemeState {
	// What the user picked. `auto` follows the sun over the server's location.
	mode = $state<ThemeMode>('auto');

	// Ticked by `useTheme()` so `auto` crosses sunrise and sunset on its own.
	// Held as a timestamp rather than a `Date` so equal ticks compare equal.
	nowMs = $state(0);

	get now(): Date {
		return new Date(this.nowMs);
	}

	// The theme actually applied to the document.
	//
	// The fallback order matters. `auto` prefers the last theme it applied over
	// the operating system, because the routes outside `(core)` (the whole `auth`
	// tree) never load the service list and so can never see the sun. Reading the
	// OS there would contradict what `app.html` just painted and flip the page on
	// arrival; reusing the last applied theme keeps a night session dark.
	get resolved(): Theme {
		if (this.mode !== 'auto') {
			return this.mode;
		}
		return (
			themeFromSun(this.now, servicesState.suntimes) ??
			lastApplied ??
			(prefersDark() ? 'dark' : 'light')
		);
	}

	// Whether `auto` can actually see the site's sun, or is running on a fallback.
	get sunKnown(): boolean {
		return themeFromSun(this.now, servicesState.suntimes) !== null;
	}

	set(mode: ThemeMode) {
		this.mode = mode;
		if (browser) {
			remember(MODE_KEY, mode);
		}
	}
}

export const themeState = new ThemeState();

// Synchronously, at import time, so the toggle never renders the wrong button as
// pressed and `resolved` is right on the very first read.
if (browser) {
	lastApplied = readLastApplied();
	themeState.mode = storedMode();
	themeState.nowMs = Date.now();
}

/**
 * Apply the theme to the document and keep it current.
 *
 * Call once, at the top level of the root layout's `<script>` — it registers
 * `$effect`s, so it inherits that component's lifetime and covers every route,
 * including the ones outside `(core)` that render no `Header`.
 */
export function useTheme() {
	// `auto` needs the site's own sun times. Pull them once if nothing else has;
	// the payload is today plus six days and does not change within a day.
	$effect(() => {
		if (themeState.mode !== 'auto') {
			return;
		}
		if (servicesState.suntimes.length > 0) {
			return;
		}
		if (!serviceEnabled(servicesState.services, 'suntimes')) {
			return;
		}

		let cancelled = false;
		fetchSuntimes().then((suntimes) => {
			if (!cancelled) {
				servicesState.suntimes = suntimes;
			}
		});

		return () => {
			cancelled = true;
		};
	});

	// A minute is ample resolution: the only edges that matter are a sunrise and
	// a sunset. The timer only runs while it can change something.
	$effect(() => {
		if (themeState.mode !== 'auto') {
			return;
		}
		const timer = setInterval(() => (themeState.nowMs = Date.now()), 60 * 1000);
		return () => clearInterval(timer);
	});

	// While `auto` has no sun to go on, follow the operating system live too.
	$effect(() => {
		if (themeState.mode !== 'auto' || themeState.sunKnown) {
			return;
		}
		const query = window.matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => (themeState.nowMs = Date.now());
		query.addEventListener('change', onChange);
		return () => query.removeEventListener('change', onChange);
	});

	$effect(() => {
		const theme = themeState.resolved;
		document.documentElement.dataset.theme = theme;
		// Cached so the pre-paint script in `app.html` can restore this exact theme
		// on the next load instead of flashing the wrong one.
		lastApplied = theme;
		remember(APPLIED_KEY, theme);
	});
}
