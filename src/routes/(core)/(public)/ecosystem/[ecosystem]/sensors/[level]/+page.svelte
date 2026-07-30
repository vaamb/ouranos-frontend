<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	import Graph from '$lib/components/Graph.svelte';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import SensorTile from '$lib/components/SensorTile.svelte';
	import TitleBar from '$lib/components/TitleBar.svelte';

	import { useHeaderItems } from '$lib/components/header/header.svelte.ts';
	import {
		syncSensorCurrentData,
		syncSensorHistoricData,
		syncEcosystemSensorsSkeleton
	} from '$lib/actions.svelte.js';
	import { gaiaState, getKey } from '$lib/store.svelte.ts';
	import { themeState } from '$lib/theme.svelte.ts';
	import { capitalize, formatTimeShort } from '$lib/utils/functions.js';
	import { graphs } from '$lib/utils/styling.js';

	let { data } = $props();

	let ecosystemName = $derived(data['ecosystemName']);
	let ecosystemUID = $derived(data['ecosystemUID']);

	let sensorsLevel = $derived(page.params.level);

	// The two levels are the same page reading a different part of the greenhouse,
	// so they differ by their words only.
	const levels = {
		environment: { title: 'Environment', blurb: 'the air around the plants' },
		plants: { title: 'Plants', blurb: 'the substrate around the roots' }
	};

	let level = $derived(levels[sensorsLevel] || { title: capitalize(sensorsLevel), blurb: '' });

	let styling = $derived(graphs[sensorsLevel] || graphs['environment']);

	// `syncSensorHistoricData` asks for a week at these levels; every "since" and
	// every range on this page is therefore a statement about that week.
	const WINDOW_DAYS = 7;
	const DAY_MS = 24 * 60 * 60 * 1000;
	// A day's change needs a day of records behind it. Below this the tile says
	// so rather than quietly measuring a shorter window.
	const MIN_SPAN_MS = 18 * 60 * 60 * 1000;
	// Chart.js draws nothing useful from a handful of points; the card says why.
	const MIN_POINTS = 5;

	// A sensor only records while its ecosystem is running, so a week's series
	// routinely holds hour- or day-long holes. Chart.js joins whatever points it
	// is handed, and a straight line ramping across two unrecorded days is a claim
	// the data does not make. So the line is broken wherever the interval jumps
	// far past the sensor's own sampling cadence. The cadence is measured rather
	// than assumed, because the logging period is configurable — but it is only
	// ever trusted within bounds: never break a gap shorter than an hour,
	// and never carry a line across more than six.
	const GAP_FACTOR = 4;
	const MIN_GAP_MS = 60 * 60 * 1000;
	const MAX_GAP_MS = 6 * 60 * 60 * 1000;

	const gapThreshold = function (values) {
		if (values.length < 3) {
			return MAX_GAP_MS;
		}
		const intervals = [];
		for (let index = 1; index < values.length; index++) {
			intervals.push(
				new Date(values[index][0]).getTime() - new Date(values[index - 1][0]).getTime()
			);
		}
		intervals.sort((a, b) => a - b);
		const median = intervals[Math.floor(intervals.length / 2)];
		return Math.min(MAX_GAP_MS, Math.max(MIN_GAP_MS, median * GAP_FACTOR));
	};

	// Chart.js resolves no CSS variables, so the chart's chrome has to be read off
	// the document as literals and re-read on every theme flip, one frame later.
	let chartColors = $state({ line: '#16202e', grid: '#d7dfe8', tick: '#8b96a5' });

	$effect(() => {
		const theme = themeState.resolved;
		const frame = requestAnimationFrame(() => {
			const style = getComputedStyle(document.documentElement);
			const token = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
			chartColors = {
				line: token('--text', theme === 'dark' ? '#e9edf4' : '#16202e'),
				grid: token('--border', theme === 'dark' ? '#253048' : '#d7dfe8'),
				tick: token('--text-faint', theme === 'dark' ? '#647084' : '#8b96a5')
			};
		});
		return () => cancelAnimationFrame(frame);
	});

	let skeleton = $derived(
		gaiaState.ecosystemsSensorsSkeleton[getKey(ecosystemUID, sensorsLevel)] ?? []
	);

	const measureLabel = function (measure) {
		return capitalize(measure.replaceAll('_', ' '));
	};

	// One decimal is the useful resolution for a climate reading; a value in the
	// hundreds or thousands (lux, ppm) only gets noisier for it.
	const formatValue = function (value) {
		return Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(1);
	};

	// Min, max, and the change across the last day. Everything the tiles and the
	// chart captions say about a series, computed once per series.
	const summarize = function (values) {
		const points = values.filter((record) => typeof record[1] === 'number');
		if (points.length === 0) {
			return { min: null, max: null, delta: null, thin: true };
		}
		const first = new Date(points[0][0]).getTime();
		const last = new Date(points[points.length - 1][0]).getTime();
		const cutoff = last - DAY_MS;
		let min = points[0][1];
		let max = points[0][1];
		let anchor = null;
		for (const [timestamp, value] of points) {
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
			delta: thin || anchor === null ? null : points[points.length - 1][1] - anchor,
			thin: thin
		};
	};

	// One flat list of sensor x measure series: the tiles read it whole, the
	// charts read it grouped back by measure.
	let series = $derived.by(() => {
		return skeleton.flatMap((bone) => {
			const measure = bone['measure'];
			const several = bone['sensors'].length > 1;
			return bone['sensors'].map((sensor) => {
				const key = getKey(ecosystemUID, sensor['uid'], measure);
				const historic = gaiaState.ecosystemsSensorsDataHistoric[key];
				const values = historic?.['values'] ?? [];
				return {
					key: key,
					measure: measure,
					label: measureLabel(measure),
					sensorUID: sensor['uid'],
					sensorName: sensor['name'],
					// A measure with a single sensor reads better as just its own name.
					sensorTag: several ? sensor['name'] : null,
					// The styling map is a display refinement, so it wins where it has an
					// entry
					unit: styling.units[measure] ?? sensor['unit'] ?? '',
					color: styling.colors[measure] || styling.colors['default'] || chartColors.line,
					current: gaiaState.ecosystemsSensorsDataCurrent[key],
					historic: historic,
					values: values,
					stats: summarize(values),
					// Each sensor keeps its own cadence, so each series gets its own
					// tolerance for what counts as a hole.
					gap: gapThreshold(values)
				};
			});
		});
	});

	let freshest = $derived.by(() => {
		const timestamps = series
			.map((entry) => entry.current?.['timestamp'])
			.filter((timestamp) => timestamp instanceof Date);
		return timestamps.length ? new Date(Math.max(...timestamps)) : null;
	});

	// The page's chip in the header's contextual zone: how recently this greenhouse
	// reported at all.
	useHeaderItems(() => {
		if (!freshest) {
			return [];
		}
		return [
			{
				id: 'sensors-updated',
				label: 'Measured',
				value: formatTimeShort(freshest)
			}
		];
	});

	// Bounds are pushed in as null points so that every chart on the page spans
	// the same window, whatever its sensor happened to record.
	const formatHistoricData = function (entry) {
		const labels = [new Date(entry.historic['span'][0])];
		const values = [null];
		let previous = null;
		for (const record of entry.values) {
			const stamp = new Date(record[0]).getTime();
			// A null point one millisecond after the last reading lifts the pen
			// without moving the line's own start or end.
			if (previous !== null && stamp - previous > entry.gap) {
				labels.push(new Date(previous + 1));
				values.push(null);
			}
			labels.push(record[0]);
			values.push(record[1]);
			previous = stamp;
		}
		labels.push(new Date(entry.historic['span'][1]));
		values.push(null);

		return {
			labels: labels,
			datasets: [
				{
					label: entry.label,
					data: values,
					borderColor: entry.color,
					backgroundColor: entry.color + '18', // add alpha
					fill: true,
					borderWidth: 2,
					lineTension: 0.05
				}
			]
		};
	};

	let timeScale = $derived({
		type: 'time',
		time: { unit: 'day' },
		ticks: { color: chartColors.tick },
		grid: { color: chartColors.grid }
	});

	// The axis is scaled to the week the sensor actually recorded, not to the
	// measure's full theoretical span.
	const valueScale = function (entry, measure) {
		const stats = entry.stats;
		if (stats.min === null) {
			return {
				display: true,
				suggestedMin: styling.min_values[measure],
				suggestedMax: styling.max_values[measure],
				ticks: { color: chartColors.tick },
				grid: { color: chartColors.grid }
			};
		}
		// A perfectly flat series has no span of its own to pad against.
		const span = stats.max - stats.min || Math.abs(stats.max) || 1;
		const padding = span * 0.15;
		const floor = styling.min_values[measure];
		let min = stats.min - padding;
		if (typeof floor === 'number' && stats.min >= floor) {
			min = Math.max(floor, min);
		}
		return {
			display: true,
			suggestedMin: min,
			suggestedMax: stats.max + padding,
			ticks: { color: chartColors.tick },
			grid: { color: chartColors.grid }
		};
	};

	// Degrees and percentages sit tight against the figure
	const withUnit = function (text, unit) {
		const trimmed = unit.trim();
		if (!trimmed) {
			return text;
		}
		return `${text}${['°C', '%', '°'].includes(trimmed) ? '' : ' '}${trimmed}`;
	};

	const readingText = function (entry) {
		if (!entry.current) {
			return null;
		}
		return withUnit(formatValue(entry.current['value']), entry.unit);
	};

	const rangeText = function (entry) {
		const stats = entry.stats;
		if (stats.min === null) {
			return null;
		}
		return withUnit(`${formatValue(stats.min)}–${formatValue(stats.max)}`, entry.unit);
	};

	const fetchSensorData = async function (sensorUID, measure) {
		await syncSensorCurrentData(ecosystemUID, sensorUID, measure);
		await syncSensorHistoricData(ecosystemUID, sensorUID, measure, sensorsLevel);
	};

	// The empty state is a statement about the hardware, so it waits until the
	// skeleton has actually been asked for.
	let skeletonLoaded = $state(false);

	onMount(async () => {
		await syncSensorCurrentData(undefined, 'priming', undefined);
		await syncEcosystemSensorsSkeleton(ecosystemUID, sensorsLevel);
		skeletonLoaded = true;
		const bones = gaiaState.ecosystemsSensorsSkeleton[getKey(ecosystemUID, sensorsLevel)] ?? [];
		await Promise.all(
			bones.flatMap((bone) =>
				bone['sensors'].map((sensor) => fetchSensorData(sensor['uid'], bone['measure']))
			)
		);
	});
</script>

{#snippet counts()}
	{skeleton.length}
	{skeleton.length === 1 ? 'measure' : 'measures'}
	{#if freshest}· measured {formatTimeShort(freshest)}{/if}
{/snippet}

<!-- `TitleBar` draws its own separator dot as soon as it is handed a snippet, so
     the snippet is withheld entirely rather than rendered empty. -->
<TitleBar title="{level.title} in {ecosystemName}" sideBloc={skeleton.length ? counts : null} />

{#if skeleton.length}
	<!-- The window is stated once, here, rather than repeated beside every
	     section head. -->
	<p class="blurb">
		{#if level.blurb}
			What the sensors read in {level.blurb}, over the last {WINDOW_DAYS} days.
		{:else}
			Sensor readings over the last {WINDOW_DAYS} days.
		{/if}
	</p>

	<div class="tiles">
		{#each series as entry (entry.key)}
			<SensorTile
				label={entry.label}
				sensor={entry.sensorTag}
				value={entry.current?.['value'] ?? null}
				unit={entry.unit}
				delta={entry.stats.delta}
				note={entry.stats.thin ? 'less than a day of records' : null}
			/>
		{/each}
	</div>

	{#each skeleton as bone (bone['measure'])}
		{@const measure = bone['measure']}
		{@const measureSeries = series.filter((entry) => entry.measure === measure)}
		<SectionHead title={measureLabel(measure)} />

		{#each measureSeries as entry (entry.key)}
			<figure class="chart-card">
				<figcaption>
					<span class="cap-t">
						<span class="swatch" style="background: {entry.color}"></span>
						{entry.sensorName}
					</span>
					<span class="cap-now">
						{#if readingText(entry)}now {readingText(entry)}{/if}
						{#if rangeText(entry)}
							<span class="sep">·</span> range {rangeText(entry)}
						{/if}
					</span>
				</figcaption>

				{#if entry.values.length > MIN_POINTS}
					{@const formatted = formatHistoricData(entry)}
					<div class="plot">
						<!-- `Graph` builds its scales once and never revisits them, so the
						     theme's grid and tick colours have to remount it. Keyed on the
						     resolved colour rather than the theme, because the colours are
						     read a frame later. -->
						{#key chartColors.line}
							<Graph
								datasets={formatted['datasets']}
								labels={formatted['labels']}
								xScale={timeScale}
								yScale={valueScale(entry, measure)}
								height="200px"
							/>
						{/key}
					</div>
				{:else}
					<p class="thin">
						Not enough records yet to draw a line. This sensor's chart appears once it has reported
						a few more times.
					</p>
				{/if}
			</figure>
		{/each}
	{/each}
{:else if skeletonLoaded}
	<div class="nothing">
		<h2>No {level.title.toLowerCase()} sensor in {ecosystemName}</h2>
		<p>
			Nothing here is being measured. Fit a sensor to this ecosystem and its readings appear on this
			page.
		</p>
	</div>
{/if}

<style>
	.blurb {
		margin-bottom: 16px;
		font-size: 0.8rem;
		color: var(--text-dim-solid);
	}

	/* Tracks are capped as well as floored: a chamber with two sensors would
	   otherwise stretch two readings across the full width, and a tile is a
	   glance, not a banner. */
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 240px));
		justify-content: start;
		gap: 12px;
		margin-bottom: 26px;
	}

	.chart-card {
		margin: 0 0 18px;
		padding: 13px 15px 10px;
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

	.swatch {
		display: inline-block;
		width: 9px;
		height: 9px;
		border-radius: 2px;
		margin-right: 7px;
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

	.plot {
		position: relative;
		width: 100%;
	}

	.thin {
		padding: 22px 0 24px;
		text-align: center;
		font-size: 0.8rem;
		color: var(--text-dim-solid);
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
		font-size: 0.85rem;
		color: var(--text-dim-solid);
	}
</style>
