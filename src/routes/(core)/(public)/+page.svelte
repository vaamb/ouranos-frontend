<script>
	import { onMount, onDestroy } from 'svelte';

	import EcosystemCard from '$lib/components/EcosystemCard.svelte';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import SkyBand from '$lib/components/SkyBand.svelte';
	import SmallCard from '$lib/components/SmallCard.svelte';
	import TitleBar from '$lib/components/TitleBar.svelte';
	import WeatherIcon from '$lib/components/WeatherIcon.svelte';

	import { appState, gaiaState, getKey, infraState, servicesState } from '$lib/store.svelte.ts';
	import { permissions } from '$lib/utils/consts.js';
	import { useHeaderItems } from '$lib/components/header/header.svelte.ts';
	import {
		capitalize,
		computeEcosystemStatusClass,
		computeServerUptime,
		formatDate,
		isEmpty,
		serviceEnabled
	} from '$lib/utils/functions.js';

	let { data } = $props();

	// Store update
	gaiaState.ecosystemsActuatorsState = data.ecosystemsActuatorsState;
	gaiaState.ecosystemsSensorsSkeleton = data.ecosystemsSensorsSkeleton;
	gaiaState.ecosystemsNycthemeralCycle = data.ecosystemsNycthemeralCycleData;
	infraState.serversCurrentData = data.serversCurrentData;
	servicesState.weatherCurrently = data.currentWeatherForecast;

	// Now
	let now = $state(new Date());
	const updateNow = function () {
		now = new Date();
	};
	let updateNowInterval = null;

	useHeaderItems(() => {
		const latency = appState.pingServerLatency;
		const total = gaiaState.ecosystemsIds.length;
		const live = gaiaState.ecosystemsIds.filter(
			({ uid }) => computeEcosystemStatusClass(gaiaState.ecosystemsState[uid]) === 'on'
		).length;

		const items = [
			latency === null
				? {
						id: 'server',
						label: 'Server',
						value: '—',
						description: 'Server latency, still measuring'
					}
				: {
						id: 'server',
						label: 'Server',
						value: latency,
						unit: 'ms',
						dot: true,
						description: `Server latency ${latency} milliseconds`
					}
		];
		if (total > 0) {
			items.push({
				id: 'ecosystems',
				label: 'Ecosystems',
				value: `${live}/${total} up`,
				tone: live > 0 ? 'good' : 'default',
				description: `${live} of ${total} ecosystems running`
			});
		}
		return items;
	});

	// Warning and calendar
	const getLevelColor = function (level) {
		if (level === 'High') {
			return '--transition-yellow';
		} else if (level === 'Severe') {
			return '--transition-orange';
		} else if (level === 'Critical') {
			return '--critical-red';
		} else {
			return '--good-green';
		}
	};

	// Warnings
	let sortedWarnings = $derived.by(() => {
		const sortedWarnings = {};
		for (const warning of gaiaState.warnings) {
			sortedWarnings[warning['created_by']] = sortedWarnings[warning['created_by']] || [];
			sortedWarnings[warning['created_by']].push(warning);
		}
		return sortedWarnings;
	});

	// Calendar
	let calendarEvents = $state(data.calendarEvents);
	let sortedCalendarEvents = $derived.by(() => {
		const sortedEvents = {
			happening: [],
			future: []
		};
		for (const event of calendarEvents) {
			if (event['start_time'] <= now && now <= event['end_time']) {
				sortedEvents['happening'].push(event);
			} else if (now <= event['start_time']) {
				sortedEvents['future'].push(event);
			}
		}
		return sortedEvents;
	});

	// Seed the current-sensor-data store from the server load so the ecosystem
	// cards can read it (and refresh individual measures on their own).
	for (const ecosystem of data.currentSensorsData) {
		for (const sensorRecord of ecosystem['values']) {
			const storageKey = getKey(
				sensorRecord['ecosystem_uid'],
				sensorRecord['sensor_uid'],
				sensorRecord['measure']
			);
			gaiaState.ecosystemsSensorsDataCurrent[storageKey] = {
				timestamp: new Date(sensorRecord['timestamp']),
				value: sensorRecord['value']
			};
		}
	}

	// Camera pictures info is not stored in gaiaState as it changes frequently (new picture every ~1 min)
	let ecosystemsCameraPicturesInfo = $state(data.ecosystemsCameraPicturesInfo);

	// Other
	let suntimes = $state(data.suntimes);

	// On mount
	onMount(async () => {
		updateNowInterval = setInterval(updateNow, 3 * 1000);
	});

	onDestroy(async () => {
		clearInterval(updateNowInterval);
	});
</script>

{#snippet today()}
	{formatDate(now)}
{/snippet}

<TitleBar title="Home" sideBloc={today} />

{#if serviceEnabled(servicesState.services, 'suntimes') && !isEmpty(suntimes)}
	<SkyBand sunTimes={suntimes[0]} />
{/if}

{#if gaiaState.ecosystemsIds.length > 0}
	<SectionHead title="Ecosystems overview" />
	<section class="ecosystems-grid">
		{#each gaiaState.ecosystemsIds as { uid } (uid)}
			<EcosystemCard {uid} {now} cameraPicturesInfo={ecosystemsCameraPicturesInfo[uid]} />
		{/each}
	</section>
{/if}

<SectionHead title="Global overview" />

<section class="context">
	{#if serviceEnabled(servicesState.services, 'calendar')}
		<SmallCard title="Calendar" href="/calendar" linkText="All events →">
			{#each sortedCalendarEvents['happening'] as event (event['title'])}
				{@const color = getLevelColor(event['level'])}
				<div class="mod-line">
					<span class="lv" style="background: var({color})"></span>
					<span
						><b>{event['title']}</b> — until {event['end_time'].toLocaleDateString('en-GB')}</span
					>
				</div>
			{/each}
			{#each sortedCalendarEvents['future'] as event (event['title'])}
				{@const color = getLevelColor(event['level'])}
				<div class="mod-line">
					<span class="lv" style="background: var({color})"></span>
					<span>{event['title']} — from {event['start_time'].toLocaleDateString('en-GB')}</span>
				</div>
			{/each}
			{#if sortedCalendarEvents['happening'].length === 0 && sortedCalendarEvents['future'].length === 0}
				<div class="muted">Nothing scheduled.</div>
			{/if}
		</SmallCard>
	{/if}

	{#if serviceEnabled(servicesState.services, 'weather') && !isEmpty(servicesState.weatherCurrently)}
		<SmallCard title="Weather" href="/weather" linkText="Forecast →">
			<div class="weather">
				<WeatherIcon
					icon={servicesState.weatherCurrently['icon']}
					size="40px"
					height="48px"
					background="transparent"
					color="var(--amber)"
				/>
				<div>
					<div class="weather-temp">
						{servicesState.weatherCurrently['temperature'].toFixed(1)}<span class="deg">°C</span>
					</div>
					<div class="mini-data">
						{capitalize(servicesState.weatherCurrently['summary'])}<br />
						Humidity {servicesState.weatherCurrently['humidity'].toFixed(0)}% · Cloud {servicesState.weatherCurrently[
							'cloud_cover'
						].toFixed(0)}%<br />
						Wind {servicesState.weatherCurrently['wind_speed'].toFixed(1)} km/h
						{#if !isEmpty(servicesState.weatherHourly)}
							· Precip {(servicesState.weatherHourly[0]['precipitation_probability'] * 100).toFixed(
								0
							)}%
						{/if}
					</div>
				</div>
			</div>
		</SmallCard>
	{/if}

	{#if appState.currentUser.can(permissions.ADMIN) && infraState.serversIds.length > 0}
		<SmallCard title="Servers status">
			{#each infraState.serversIds as serverIds (serverIds)}
				{@const serverUid = serverIds['uid']}
				{@const server = infraState.servers[serverUid]}
				{#if !isEmpty(infraState.serversCurrentData[serverUid])}
					{@const serverCurrentData = infraState.serversCurrentData[serverUid]}
					<div class="server-name">{serverIds['name']}</div>
					<div class="mini-data">
						Uptime: {computeServerUptime(server['start_time'], now)} <br />
						CPU load: {serverCurrentData['CPU_used']}%
						{#if serverCurrentData['CPU_temp']}
							· CPU temp: {serverCurrentData['CPU_temp']}°C
						{/if}
						<br />
						RAM: {serverCurrentData['RAM_used']?.toFixed(1)}/{server['RAM_total'].toFixed(1)} GB · Disk:
						{serverCurrentData['DISK_used']?.toFixed(1)}/{server['DISK_total'].toFixed(1)} GB
					</div>
				{/if}
			{/each}
		</SmallCard>
	{/if}

	{#if appState.currentUser.isAuthenticated}
		<SmallCard title="Warnings">
			{#if gaiaState.warnings.length > 0}
				{#each Object.keys(sortedWarnings) as name (name)}
					{#each sortedWarnings[name] as warning (warning)}
						{@const color = getLevelColor(warning['level'])}
						<div class="mod-line">
							<span class="lv" style="background: var({color})"></span>
							<span><b>{name}</b> — {warning['title']}</span>
						</div>
					{/each}
				{/each}
			{:else}
				<div class="muted">No active warnings.</div>
			{/if}
		</SmallCard>
	{/if}
</section>

<style>
	.ecosystems-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
		margin-bottom: clamp(28px, 4vw, 44px);
	}

	/* "Global overview" band — small cards sharing SmallCard's shell */
	.context {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 16px;
	}

	.mod-line {
		display: flex;
		align-items: baseline;
		gap: 8px;
		font-size: 0.85rem;
		color: var(--text);
	}

	.mod-line b {
		font-weight: 700;
	}

	.mod-line .lv {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex: none;
		transform: translateY(1px);
	}

	.muted {
		color: var(--text-dim-solid);
		font-size: 0.85rem;
	}

	/* Weather */
	.weather {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.weather-temp {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 1.875rem;
		font-weight: 700;
		line-height: 1;
		color: var(--text);
	}

	.weather-temp .deg {
		font-size: 1rem;
		color: var(--text-dim-solid);
		margin-left: 1px;
	}

	.mini-data {
		font-size: 0.75rem;
		color: var(--text-dim-solid);
		line-height: 1.6;
	}

	.server-name {
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-dim-solid);
		margin-bottom: 2px;
	}
</style>
