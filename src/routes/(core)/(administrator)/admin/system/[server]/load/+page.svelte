<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	import Graph from '$lib/components/Graph.svelte';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import SensorTile from '$lib/components/SensorTile.svelte';
	import TitleBar from '$lib/components/TitleBar.svelte';

	import { useHeaderItems } from '$lib/components/header/header.svelte.ts';
	import { syncServerCurrentData, syncServerHistoricData } from '$lib/actions.svelte.js';
	import { getKey, infraState } from '$lib/store.svelte.ts';
	import { themeState } from '$lib/theme.svelte.ts';
	import {
		capitalize,
		computeServerUptime,
		formatTimeShort,
		isEmpty
	} from '$lib/utils/functions.js';
	import { graphs } from '$lib/utils/styling.js';

	let serverUID = $derived(page.params.server);
	let serverInfo = $derived(infraState.servers[serverUID]);
	let serverName = $derived(capitalize(serverUID.replaceAll('_', ' ')));

	// `/data/historic` hands back a week by default, so every "since" and every
	// range on this page is a statement about that week.
	const WINDOW_DAYS = 7;
	const DAY_MS = 24 * 60 * 60 * 1000;
	// A day's change needs a day of records behind it. Below this the tile says so
	// rather than quietly measuring a shorter window.
	const MIN_SPAN_MS = 18 * 60 * 60 * 1000;
	// Chart.js draws nothing useful from a handful of points; the card says why.
	const MIN_POINTS = 5;

	// Chart.js resolves no CSS variables, so the chart's chrome has to be read off
	// the document as literals and re-read on every theme flip, one frame later.
	let chartColors = $state({ ink: '#2f9a5e', grid: '#d7dfe8', tick: '#8b96a5' });

	$effect(() => {
		const theme = themeState.resolved;
		const frame = requestAnimationFrame(() => {
			const style = getComputedStyle(document.documentElement);
			const token = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
			chartColors = {
				ink: token('--leaf', theme === 'dark' ? '#46b877' : '#2f9a5e'),
				grid: token('--border', theme === 'dark' ? '#253048' : '#d7dfe8'),
				tick: token('--text-faint', theme === 'dark' ? '#647084' : '#8b96a5')
			};
		});
		return () => cancelAnimationFrame(frame);
	});

	// Uptime is the only thing on the page that moves without new data.
	let now = $state(new Date());

	$effect(() => {
		const tick = setInterval(() => {
			now = new Date();
		}, 60000);
		return () => clearInterval(tick);
	});

	const labels = graphs['server'].labels;
	const units = graphs['server'].units;

	// A subsystem is a section and a metric is a chart, the way a measure is a
	// section and a sensor is a chart on the ecosystem pages. `capacity` names the
	// field on the server record that says how much of the thing exists at all;
	// the processor has no such number.
	const sections = [
		{ id: 'processor', title: 'Processor', keys: ['CPU_used', 'CPU_temp'] },
		{ id: 'memory', title: 'Memory', keys: ['RAM_used', 'RAM_process'], capacity: 'RAM_total' },
		{ id: 'storage', title: 'Storage', keys: ['DISK_used'], capacity: 'DISK_total' }
	];

	// A 24-hour change is the right summary for a quantity that only creeps — memory,
	// disk. But for CPU load and temperature it would compare two instants of a value
	// that swings between every sample, so those two state what the week itself looked
	// like instead.
	const summaryKind = {
		CPU_used: 'average',
		CPU_temp: 'peak',
		RAM_used: 'change',
		RAM_process: 'change',
		DISK_used: 'change'
	};

	// The ceiling a metric cannot exceed, used as a cap on the chart's padded top
	// so a busy week never draws 104% of a processor. `null` where there is none.
	const ceiling = function (key) {
		if (key === 'CPU_used') {
			return 100;
		}
		if (key === 'RAM_used' || key === 'RAM_process') {
			return serverInfo?.['RAM_total'] ?? null;
		}
		if (key === 'DISK_used') {
			return serverInfo?.['DISK_total'] ?? null;
		}
		return null;
	};

	let historic = $derived(infraState.serversHistoricData[getKey(serverUID)] ?? []);
	let current = $derived(infraState.serversCurrentData[getKey(serverUID)]);

	// One decimal is the useful resolution here, but a value in the hundreds (a
	// disk in GB) only gets noisier for it.
	const formatValue = function (value) {
		return Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(1);
	};

	// Percentages and degrees sit tight against the figure; anything wordier (GB)
	// gets a space.
	const withUnit = function (text, unit) {
		const trimmed = unit.trim();
		if (!trimmed) {
			return text;
		}
		return `${text}${['°C', '%', '°'].includes(trimmed) ? '' : ' '}${trimmed}`;
	};

	// Min, max, mean and the change across the last day. Everything the tiles and
	// the chart captions say about a series, computed once per metric.
	const summarize = function (records, key) {
		const points = records.filter((record) => typeof record[key] === 'number');
		if (points.length === 0) {
			return { min: null, max: null, mean: null, delta: null, thin: true, count: 0 };
		}
		const first = points[0]['timestamp'].getTime();
		const last = points[points.length - 1]['timestamp'].getTime();
		const cutoff = last - DAY_MS;
		let min = points[0][key];
		let max = points[0][key];
		let total = 0;
		let anchor = null;
		for (const record of points) {
			const value = record[key];
			if (value < min) {
				min = value;
			}
			if (value > max) {
				max = value;
			}
			total += value;
			if (anchor === null && record['timestamp'].getTime() >= cutoff) {
				anchor = value;
			}
		}
		const thin = last - first < MIN_SPAN_MS;
		return {
			min: min,
			max: max,
			mean: total / points.length,
			delta: thin || anchor === null ? null : points[points.length - 1][key] - anchor,
			thin: thin,
			count: points.length
		};
	};

	let metrics = $derived.by(() => {
		return sections.flatMap((section) => {
			return section.keys.map((key) => {
				const stats = summarize(historic, key);
				const reading = !isEmpty(current) && typeof current[key] === 'number' ? current[key] : null;
				return {
					key: key,
					section: section.id,
					label: labels[key],
					unit: units[key],
					capacity: section.capacity ? (serverInfo?.[section.capacity] ?? null) : null,
					reading: reading,
					stats: stats,
					// A metric this machine cannot report at all (a board with no
					// temperature probe) is left out rather than drawn empty.
					reported: reading !== null || stats.min !== null
				};
			});
		});
	});

	let reported = $derived(metrics.filter((metric) => metric.reported));

	let measuredAt = $derived(!isEmpty(current) ? current['timestamp'] : null);

	// The page's chip in the header's contextual zone: how recently the machine
	// reported at all.
	useHeaderItems(() => {
		if (!measuredAt) {
			return [];
		}
		return [{ id: 'server-measured', label: 'Measured', value: formatTimeShort(measuredAt) }];
	});

	const noteText = function (metric) {
		const stats = metric.stats;
		// A week's average over three samples is not a week's average. Every kind of
		// summary says so rather than dressing up a few minutes as a window.
		if (stats.thin) {
			return 'less than a day of records';
		}
		if (summaryKind[metric.key] === 'average') {
			return stats.mean === null
				? null
				: `${WINDOW_DAYS}-day average ${withUnit(formatValue(stats.mean), metric.unit)}`;
		}
		if (summaryKind[metric.key] === 'peak') {
			return stats.max === null
				? null
				: `${WINDOW_DAYS}-day peak ${withUnit(formatValue(stats.max), metric.unit)}`;
		}
		return null;
	};

	// Only the creeping quantities get a 24-hour delta; the processor's two say
	// their week instead, so the tile falls through to the note.
	const deltaValue = function (metric) {
		return summaryKind[metric.key] === 'change' ? metric.stats.delta : null;
	};

	const readingText = function (metric) {
		if (metric.reading === null) {
			return null;
		}
		// The capacity belongs beside the figure it bounds — it is what the gauge
		// used to say, and the only place the page says it.
		const figure =
			metric.capacity === null
				? formatValue(metric.reading)
				: `${formatValue(metric.reading)} of ${formatValue(metric.capacity)}`;
		return withUnit(figure, metric.unit);
	};

	const rangeText = function (metric) {
		if (metric.stats.min === null) {
			return null;
		}
		return withUnit(
			`${formatValue(metric.stats.min)}–${formatValue(metric.stats.max)}`,
			metric.unit
		);
	};

	// The monitor only records while Ouranos itself is running, so a week's series
	// routinely holds hour- or day-long holes. Chart.js joins whatever points it is
	// handed, and a straight line ramping across three unrecorded days is a claim
	// the data does not make. So the line is broken wherever the interval jumps
	// far past the machine's own sampling cadence. The cadence is measured rather
	// than assumed, because the logging period is configurable.
	const GAP_FACTOR = 4;
	const MIN_GAP_MS = 30 * 60 * 1000;

	let gapThreshold = $derived.by(() => {
		if (historic.length < 3) {
			return Infinity;
		}
		const intervals = [];
		for (let index = 1; index < historic.length; index++) {
			intervals.push(
				historic[index]['timestamp'].getTime() - historic[index - 1]['timestamp'].getTime()
			);
		}
		intervals.sort((a, b) => a - b);
		return Math.max(MIN_GAP_MS, intervals[Math.floor(intervals.length / 2)] * GAP_FACTOR);
	});

	const chartData = function (metric) {
		const axis = [];
		const values = [];
		let previous = null;
		for (const record of historic) {
			const stamp = record['timestamp'];
			if (previous !== null && stamp.getTime() - previous > gapThreshold) {
				axis.push(new Date(previous + 1));
				values.push(null);
			}
			axis.push(stamp);
			values.push(typeof record[metric.key] === 'number' ? record[metric.key] : null);
			previous = stamp.getTime();
		}
		return {
			labels: axis,
			datasets: [
				{
					label: metric.label,
					data: values,
					borderColor: chartColors.ink,
					backgroundColor: chartColors.ink + '18', // add alpha
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

	// The axis is scaled to the week actually recorded, not to the metric's full
	// theoretical span. Zero is a floor and the capacity a cap, so the padding
	// can never claim negative load or more disk than exists.
	const valueScale = function (metric) {
		const stats = metric.stats;
		const top = ceiling(metric.key);
		if (stats.min === null) {
			return {
				display: true,
				suggestedMin: 0,
				suggestedMax: top ?? 100,
				ticks: { color: chartColors.tick },
				grid: { color: chartColors.grid }
			};
		}
		// A perfectly flat series has no span of its own to pad against.
		const span = stats.max - stats.min || Math.abs(stats.max) || 1;
		const padding = span * 0.15;
		return {
			display: true,
			suggestedMin: Math.max(0, stats.min - padding),
			suggestedMax: top === null ? stats.max + padding : Math.min(top, stats.max + padding),
			ticks: { color: chartColors.tick },
			grid: { color: chartColors.grid }
		};
	};

	// The empty state is a statement about the machine, so it waits until the data
	// has actually been asked for.
	let loaded = $state(false);

	onMount(async () => {
		await syncServerCurrentData(serverUID);
		await syncServerHistoricData(serverUID);
		loaded = true;
	});
</script>

{#snippet uptime()}
	up {computeServerUptime(serverInfo['start_time'], now)}
{/snippet}

<!-- `TitleBar` draws its own separator dot as soon as it is handed a snippet, so
     the snippet is withheld entirely rather than rendered empty. -->
<TitleBar title="Load on {serverName}" sideBloc={serverInfo?.['start_time'] ? uptime : null} />

{#if reported.length}
	<!-- The window is stated once, here, rather than repeated beside every section
	     head. -->
	<!-- Named by its uid, not its `hostname`: the monitor reports the address it
	     binds to, which is `0.0.0.0` on a machine that serves every interface. -->
	<p class="blurb">
		What {serverName} has been carrying over the last {WINDOW_DAYS} days.
	</p>

	<div class="tiles">
		{#each reported as metric (metric.key)}
			<SensorTile
				label={metric.label}
				value={metric.reading}
				unit={metric.unit}
				delta={deltaValue(metric)}
				note={noteText(metric)}
			/>
		{/each}
	</div>

	{#each sections as section (section.id)}
		{@const sectionMetrics = reported.filter((metric) => metric.section === section.id)}
		{#if sectionMetrics.length}
			<SectionHead title={section.title} />

			{#each sectionMetrics as metric (metric.key)}
				<figure class="chart-card">
					<figcaption>
						<span class="cap-t">{metric.label}</span>
						<span class="cap-now">
							{#if readingText(metric)}now {readingText(metric)}{/if}
							{#if rangeText(metric)}
								<span class="sep">·</span> range {rangeText(metric)}
							{/if}
						</span>
					</figcaption>

					{#if metric.stats.count > MIN_POINTS}
						{@const formatted = chartData(metric)}
						<div class="plot">
							<!-- `Graph` builds its scales once and never revisits them, so the
							     theme's grid and tick colours have to remount it. Keyed on the
							     resolved colour rather than the theme, because the colours are
							     read a frame later. -->
							{#key chartColors.ink}
								<Graph
									datasets={formatted['datasets']}
									labels={formatted['labels']}
									xScale={timeScale}
									yScale={valueScale(metric)}
									height="200px"
								/>
							{/key}
						</div>
					{:else}
						<p class="thin">
							Not enough records yet to draw a line. This chart appears once the server has
							logged a few more samples.
						</p>
					{/if}
				</figure>
			{/each}
		{/if}
	{/each}
{:else if loaded}
	<div class="nothing">
		<h2>Nothing recorded for {serverName}</h2>
		<p>
			This server has reported no load yet. Its readings appear here once the system monitor has
			logged them.
		</p>
	</div>
{/if}

<style>
	.blurb {
		margin-bottom: 16px;
		font-size: 0.8rem;
		color: var(--text-dim-solid);
	}

	/* Tracks are capped as well as floored: five readings would otherwise stretch
	   across the full width, and a tile is a glance, not a banner. */
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
