<script>
	import { onMount, onDestroy } from 'svelte';

	import { isEmpty, strHoursToDate } from '$lib/utils/functions.js';

	// `nycthemeralCycle` is a single ecosystem's `EcosystemNycthemeralCycle`
	// (span/lighting modes, day/night boundaries and the lighting windows). This is
	// the per-ecosystem photoperiod ribbon, distinct from the site-wide SkyBand: it
	// draws the chamber's own day/night cycle, not the real astronomical sky.
	let { nycthemeralCycle = {} } = $props();

	// Own clock for the live "now" marker (minute resolution is plenty).
	let now = $state(new Date());
	let clock;
	onMount(() => {
		clock = setInterval(() => (now = new Date()), 30 * 1000);
	});
	onDestroy(() => clearInterval(clock));

	const sky = {
		nightDeep: 'var(--sky-night-deep)',
		night: 'var(--sky-night)',
		golden: 'var(--sky-golden)', // day / night boundary
		dayPeak: 'var(--sky-day-peak)'
	};

	// Position of an 'HH:MM:SS' time (or a Date) on the 24h ribbon, as a percentage.
	const toPercent = function (time) {
		const date = time instanceof Date ? time : strHoursToDate(time);
		if (!date || isNaN(date)) {
			return null;
		}
		const seconds = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
		return (seconds / 86400) * 100;
	};

	let dayPct = $derived(toPercent(nycthemeralCycle['day']));
	let nightPct = $derived(toPercent(nycthemeralCycle['night']));
	let nowPct = $derived(toPercent(now));

	// Day/night gradient anchored on the chamber's own day and night boundaries,
	// with small golden wedges at each edge. No astronomical twilight here — a
	// nycthemeral cycle only carries the two boundaries.
	let gradient = $derived.by(() => {
		if (dayPct == null || nightPct == null) {
			return 'var(--sky-night)';
		}
		const wedge = Math.min(3, (nightPct - dayPct) / 4);
		const stops = [
			[0, sky.nightDeep],
			[Math.max(dayPct - 2, 0), sky.night],
			[dayPct, sky.golden],
			[dayPct + wedge, sky.dayPeak],
			[nightPct - wedge, sky.dayPeak],
			[nightPct, sky.golden],
			[Math.min(nightPct + 2, 100), sky.night],
			[100, sky.nightDeep]
		];
		return `linear-gradient(90deg, ${stops.map(([p, c]) => `${c} ${p.toFixed(1)}%`).join(', ')})`;
	});

	const formatTime = (date) => date.toLocaleTimeString([], { timeStyle: 'short', hour12: false });

	// The lighting windows: their {left, width} percentages place the grow bars on
	// the ribbon, and their start/end times label them in the caption. `fixed`
	// lighting is one continuous window; `elongate` bookends the natural day with a
	// morning and an evening window.
	let lightWindows = $derived.by(() => {
		const span = (startKey, endKey) => {
			const start = nycthemeralCycle[startKey];
			const end = nycthemeralCycle[endKey];
			if (!start || !end) {
				return null;
			}
			const startTime = strHoursToDate(start);
			const endTime = strHoursToDate(end);
			const left = toPercent(startTime);
			const right = toPercent(endTime);
			if (left == null || right == null || right <= left) {
				return null;
			}
			return { left, width: right - left, startTime, endTime };
		};
		const windows =
			nycthemeralCycle['lighting'] === 'elongate'
				? [span('morning_start', 'morning_end'), span('evening_start', 'evening_end')]
				: [span('morning_start', 'evening_end')];
		return windows.filter(Boolean);
	});

	// Compact "05:00–08:00 & 19:00–22:00" summary shown in the caption.
	let lightingHours = $derived(
		lightWindows.map((win) => `${formatTime(win.startTime)}–${formatTime(win.endTime)}`).join(' & ')
	);

	// The cycle identity shown in the caption: the place it mimics, or a fixed cycle.
	let cycleIdentity = $derived(
		nycthemeralCycle['span'] === 'mimic' && nycthemeralCycle['target']
			? `Mimics ${nycthemeralCycle['target']}`
			: 'Fixed cycle'
	);
</script>

{#if !isEmpty(nycthemeralCycle)}
	<div class="mini" style="background: {gradient};" title="Photoperiod (chamber cycle)">
		{#each lightWindows as win, i (i)}
			<span class="light-win" style="left: {win.left}%; width: {win.width}%"></span>
		{/each}
		{#if nowPct != null}
			<span class="now" style="left: {nowPct}%"></span>
		{/if}
	</div>
	<div class="mini-cap">
		<span>{cycleIdentity}</span>
		{#if lightingHours}
			<span class="sep">·</span><span class="hours">Lighting hours: {lightingHours}</span>
		{/if}
	</div>
{/if}

<style>
	.mini {
		position: relative;
		height: 8px;
		border-radius: 4px;
		border: 1px solid var(--band-edge);
	}

	.light-win {
		position: absolute;
		bottom: 0;
		height: 3px;
		background: var(--grow);
		box-shadow: 0 0 6px var(--grow);
		border-radius: 2px;
	}

	.now {
		position: absolute;
		top: -2px;
		bottom: -2px;
		width: 2px;
		background: #fff;
		box-shadow:
			0 0 6px #fff,
			0 0 0 1px #00000040;
		border-radius: 2px;
	}

	.mini-cap {
		font-size: 0.68rem;
		letter-spacing: 0.01em;
		color: var(--text-dim-solid);
	}

	.sep {
		margin: 0 5px;
		color: var(--text-faint);
	}

	.hours {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
	}
</style>
