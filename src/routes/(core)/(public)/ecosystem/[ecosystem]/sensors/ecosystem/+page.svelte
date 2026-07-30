<script>
	import { onMount } from 'svelte';

	import Graph from '$lib/components/Graph.svelte';
	import Image from '$lib/components/Image.svelte';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import SensorTile from '$lib/components/SensorTile.svelte';
	import TitleBar from '$lib/components/TitleBar.svelte';

	import { useHeaderItems } from '$lib/components/header/header.svelte.ts';
	import {
		probePath,
		syncEcosystemSensorsSkeleton,
		syncSensorHistoricData
	} from '$lib/actions.svelte.js';
	import { gaiaState, getKey } from '$lib/store.svelte.ts';
	import { themeState } from '$lib/theme.svelte.ts';
	import { STATIC_URL } from '$lib/utils/consts.js';
	import { formatDate } from '$lib/utils/functions.js';

	let { data } = $props();

	let ecosystemName = $derived(data['ecosystemName']);
	let ecosystemUID = $derived(data['ecosystemUID']);

	// The page is `/health`, but `ecosystem` is the *hardware level* the backend
	// files these sensors under, and it is also what selects the 31-day window in
	// `syncSensorHistoricData`. It is a wire value, not a label.
	const LEVEL = 'ecosystem';

	const WINDOW_DAYS = 31;
	const DAY_MS = 24 * 60 * 60 * 1000;
	// Gaia's health subroutine runs on a daily cron, so "since yesterday" would be
	// a single sample of movement. A week is the shortest change worth stating —
	// and it needs most of a week behind it before it means anything.
	const DELTA_DAYS = 7;
	const MIN_SPAN_MS = 5 * DAY_MS;
	// Daily readings, so a handful of points is already a line worth drawing —
	// unlike the environment page, where the same three points span half an hour.
	const MIN_POINTS = 3;
	// Every index is a normalized difference of colour channels: unitless, signed,
	// and confined to [-1, 1]. Three decimals is where it stops being a flat line.
	const PRECISION = 3;

	// The health "sensors" are cameras and their measures are vegetation indices.
	// The formulas are gaia's own (`subroutines/health.py:indices`); a camera
	// configured with a measure this map has never heard of still renders, just
	// without its name and notation.
	const indices = {
		MPRI: {
			name: 'Modified photochemical reflectance index',
			formula: '(g − r) / (g + r)'
		},
		NDRGI: {
			name: 'Normalized difference red-green index',
			formula: '(r − g) / (g + r)'
		},
		VARI: {
			name: 'Visible atmospherically resistant index',
			formula: '(g − r) / (g + r − b)'
		},
		NDVI: {
			name: 'Normalized difference vegetation index',
			formula: '(nir − r) / (nir + r)'
		}
	};

	const indexOf = function (measure) {
		return indices[measure.toUpperCase()] ?? { name: null, formula: null };
	};

	// Chart.js resolves no CSS variables, so the chart's ink has to be read off the
	// document as literals and re-read on every theme flip, one frame later.
	let chartColors = $state({
		leaf: '#2f9a5e',
		grid: '#d7dfe8',
		zero: '#c4cedb',
		tick: '#8b96a5'
	});

	$effect(() => {
		const theme = themeState.resolved;
		const frame = requestAnimationFrame(() => {
			const style = getComputedStyle(document.documentElement);
			const token = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
			chartColors = {
				leaf: token('--leaf', theme === 'dark' ? '#46b877' : '#2f9a5e'),
				grid: token('--border', theme === 'dark' ? '#253048' : '#d7dfe8'),
				zero: token('--border-strong', theme === 'dark' ? '#2f3c58' : '#c4cedb'),
				tick: token('--text-faint', theme === 'dark' ? '#647084' : '#8b96a5')
			};
		});
		return () => cancelAnimationFrame(frame);
	});

	let skeleton = $derived(gaiaState.ecosystemsSensorsSkeleton[getKey(ecosystemUID, LEVEL)] ?? []);

	const format = function (value) {
		return value.toFixed(PRECISION);
	};

	// Min, max, the latest reading and the change across the last week.
	// Everything the tiles and the captions say about a series, computed once.
	const summarize = function (values) {
		if (values.length === 0) {
			return { min: null, max: null, latest: null, at: null, delta: null, thin: true };
		}
		const first = new Date(values[0][0]).getTime();
		const last = new Date(values[values.length - 1][0]).getTime();
		const cutoff = last - DELTA_DAYS * DAY_MS;
		let min = values[0][1];
		let max = values[0][1];
		let anchor = null;
		for (const [timestamp, value] of values) {
			if (value < min) {
				min = value;
			}
			if (value > max) {
				max = value;
			}
			if (anchor === null && new Date(timestamp).getTime() >= cutoff) {
				anchor = value;
			}
		}
		const thin = last - first < MIN_SPAN_MS;
		return {
			min: min,
			max: max,
			latest: values[values.length - 1][1],
			at: new Date(last),
			delta: thin || anchor === null ? null : values[values.length - 1][1] - anchor,
			thin: thin
		};
	};

	// One flat list of camera x index series: the tiles read it whole, the cards
	// read it grouped back by index.
	let series = $derived.by(() => {
		return skeleton.flatMap((bone) => {
			const measure = bone['measure'];
			const several = bone['sensors'].length > 1;
			return bone['sensors'].map((sensor) => {
				const key = getKey(ecosystemUID, sensor['uid'], measure);
				const historic = gaiaState.ecosystemsSensorsDataHistoric[key];
				const values = (historic?.['values'] ?? []).filter(
					(record) => typeof record[1] === 'number'
				);
				return {
					key: key,
					measure: measure,
					sensorUID: sensor['uid'],
					sensorName: sensor['name'],
					// A single-camera index reads better as just its own name.
					sensorTag: several ? sensor['name'] : null,
					historic: historic,
					values: values,
					stats: summarize(values)
				};
			});
		});
	});

	let freshest = $derived.by(() => {
		const stamps = series.map((entry) => entry.stats.at).filter((at) => at !== null);
		return stamps.length ? new Date(Math.max(...stamps)) : null;
	});

	// The page's chip in the header's contextual zone: when this greenhouse last sat
	// for its portrait.
	useHeaderItems(() => {
		if (!freshest) {
			return [];
		}
		return [{ id: 'health-photographed', label: 'Photographed', value: formatDate(freshest) }];
	});

	// Which frames actually exist on the server, probed once per series and keyed
	// the same way. Not an inline `{#await}` in the markup: that re-fires the probe
	// on every re-render.
	let frames = $state({});

	// The frame is the evidence for the number, so its cache buster is the reading
	// it belongs to rather than the clock. A new picture only exists once a new
	// reading does.
	const frameSource = function (entry) {
		const stamp = entry.stats.at ? entry.stats.at.getTime() : 0;
		return `${STATIC_URL}/ecosystem_health/${ecosystemUID}/${entry.sensorUID}/${entry.measure}.jpeg?${stamp}`;
	};

	// Bounds are pushed in as null points so every chart on the page spans the same
	// month, whatever its camera happened to record.
	const formatHistoricData = function (entry) {
		const labels = [new Date(entry.historic['span'][0])];
		const values = [null];
		for (const record of entry.values) {
			labels.push(record[0]);
			values.push(record[1]);
		}
		labels.push(new Date(entry.historic['span'][1]));
		values.push(null);

		return {
			labels: labels,
			datasets: [
				{
					label: entry.measure,
					data: values,
					borderColor: chartColors.leaf,
					backgroundColor: chartColors.leaf + '1f', // add alpha
					fill: true,
					borderWidth: 2,
					lineTension: 0.05
				}
			]
		};
	};

	// A tick a day over a month is a smear; a week between dated ticks is legible.
	let timeScale = $derived({
		type: 'time',
		time: { unit: 'day', displayFormats: { day: 'd MMM' } },
		ticks: { color: chartColors.tick, autoSkip: true, maxTicksLimit: 6 },
		grid: { color: chartColors.grid }
	});

	// Scaled to the month actually recorded, not to [-1, 1]: a canopy sitting
	// between 0.11 and 0.15 pinned to the index's full theoretical span is a flat
	// line across an empty plot.
	const valueScale = function (entry) {
		const stats = entry.stats;
		const grid = {
			color: (context) => (context?.tick?.value === 0 ? chartColors.zero : chartColors.grid),
			lineWidth: (context) => (context?.tick?.value === 0 ? 2 : 1)
		};
		if (stats.min === null) {
			return {
				display: true,
				suggestedMin: -1,
				suggestedMax: 1,
				ticks: { color: chartColors.tick, callback: (value) => value.toFixed(2) },
				grid: grid
			};
		}
		// A perfectly flat series has no span of its own to pad against.
		const span = stats.max - stats.min || Math.abs(stats.max) || 0.1;
		const padding = span * 0.15;
		// Chart.js drops trailing zeros, so `0` lands among `0.05`/`0.10` and breaks
		// the column of tabular figures. Pad every tick to a fixed width — three
		// decimals only where the month is too tight for two to separate the ticks.
		const decimals = span < 0.02 ? 3 : 2;
		return {
			display: true,
			suggestedMin: Math.max(-1, stats.min - padding),
			suggestedMax: Math.min(1, stats.max + padding),
			ticks: { color: chartColors.tick, callback: (value) => value.toFixed(decimals) },
			grid: grid
		};
	};

	// The empty state is a statement about the hardware, so it waits until the
	// skeleton has actually been asked for.
	let skeletonLoaded = $state(false);

	onMount(async () => {
		await syncEcosystemSensorsSkeleton(ecosystemUID, LEVEL);
		skeletonLoaded = true;
		const bones = gaiaState.ecosystemsSensorsSkeleton[getKey(ecosystemUID, LEVEL)] ?? [];
		await Promise.all(
			bones.flatMap((bone) =>
				bone['sensors'].map((sensor) =>
					syncSensorHistoricData(ecosystemUID, sensor['uid'], bone['measure'], LEVEL)
				)
			)
		);
		await Promise.all(
			series.map(async (entry) => {
				const source = frameSource(entry);
				frames[entry.key] = (await probePath(source)) ? source : null;
			})
		);
	});
</script>

{#snippet counts()}
	{series.length}
	{series.length === 1 ? 'index' : 'indices'}
{/snippet}

<!-- `TitleBar` draws its own separator dot as soon as it is handed a snippet, so
     the snippet is withheld entirely rather than rendered empty. -->
<TitleBar title="Health of {ecosystemName}" sideBloc={series.length ? counts : null} />

{#if skeleton.length}
	<p class="blurb">
		Once a day the chamber lights up, photographs its plants, and reduces each frame to a
		vegetation index — a signed, unitless reading of how green the canopy is against how red it
		is. Here are the last {WINDOW_DAYS} days.
	</p>

	<div class="tiles">
		{#each series as entry (entry.key)}
			<SensorTile
				label={entry.measure}
				sensor={entry.sensorTag}
				value={entry.stats.latest}
				delta={entry.stats.delta}
				deltaWindow="{DELTA_DAYS} days"
				precision={PRECISION}
				note={entry.stats.thin ? 'less than a week of readings' : null}
			/>
		{/each}
	</div>

	{#each skeleton as bone (bone['measure'])}
		{@const measure = bone['measure']}
		{@const index = indexOf(measure)}
		{@const measureSeries = series.filter((entry) => entry.measure === measure)}

		<SectionHead title={measure} aside={index.formula} />

		{#each measureSeries as entry (entry.key)}
			{@const frame = frames[entry.key]}
			<figure class="card">
				<figcaption>
					<span class="cap-t">{entry.sensorName}</span>
					{#if entry.stats.latest !== null}
						<span class="cap-now">
							latest {format(entry.stats.latest)}
							<span class="sep">·</span>
							range {format(entry.stats.min)}–{format(entry.stats.max)}
						</span>
					{/if}
				</figcaption>

				<div class="diptych" class:framed={frame}>
					{#if entry.values.length >= MIN_POINTS}
						{@const formatted = formatHistoricData(entry)}
						<div class="plot">
							<!-- `Graph` builds its scales once and never revisits them, so the
							     theme's ink has to remount it. Keyed on the resolved colour
							     rather than on the theme, because the colours are read a frame
							     later. -->
							{#key chartColors.leaf}
								<Graph
									datasets={formatted['datasets']}
									labels={formatted['labels']}
									xScale={timeScale}
									yScale={valueScale(entry)}
									height="210px"
								/>
							{/key}
						</div>
					{:else}
						<p class="thin">
							Not enough readings yet to draw a line. The chamber records one health reading a
							day, so this chart appears after a few more.
						</p>
					{/if}

					{#if frame}
						<div class="frame">
							<Image
								source={frame}
								alt="Frame from {entry.sensorName}, analysed for {index.name ?? measure}"
								caption={entry.stats.at ? formatDate(entry.stats.at) : 'Latest frame'}
								width="200"
								height="200"
							/>
						</div>
					{/if}
				</div>
			</figure>
		{/each}
	{/each}
{:else if skeletonLoaded}
	<div class="nothing">
		<h2>No health camera in {ecosystemName}</h2>
		<p>
			Nothing here is being photographed. Fit a camera to this ecosystem and give it a vegetation
			index to compute, and its readings appear on this page.
		</p>
	</div>
{/if}

<style>
	.blurb {
		max-width: 68ch;
		margin-bottom: 16px;
		font-size: 0.8rem;
		color: var(--text-dim-solid);
	}

	/* Tracks are capped as well as floored: a chamber with two indices would
	   otherwise stretch two readings across the full width, and a tile is a
	   glance, not a banner. */
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 240px));
		justify-content: start;
		gap: 12px;
		margin-bottom: 26px;
	}

	.card {
		container-type: inline-size;
		margin: 0 0 18px;
		padding: 13px 15px 12px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}

	figcaption {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 4px 12px;
		margin-bottom: 10px;
	}

	.cap-t {
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: var(--text);
	}

	.cap-now {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.76rem;
		font-weight: 600;
		color: var(--text-dim-solid);
	}

	.cap-now .sep {
		color: var(--text-faint);
	}

	.diptych {
		display: grid;
		gap: 14px;
		align-items: center;
	}

	/* The frame's column is exactly the thumbnail `Image` draws, so the plot keeps
	   everything else. Without a frame there is one column and no seam. */
	.diptych.framed {
		grid-template-columns: minmax(0, 1fr) 202px;
	}

	.plot {
		position: relative;
		min-width: 0;
	}

	.frame {
		display: flex;
		justify-content: flex-end;
	}

	.thin {
		padding: 22px 0 24px;
		text-align: center;
		font-size: 0.8rem;
		color: var(--text-dim-solid);
	}

	/* Keyed to the card, not the viewport: a narrow card stacks even on a wide
	   screen. */
	@container (max-width: 560px) {
		.diptych.framed {
			grid-template-columns: minmax(0, 1fr);
		}

		.frame {
			justify-content: flex-start;
		}
	}

	.nothing {
		padding: 26px 20px;
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius);
		background: var(--surface);
		text-align: center;
	}

	.nothing h2 {
		margin-bottom: 4px;
	}

	.nothing p {
		max-width: 46ch;
		margin: 0 auto;
		font-size: 0.85rem;
		color: var(--text-dim-solid);
	}
</style>
