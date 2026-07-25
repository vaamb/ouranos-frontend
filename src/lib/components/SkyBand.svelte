<script>
	import { onMount, onDestroy } from 'svelte';

	import { isEmpty } from '$lib/utils/functions.js';

	// `sunTimes` is a single day's entry from `fetchSuntimes()` (usually
	// `suntimes[0]`), whose fields are already `Date` objects. `location` is the
	// optional site name shown in the eyebrow.
	let { sunTimes = {}, location = '' } = $props();

	// Self-managed clock for the live "now" marker. Minute resolution is plenty
	// (the marker moves ~0.07% of the band per minute), so a 30s tick is enough.
	let now = $state(new Date());
	let clock;
	onMount(() => {
		clock = setInterval(() => (now = new Date()), 30 * 1000);
	});
	onDestroy(() => clearInterval(clock));

	const sky = {
		nightDeep: 'var(--sky-night-deep)',
		night: 'var(--sky-night)',
		twilight: 'var(--sky-twilight)', // civil dawn / dusk
		golden: 'var(--sky-golden)', // sunrise / sunset
		dayEdge: 'var(--sky-day-edge)',
		dayPeak: 'var(--sky-day-peak)'
	};

	// Position of a time on the 24h band, as a percentage, or null when missing
	const toPercent = function (date) {
		if (!date || isNaN(date)) {
			return null;
		}
		const seconds = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
		return (seconds / 86400) * 100;
	};

	const formatTimeShort = function (date) {
		if (!date || isNaN(date)) {
			return '--:--';
		}
		return date.toLocaleTimeString([], { timeStyle: 'short', hour12: false });
	};

	let dawn = $derived(toPercent(sunTimes['civil_dawn']));
	let sunrise = $derived(toPercent(sunTimes['sunrise']));
	let noon = $derived(toPercent(sunTimes['solar_noon']) ?? 50);
	let sunset = $derived(toPercent(sunTimes['sunset']));
	let dusk = $derived(toPercent(sunTimes['civil_dusk']));
	let nowPct = $derived(toPercent(now));

	// Build the diurnal gradient with its colour stops mapped onto the actual sun
	// times, so the purple twilight and amber golden-hour wedges sit exactly where
	// the tick marks do. Missing points are simply skipped.
	let gradient = $derived.by(() => {
		const stops = [[0, sky.nightDeep]];
		if (dawn != null) {
			stops.push([Math.max(dawn - 4, 1), sky.night], [dawn, sky.twilight]);
		}
		if (sunrise != null) {
			stops.push([sunrise, sky.golden], [sunrise + (noon - sunrise) * 0.35, sky.dayEdge]);
		}
		stops.push([noon, sky.dayPeak]);
		if (sunset != null) {
			stops.push([sunset - (sunset - noon) * 0.35, sky.dayEdge], [sunset, sky.golden]);
		}
		if (dusk != null) {
			stops.push([dusk, sky.twilight], [Math.min(dusk + 4, 99), sky.night]);
		}
		stops.push([100, sky.nightDeep]);
		stops.sort((a, b) => a[0] - b[0]);
		return `linear-gradient(90deg, ${stops.map(([p, c]) => `${c} ${p.toFixed(1)}%`).join(', ')})`;
	});

	// The phase we are currently in, for the centred label.
	let phase = $derived.by(() => {
		if (nowPct == null) {
			return '';
		}
		if (sunrise != null && sunset != null && nowPct >= sunrise && nowPct < sunset) {
			return 'Daylight';
		}
		if (dawn != null && sunrise != null && nowPct >= dawn && nowPct < sunrise) {
			return 'Dawn';
		}
		if (sunset != null && dusk != null && nowPct >= sunset && nowPct < dusk) {
			return 'Dusk';
		}
		return 'Night';
	});
</script>

{#if !isEmpty(sunTimes)}
	<section class="sky" aria-label="Local sky today">
		<div class="sky-head">
			<div>
				<div class="eyebrow">Local sky{location ? ` · ${location}` : ''}</div>
			</div>
			<div class="suntimes">
				{#if sunTimes['sunrise']}
					<span>
						<svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>
						&nbsp;{formatTimeShort(sunTimes['sunrise'])}
					</span>
				{/if}
				{#if sunTimes['sunset']}
					<span>
						<svg viewBox="0 0 24 24" fill="none" stroke="var(--text-dim-solid)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path></svg>
						&nbsp;{formatTimeShort(sunTimes['sunset'])}
					</span>
				{/if}
			</div>
		</div>

		<div class="band" style="background: {gradient};">
			{#if phase}
				<span class="phase">{phase}</span>
			{/if}
			{#if dawn != null}
				<span class="mark tw" style="left: {dawn}%" title="Dawn"></span>
			{/if}
			{#if sunrise != null}
				<span class="mark" style="left: {sunrise}%" data-label="sunrise"></span>
			{/if}
			{#if sunset != null}
				<span class="mark" style="left: {sunset}%" data-label="sunset"></span>
			{/if}
			{#if dusk != null}
				<span class="mark tw" style="left: {dusk}%" title="Dusk"></span>
			{/if}
			{#if nowPct != null}
				<span class="now" style="left: {nowPct}%"></span>
			{/if}
		</div>

		<div class="legend">
			<span class="faint">now {formatTimeShort(now)}</span>
		</div>
	</section>
{/if}

<style>
	.sky {
		margin: 0.6em 0 2em;
	}

	.sky-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 12px;
		flex-wrap: wrap;
	}

	.eyebrow {
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-dim-solid);
		margin-bottom: 2px;
	}

	.suntimes {
		display: flex;
		gap: 16px;
		align-items: center;
		flex-wrap: wrap;
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.85rem;
	}

	.suntimes span {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-weight: 600;
		color: var(--text);
	}

	.suntimes svg {
		width: 15px;
		height: 15px;
		flex: none;
	}

	.band {
		position: relative;
		height: 78px;
		border-radius: 6px;
		border: 1px solid var(--band-edge);
		box-shadow: var(--shadow), inset 0 0 40px #0000001a;
		overflow: hidden;
	}

	.phase {
		position: absolute;
		top: 10px;
		left: 50%;
		transform: translateX(-50%);
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.34em;
		text-transform: uppercase;
		color: var(--text);
		mix-blend-mode: soft-light;
		pointer-events: none;
	}

	.mark {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 1px;
		background: #ffffff70;
	}

	.mark.tw {
		background: #ffffff40;
	}

	.mark::after {
		content: attr(data-label);
		position: absolute;
		bottom: 9px;
		left: 5px;
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.62rem;
		font-weight: 600;
		color: #fff;
		text-shadow: 0 1px 2px #000000aa;
		white-space: nowrap;
	}

	.now {
		position: absolute;
		top: -1px;
		bottom: -1px;
		width: 2px;
		background: #fff;
		box-shadow: 0 0 0 1px #00000030, 0 0 14px #ffffffcc;
	}

	.now::before {
		content: '';
		position: absolute;
		top: -1px;
		left: 50%;
		width: 9px;
		height: 9px;
		transform: translateX(-50%);
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 0 10px #fff;
	}

	.legend {
		display: flex;
		gap: 18px;
		margin-top: 9px;
		flex-wrap: wrap;
		font-size: 0.72rem;
		color: var(--text-faint);
	}

	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.legend .faint {
		margin-left: auto;
		color: var(--text-faint);
		font-variant-numeric: tabular-nums;
	}
</style>
