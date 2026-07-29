<script>
	import { onMount } from 'svelte';

	import Graph from '$lib/components/Graph.svelte';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import TitleBar from '$lib/components/TitleBar.svelte';
	import WeatherIcon from '$lib/components/WeatherIcon.svelte';

	import { useHeaderItems } from '$lib/components/header/header.svelte.ts';
	import { syncWeatherForecast } from '$lib/actions.svelte.js';
	import { fetchSuntimes } from '$lib/queries.js';
	import { servicesState } from '$lib/store.svelte.ts';
	import { themeState } from '$lib/theme.svelte.ts';
	import { capitalize, days, formatTimeShort, isEmpty, serviceEnabled } from '$lib/utils/functions.js';

	let suntimes = $derived(servicesState.suntimes);

	// Chart.js resolves no CSS variables, so the chart's colours have to be read
	// off the document as literals
	//
	// The read is deferred to the next frame because the root layout stamps
	// `data-theme` in its own effect; querying before that paints would resolve
	// the outgoing theme's values.
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

	// ---- formatting -------------------------------------------------------
	const durationText = function (ms) {
		const minutes = Math.round(ms / 60000);
		return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
	};

	const deltaText = function (ms) {
		const minutes = Math.round(ms / 60000);
		if (minutes === 0) {
			return '±0m';
		}
		return `${minutes > 0 ? '+' : '−'}${Math.abs(minutes)}m`;
	};

	// Daylight for the nth suntimes entry, or null when that day is missing or
	// has no sunrise/sunset at all (both are nullable near the poles).
	const daylightMs = function (index) {
		const entry = suntimes[index];
		if (!entry || !entry['sunrise'] || !entry['sunset']) {
			return null;
		}
		return entry['sunset'] - entry['sunrise'];
	};

	// ---- header chip ------------------------------------------------------
	useHeaderItems(() => {
		const daylight = daylightMs(0);
		if (daylight === null) {
			return [];
		}
		return [
			{
				id: 'daylight',
				label: 'Daylight today',
				value: durationText(daylight),
				description: `Daylight today ${durationText(daylight)}`
			}
		];
	});

	// ---- Right now --------------------------------------------------------
	let currently = $derived(servicesState.weatherCurrently);

	let spread = $derived(
		isEmpty(currently) ? null : currently['temperature'] - currently['dew_point']
	);

	let nowMetrics = $derived.by(() => {
		if (isEmpty(currently)) {
			return [];
		}
		const metrics = [
			{ key: 'Humidity', value: currently['humidity'].toFixed(0), unit: '%' },
			{ key: 'Dew point', value: currently['dew_point'].toFixed(1), unit: '°C' },
			{
				key: 'Spread',
				value: spread.toFixed(1),
				unit: '°C',
				note: spread < 2 ? 'Condensation likely' : 'Dry — no condensation',
				warn: spread < 2
			},
			{ key: 'Wind', value: currently['wind_speed'].toFixed(1), unit: 'km/h' },
			{ key: 'Cloud', value: currently['cloud_cover'].toFixed(0), unit: '%' }
		];
		if (servicesState.weatherHourly.length > 0) {
			metrics.push({
				key: 'Rain',
				value: (servicesState.weatherHourly[0]['precipitation_probability'] * 100).toFixed(0),
				unit: '%'
			});
		}
		return metrics;
	});

	let daylightTrend = $derived.by(() => {
		const today = daylightMs(0);
		const tomorrow = daylightMs(1);
		if (today === null || tomorrow === null) {
			return null;
		}
		return tomorrow - today;
	});

	// ---- Next 48 hours ----------------------------------------------------
	// `ratio` measures are percentages and always get the full 0–100 axis; the
	// others are scaled to the data, because pinning temperature to zero spends
	// half the plot on degrees the week never reaches.
	// `signed` marks the one measure that can legitimately sit below zero;
	// everything else is clamped there.
	const measures = {
		temperature: { label: 'Temperature', unit: '°C', scale: 1, signed: true },
		humidity: { label: 'Humidity', unit: '%', scale: 1, ratio: true },
		precipitation_probability: {
			label: 'Precipitation',
			unit: '%',
			scale: 100,
			ratio: true
		},
		cloud_cover: { label: 'Cloud cover', unit: '%', scale: 1, ratio: true },
		wind_speed: { label: 'Wind', unit: 'km/h', scale: 1 }
	};

	const HOURS_SHOWN = 48;

	let currentMeasure = $state('temperature');

	const setCurrentMeasure = function (measure) {
		return function () {
			currentMeasure = measure;
		};
	};

	let hourlyDataset = $derived.by(() => {
		const measure = measures[currentMeasure];
		const entries = servicesState.weatherHourly.slice(0, HOURS_SHOWN);
		return [
			{
				label: measure.label,
				data: entries.map((entry) => entry[currentMeasure] * measure.scale),
				borderColor: chartColors.line,
				backgroundColor:
					chartColors.line.length === 7 ? chartColors.line + '14' : chartColors.line,
				fill: true,
				borderWidth: 2,
				lineTension: 0.4
			}
		];
	});

	let hourlyLabels = $derived(
		servicesState.weatherHourly.slice(0, HOURS_SHOWN).map((entry) => new Date(entry['timestamp']))
	);

	let hourlyRange = $derived.by(() => {
		const measure = measures[currentMeasure];
		const values = servicesState.weatherHourly
			.slice(0, HOURS_SHOWN)
			.map((entry) => entry[currentMeasure] * measure.scale);
		if (measure.ratio || values.length === 0) {
			return { min: 0, max: 100 };
		}
		const low = Math.floor((Math.min(...values) - 2) / 5) * 5;
		return {
			min: measure.signed ? low : Math.max(0, low),
			max: Math.ceil((Math.max(...values) + 2) / 5) * 5
		};
	});

	let hourlyScale = $derived({
		type: 'time',
		time: { unit: 'hour', displayFormats: { hour: 'HH:mm' } },
		ticks: { maxTicksLimit: 9, autoSkip: true, color: chartColors.tick },
		grid: { color: chartColors.grid }
	});

	let hourlyValueScale = $derived({
		display: true,
		suggestedMin: hourlyRange.min,
		suggestedMax: hourlyRange.max,
		ticks: { color: chartColors.tick },
		grid: { color: chartColors.grid }
	});

	// ---- The week ahead ---------------------------------------------------
	// `weatherDaily[0]` is today and lines up with `suntimes[0]`, so both are
	// indexed together.
	let week = $derived(servicesState.weatherDaily.slice(0, 7));

	// Min and max share ONE scale across all seven rows, so the bars are
	// comparable down the column — that comparability is why the row exists.
	let weekRange = $derived.by(() => {
		if (week.length === 0) {
			return null;
		}
		const low = Math.min(...week.map((day) => day['temperature_min']));
		const high = Math.max(...week.map((day) => day['temperature_max']));
		return { low: low, span: high - low || 1 };
	});

	const barStyle = function (day) {
		if (!weekRange) {
			return '';
		}
		const left = ((day['temperature_min'] - weekRange.low) / weekRange.span) * 100;
		const width = ((day['temperature_max'] - day['temperature_min']) / weekRange.span) * 100;
		return `left: ${left}%; width: ${width}%`;
	};

	const dayLabel = function (index, day) {
		if (index === 0) {
			return 'Today';
		}
		return days[new Date(day['timestamp']).getDay()].slice(0, 3);
	};

	// ---- On mount ---------------------------------------------------------
	onMount(async () => {
		if (serviceEnabled(servicesState.services, 'weather')) {
			await syncWeatherForecast();
		}

		if (
			serviceEnabled(servicesState.services, 'suntimes') &&
			servicesState.suntimes.length === 0
		) {
			servicesState.suntimes = await fetchSuntimes();
		}
	});
</script>

{#snippet updated()}
	{#if !isEmpty(currently)}
		updated {formatTimeShort(new Date(currently['timestamp']))}
	{/if}
{/snippet}

<TitleBar title="Weather" sideBloc={updated} />

<!-- ============ Right now ============ -->
{#if !isEmpty(currently)}
	<SectionHead title="Right now" aside="measured {formatTimeShort(new Date(currently['timestamp']))}" />

	<section class="now-card">
		<div class="now-top">
			<div class="now-icon">
				<WeatherIcon icon={currently['icon']} height="64px" size="64px" background="transparent" />
			</div>
			<div class="now-figure">
				{currently['temperature'].toFixed(1)}<span class="deg">°C</span>
			</div>
			<div>
				<div class="now-sum">{capitalize(currently['summary'])}</div>
				{#if week.length > 0}
					<div class="now-sub">
						Today {week[0]['temperature_min'].toFixed(0)}° to {week[0][
							'temperature_max'
						].toFixed(0)}°
					</div>
				{/if}
			</div>
		</div>

		<div class="metrics">
			{#each nowMetrics as metric (metric.key)}
				<div class="metric">
					<span class="k">{metric.key}</span>
					<span class="v">{metric.value}<span class="u"> {metric.unit}</span></span>
					{#if metric.note}
						<span class="note" class:warn={metric.warn}>{metric.note}</span>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Sunrise and sunset are a different kind of fact from the readings
		     above so they get their own block. -->
		{#if suntimes.length > 0 && (suntimes[0]['sunrise'] || suntimes[0]['sunset'])}
			<div class="sun-row">
				<div class="eyebrow">Sun today</div>
				<div class="sun-times">
					{#if suntimes[0]['sunrise']}
						<span>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="var(--amber)"
								stroke-width="2"
								stroke-linecap="round"
							>
								<circle cx="12" cy="12" r="4"></circle>
								<path
									d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
								></path>
							</svg>
							{formatTimeShort(suntimes[0]['sunrise'])}
						</span>
					{/if}
					{#if suntimes[0]['sunset']}
						<span>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="var(--text-dim-solid)"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>
							</svg>
							{formatTimeShort(suntimes[0]['sunset'])}
						</span>
					{/if}
				</div>
				{#if daylightMs(0) !== null}
					<div class="sun-len">
						Daylight {durationText(daylightMs(0))}
						{#if daylightTrend !== null}
							<span class="delta">{deltaText(daylightTrend)} tomorrow</span>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</section>
{/if}

<!-- ============ Next 48 hours ============ -->
{#if servicesState.weatherHourly.length > 0}
	<SectionHead title="Next 48 hours" aside="hour by hour" />

	<section class="chart-card">
		<div class="chart-head">
			<div class="chart-title">
				{measures[currentMeasure].label}
				<span class="sub">— {measures[currentMeasure].unit}</span>
			</div>
			<div class="measures" role="group" aria-label="Measure">
				{#each Object.entries(measures) as [key, measure] (key)}
					<button type="button" onclick={setCurrentMeasure(key)} aria-pressed={key === currentMeasure}>
						{measure.label}
					</button>
				{/each}
			</div>
		</div>
		<div class="plot-wrap">
			<!-- `Graph` builds its scales once and never revisits them, so anything
			     that lives in a scale has to remount it: the measure (which sets the
			     range) and the theme (which sets the grid and tick colours). -->
			{#key `${currentMeasure}-${chartColors.line}`}
				<Graph
					height="230px"
					datasets={hourlyDataset}
					labels={hourlyLabels}
					xScale={hourlyScale}
					yScale={hourlyValueScale}
				/>
			{/key}
		</div>
	</section>
{/if}

<!-- ============ The week ahead ============ -->
{#if week.length > 0}
	<SectionHead title="The week ahead" />

	<section class="week">
		<div class="week-head">
			<div>Day</div>
			<div></div>
			<div>Conditions</div>
			<div>Temperature</div>
			<div class="week-head-num">Humidity</div>
			<div class="week-head-num">Rain</div>
			<div class="week-head-num">Wind</div>
			<div class="h-daylight">Daylight</div>
		</div>

		{#each week as day, index (day['timestamp'])}
			<div class="week-row" class:today={index === 0}>
				<div class="week-date">
					{dayLabel(index, day)}
					<span class="num">{new Date(day['timestamp']).getDate()}</span>
				</div>
				<div class="week-icon">
					<WeatherIcon icon={day['icon']} height="30px" size="30px" background="transparent" />
				</div>
				<div class="week-sum">{capitalize(day['summary'])}</div>
				<div class="range">
					<span class="t lo">{day['temperature_min'].toFixed(0)}°</span>
					<span class="track"><span class="bar" style={barStyle(day)}></span></span>
					<span class="t hi">{day['temperature_max'].toFixed(0)}°</span>
				</div>
				<div class="week-num week-hum">{day['humidity'].toFixed(0)}<span class="u"> %</span></div>
				<div class="week-num week-rain" class:quiet={day['precipitation_probability'] < 0.1}>
					{(day['precipitation_probability'] * 100).toFixed(0)}<span class="u"> %</span>
				</div>
				<div class="week-num week-wind quiet">
					{day['wind_speed'].toFixed(0)}<span class="u"> km/h</span>
				</div>
				<div class="daylight">
					{#if daylightMs(index) !== null}
						{durationText(daylightMs(index))}
						{#if index > 0 && daylightMs(index - 1) !== null}
							<span class="delta">{deltaText(daylightMs(index) - daylightMs(index - 1))}</span>
						{/if}
						<span class="win">
							{formatTimeShort(suntimes[index]['sunrise'])} → {formatTimeShort(suntimes[index]['sunset'])}
						</span>
					{/if}
				</div>
				<div class="week-meta-m">
					Humidity {day['humidity'].toFixed(0)}% · Rain {(
						day['precipitation_probability'] * 100
					).toFixed(0)}% · Wind {day['wind_speed'].toFixed(0)} km/h{#if daylightMs(index) !== null}&nbsp;·
						Daylight {durationText(daylightMs(index))}{/if}
				</div>
			</div>
		{/each}
	</section>
{/if}

<style>
	/* The small uppercase label, shared with the metric keys and column heads. */
	.eyebrow {
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-faint);
	}

	/* ================= Right now ============================================ */
	/* `SectionHead` carries no top margin (the home page doesn't want one), so the
	   gap before the next section is owned by the block that precedes it. */
	.now-card,
	.chart-card {
		margin-bottom: 42px;
	}

	.now-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 20px 22px;
	}

	.now-top {
		display: flex;
		align-items: center;
		gap: 20px;
		flex-wrap: wrap;
	}

	.now-icon {
		flex: none;
		width: 64px;
		height: 64px;
	}

	.now-figure {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 46px;
		font-weight: 300;
		line-height: 1;
		letter-spacing: -0.02em;
		color: var(--text);
	}

	.now-figure .deg {
		font-size: 22px;
		font-weight: 600;
		color: var(--text-dim-solid);
	}

	.now-sum {
		font-size: 16px;
		font-weight: 600;
		color: var(--text);
	}

	.now-sub {
		font-size: 12.5px;
		color: var(--text-faint);
	}

	.metrics {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
		gap: 2px 0;
		margin-top: 18px;
		padding-top: 16px;
		border-top: 1px solid var(--border);
	}

	.metric {
		padding-right: 14px;
	}

	.metric + .metric {
		border-left: 1px solid var(--border);
		padding-left: 14px;
	}

	.metric .k {
		display: block;
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-faint);
	}

	.metric .v {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 17px;
		font-weight: 600;
		color: var(--text);
	}

	/* Svelte trims leading whitespace inside an element, so the gap between a
	   figure and its unit has to come from CSS, not a space in the markup. */
	.metric .u {
		margin-left: 0.2em;
		font-size: 11.5px;
		font-weight: 600;
		color: var(--text-dim-solid);
	}

	.metric .note {
		display: block;
		font-size: 10.5px;
		color: var(--text-faint);
	}

	.metric .note.warn {
		color: var(--amber);
		font-weight: 600;
	}

	.sun-row {
		display: flex;
		align-items: center;
		gap: 22px;
		flex-wrap: wrap;
		margin-top: 16px;
		padding-top: 14px;
		border-top: 1px solid var(--border);
	}

	.sun-row .eyebrow {
		flex: none;
	}

	.sun-times {
		display: flex;
		align-items: center;
		gap: 20px;
		flex-wrap: wrap;
	}

	.sun-times span {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 14px;
		font-weight: 600;
		color: var(--text);
	}

	.sun-times svg {
		width: 16px;
		height: 16px;
		flex: none;
	}

	.sun-len {
		margin-left: auto;
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-dim-solid);
	}

	.sun-len .delta {
		color: var(--text-faint);
		font-weight: 600;
	}

	/* ================= Next 48 hours ======================================== */
	.chart-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}

	.chart-head {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		padding: 12px 14px;
		border-bottom: 1px solid var(--border);
	}

	.chart-title {
		font-size: 13px;
		font-weight: 700;
		color: var(--text);
		margin-right: auto;
	}

	.chart-title .sub {
		font-weight: 500;
		color: var(--text-faint);
	}

	.measures {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.measures button {
		font-family: 'Raleway', sans-serif;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 6px 11px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--text-dim-solid);
		cursor: pointer;
	}

	.measures button[aria-pressed='true'] {
		background: var(--text);
		border-color: var(--text);
		color: var(--surface);
	}

	.plot-wrap {
		padding: 14px 14px 10px;
	}

	/* ================= The week ahead ======================================= */
	.week {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		overflow: hidden;
	}

	.week-head,
	.week-row {
		display: grid;
		grid-template-columns: 92px 32px minmax(104px, 1fr) minmax(146px, 1.4fr) 62px 58px 74px 116px;
		align-items: center;
		gap: 11px;
		padding: 0 16px;
	}

	.week-head {
		height: 32px;
		border-bottom: 1px solid var(--border);
		background: var(--surface-2);
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-faint);
	}

	.week-head-num {
		text-align: center;	
	}
	
	.week-row {
		min-height: 54px;
		border-top: 1px solid var(--border);
	}

	.week-row:first-of-type {
		border-top: 0;
	}

	.week-row.today {
		background: var(--surface-2);
	}

	.week-date {
		font-size: 13px;
		font-weight: 600;
		color: var(--text);
	}

	.week-date .num {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		color: var(--text-faint);
	}

	.week-icon {
		width: 30px;
		height: 30px;
	}

	.week-sum {
		font-size: 12.5px;
		color: var(--text-dim-solid);
	}

	.range {
		display: flex;
		align-items: center;
		gap: 9px;
	}

	.range .t {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 12px;
		font-weight: 600;
		width: 3.2ch;
		text-align: right;
	}

	.range .t.lo {
		color: var(--text-faint);
	}

	.range .t.hi {
		color: var(--text);
		text-align: left;
	}

	.range .track {
		position: relative;
		flex: 1;
		height: 6px;
		border-radius: 3px;
		background: var(--surface-2);
		box-shadow: inset 0 0 0 1px var(--border);
	}

	.range .bar {
		position: absolute;
		top: 0;
		bottom: 0;
		border-radius: 3px;
		background: var(--text-dim-solid);
	}

	.week-num {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 12.5px;
		font-weight: 600;
		color: var(--text);
		text-align: center;
	}

	.week-num.quiet {
		color: var(--text-faint);
	}

	.week-num .u {
		margin-left: 0.2em;
		font-size: 10.5px;
		font-weight: 600;
		color: var(--text-faint);
	}

	.daylight {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 12.5px;
		font-weight: 600;
		color: var(--text);
	}

	.daylight .win {
		display: block;
		font-size: 10.5px;
		font-weight: 600;
		color: var(--text-faint);
	}

	.daylight .delta {
		font-weight: 600;
		color: var(--text-faint);
	}

	/* Collapsed meta line, shown only once the columns are dropped below. */
	.week-meta-m {
		display: none;
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 11.5px;
		color: var(--text-faint);
	}

	@media only screen and (max-width: 820px) {
		.week-head,
		.week-row {
			grid-template-columns: 88px 30px minmax(96px, 1fr) minmax(130px, 1.2fr) 54px 52px 66px;
		}

		.week-head .h-daylight,
		.daylight {
			display: none;
		}
	}

	@media only screen and (max-width: 640px) {
		.week-head {
			display: none;
		}

		.week-row {
			grid-template-columns: 76px 28px 1fr;
			grid-template-areas:
				'date icon sum'
				'range range range'
				'meta meta meta';
			gap: 4px 10px;
			padding: 12px 14px;
		}

		.week-date {
			grid-area: date;
		}

		.week-icon {
			grid-area: icon;
		}

		.week-sum {
			grid-area: sum;
		}

		.range {
			grid-area: range;
			margin-top: 4px;
		}

		.week-meta-m {
			grid-area: meta;
			display: block;
		}

		.week-hum,
		.week-rain,
		.week-wind {
			display: none;
		}

		.metric + .metric {
			border-left: 0;
			padding-left: 0;
		}

		.sun-len {
			margin-left: 0;
			width: 100%;
		}
	}
</style>
