<script>
	import { onMount, onDestroy } from 'svelte';

	import axios from 'axios';
	import Fa from 'svelte-fa';
	import { faCircleExclamation, faMoon, faSun, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Row from '$lib/components/layout/Row.svelte';
	import Box from '$lib/components/layout/Box.svelte';
	import BoxItem from '$lib/components/layout/BoxItem.svelte';
	import WeatherIcon from '$lib/components/WeatherIcon.svelte';

	import {
		currentUser,
		ecosystems,
		ecosystemsIds,
		ecosystemsActuatorsState,
		ecosystemsNycthemeralCycle,
		ecosystemsManagement,
		ecosystemsSensorsDataCurrent,
		ecosystemsSensorsSkeleton,
		ecosystemsState,
		getStoreDataKey,
		pingServerLatency,
		servers,
		serversCurrentData,
		serversIds,
		services,
		warnings,
		weatherCurrently,
		weatherHourly
	} from '$lib/store.svelte.js';
	import { actuatorTypes, API_URL, permissions } from '$lib/utils/consts.js';
	import {
		capitalize,
		computeEcosystemStatusClass,
		computeLightingHours,
		computeServerUptime,
		formatDate,
		formatDateTime,
		getParamStatus,
		isConnected,
		isEmpty,
		serviceEnabled,
		slugify,
		strHoursToDate
	} from '$lib/utils/functions.js';
	import {
		fetchCalendarEvents,
		fetchEcosystemActuatorsState,
		fetchSensorCurrentData,
		fetchEcosystemSensorsSkeleton,
		fetchEcosystemNycthemeralCycleData,
		fetchServerCurrentData,
		fetchSuntimes,
		fetchWeatherForecast
	} from '$lib/actions.svelte.js';

	let now = $state(new Date());
	const updateNow = function () {
		now = new Date();
	};
	let updateNowInterval = null;

	const sortWarningsByEcosystem = function (warnings) {
		const sortedWarnings = {};
		for (const warning of warnings) {
			sortedWarnings[warning['created_by']] = sortedWarnings[warning['created_by']] || [];
			sortedWarnings[warning['created_by']].push(warning);
		}
		return sortedWarnings;
	};
	let sortedWarnings = $derived(sortWarningsByEcosystem($warnings));

	let calendarEvents = $state([]);
	const sortCalendarEventsByHappening = function (events) {
		const sortedEvents = {
			happening: [],
			future: []
		};
		const now = new Date();
		for (const event of events) {
			if (event['start_time'] <= now && now <= event['end_time']) {
				sortedEvents['happening'].push(event);
			} else if (now <= event['start_time']) {
				sortedEvents['future'].push(event);
			}
		}
		return sortedEvents;
	};
	let sortedCalendarEvents = $derived(sortCalendarEventsByHappening(calendarEvents));

	const anyActiveActuator = function (ecosystemsActuatorsState, uid) {
		const actuatorsStatus = ecosystemsActuatorsState[uid];
		if (!actuatorsStatus) {
			return false;
		}
		for (const actuatorType of actuatorTypes) {
			if (actuatorsStatus[actuatorType]['active']) {
				return true;
			}
		}
		return false;
	};

	const fetchSensorsCurrentDataForMeasure = async function (ecosystemUID, measure, sensors) {
		let rv = [];
		for (const sensor of sensors) {
			const data = await fetchSensorCurrentData(
				ecosystemUID,
				sensor['uid'],
				measure.replace(' ', '_')
			);
			rv.push(data);
		}
		return rv;
	};

	let healthData = $state({})
	const fetchHealthLatestDataForMeasure = async function (ecosystemUID, measure, sensors) {
		const storedData = healthData[getStoreDataKey(ecosystemUID, measure)]
		if (storedData !== undefined) {
			return storedData;
		}
		let rv = [];
		for (const sensor of sensors) {
			const value = await axios
				.get(
					`${API_URL}/gaia/ecosystem/u/${ecosystemUID}/sensor/u/${sensor['uid']}/data/${measure}/historic`,
					{
						params: { window_length: 1 }
					}
				)
				.then((response) => {
					if (response['data']['values'].length === 0) {
						return null
					}
					return response['data']['values'][0][1];
				});
			if (value !== null) {
				rv.push(value);
			}
		}
		if (rv.length === 0) {
			return null;
		}
		const average = (array) => array.reduce((a, b) => a + b) / array.length;
		const result = average(rv).toFixed(4);
		healthData[getStoreDataKey(ecosystemUID, measure)] = result;
		return result;
	};

	const computeAverageSensorsCurrentDataForMeasure = function (
		ecosystemsSensorsDataCurrent,
		measure,
		sensors
	) {
		let rv = [];
		for (const sensor of sensors) {
			const data = ecosystemsSensorsDataCurrent[getStoreDataKey(sensor.uid, measure)];
			if (data) {
				rv.push(data.value);
			}
		}
		if (rv.length === 0) {
			return null;
		}
		const average = (array) => array.reduce((a, b) => a + b) / array.length;
		return average(rv).toFixed(2);
	};

	const getLevelColor = function (level) {
		['High', 'Severe', 'Critical'];
		if (level === 'High') {
			return '--yellow';
		} else if (level === 'Severe') {
			return '--orange';
		} else if (level === 'Critical') {
			return '--red';
		} else {
			return '--green';
		}
	};

	let suntimes = $state([]);
	let sensorsPrimed = $state(false)

	onMount(async () => {
		updateNowInterval = setInterval(updateNow, 3 * 1000);

		await fetchSensorCurrentData(undefined, 'priming', undefined)
				.then(() => {sensorsPrimed = true});

		for (const { uid, name } of $ecosystemsIds) {
			if (isConnected($ecosystemsState[uid]) && $ecosystemsState[uid]['status']) {
				await fetchEcosystemActuatorsState(uid);
			}
		}
		if (serviceEnabled($services, 'weather')) {
			await fetchWeatherForecast();
		}

		if (serviceEnabled($services, 'suntimes')) {
			suntimes = await fetchSuntimes();
		}

		if (serviceEnabled($services, 'calendar')) {
			calendarEvents = await fetchCalendarEvents();
		}
	});

	onDestroy(async () => {
		clearInterval(updateNowInterval);
	});
</script>

<HeaderLine title={'Home'} />

<h2>Global overview</h2>
<Row>
	<Box title="Calendar - {formatDate(now)}" align="center" href="/calendar">
		<BoxItem title="Happening now">
			{#each sortedCalendarEvents['happening'] as event}
				{@const color = getLevelColor(event['level'])}
				<p style="text-align: left">
					<Fa icon={faCircleExclamation} style="color: var({color});" />
					Until {event['end_time'].toLocaleDateString('en-GB')}: {event['title']}
				</p>
			{:else}
				<p style="text-align: left">There is no event happening currently.</p>
			{/each}
		</BoxItem>
		<BoxItem title="Planned">
			{#each sortedCalendarEvents['future'] as event}
				{@const color = getLevelColor(event['level'])}
				<p style="text-align: left">
					<Fa icon={faCircleExclamation} style="color: var({color});" />
					Starting on {event['start_time'].toLocaleDateString('en-GB')}: {event['title']}
				</p>
			{:else}
				<p style="text-align: left">There is no event planned.</p>
			{/each}
		</BoxItem>
	</Box>
	{#if serviceEnabled($services, 'weather') && !isEmpty($weatherCurrently)}
		<Box title="Current weather" align="center" href="/weather">
			<WeatherIcon icon={$weatherCurrently['icon']} />
			<BoxItem title={capitalize($weatherCurrently['summary'])}>
				<p>Temperature: {$weatherCurrently['temperature'].toFixed(1)} °C</p>
				<p>Humidity: {$weatherCurrently['humidity'].toFixed(1)} %</p>
				{#if !isEmpty($weatherHourly)}
					<p>
						Precipitation: {($weatherHourly[0]['precipitation_probability'] * 100).toFixed(1)} %
					</p>
				{/if}
				<p>Wind: {$weatherCurrently['wind_speed'].toFixed(1)} km/h</p>
				<p>Cloud cover: {$weatherCurrently['cloud_cover'].toFixed(1)} %</p>
				{#if !isEmpty(suntimes)}
					<div>
						<Fa icon={faSun} />&nbsp{suntimes[0]['sunrise'].toLocaleTimeString([], {
							timeStyle: 'short',
							hour12: false
						})}
						&nbsp; - &nbsp;
						<Fa icon={faMoon} />&nbsp{suntimes[0]['sunset'].toLocaleTimeString([], {
							timeStyle: 'short',
							hour12: false
						})}
					</div>
				{/if}
			</BoxItem>
		</Box>
	{/if}
	{#if $currentUser.can(permissions.ADMIN)}
		<Box title="Server info" align="center">
			<BoxItem title="Average latency">
				{#if $pingServerLatency === null}
					<p>Computing ...</p>
				{:else}
					<p>{$pingServerLatency} ms</p>
				{/if}
			</BoxItem>
			{#each $serversIds as serverIds}
				{@const serverUid = serverIds['uid']}
				<BoxItem title={serverIds['name']}>
					{#await fetchServerCurrentData(serverUid) then serverCurrentData_notUsed}
						{@const server = $servers[serverUid]}
						{@const serverCurrentData = $serversCurrentData[serverUid]}
						{#if server && serverCurrentData}
							<p style="font-size: 0.95rem; font-weight: bold; padding: 2px 0">Uptime</p>
							<p>
								{computeServerUptime(server['start_time'], now)}
							</p>

							<p style="font-size: 0.95rem; font-weight: bold; padding: 2px 0">System usage</p>
							<p>Average CPU load: {serverCurrentData.CPU_used} %</p>
							{#if serverCurrentData.CPU_temp}
								<p>CPU temperature: {serverCurrentData.CPU_temp} °C</p>
							{/if}
							<p>
								RAM used:
								{serverCurrentData.RAM_used} GB / {server.RAM_total} GB
							</p>
							<p>
								Disk used:
								{serverCurrentData.DISK_used} GB / {server.DISK_total} GB
							</p>
						{/if}
					{/await}
				</BoxItem>
			{/each}
		</Box>
	{/if}
	{#if $currentUser.isAuthenticated}
		<Box title="Ecosystem warnings overview" align="center" href="/warnings">
			{#if $warnings.length > 0}
				{#each Object.keys(sortedWarnings) as name}
					{@const ecosystemWarnings = sortedWarnings[name]}
					{#if ecosystemWarnings}
						<BoxItem title={name}>
							{#each ecosystemWarnings as warning}
								{@const color = getLevelColor(warning['level'])}
								<p style="text-align: left">
									<Fa icon={faCircleExclamation} style="color: var({color});" />
									On {formatDateTime(warning['created_on'])}: {warning['title']}
								</p>
							{/each}
						</BoxItem>
					{/if}
				{/each}
			{:else}
				<BoxItem title="No warning" />
			{/if}
		</Box>
	{/if}
</Row>

{#if $ecosystemsIds.length > 0}
	<h2>Ecosystems overview</h2>
	{#each $ecosystemsIds as { uid, name }}
		{@const ecosystem = $ecosystems[uid]}
		{#if ecosystem}
			<Box
				title={name}
				align="center"
				status={computeEcosystemStatusClass($ecosystemsState[uid])}
				direction="row"
			>
				{#if !$ecosystemsState[uid]['status']}
					<BoxItem>
						{#if isConnected($ecosystemsState[uid])}
							<p>The ecosystem '{name}' is not currently running</p>
							{#if $currentUser.can(permissions.OPERATE)}
								<p>
									Click
									<a href="/ecosystem/{name}/settings">here</a>
									to configure '{name}'
								</p>
							{/if}
						{:else}
							<p>The ecosystem '{name}' is not currently running and is not connected</p>
							<p>
								Last connection to the server on
								{formatDateTime(ecosystem['last_seen'])}
							</p>
						{/if}
					</BoxItem>
				{:else if !isConnected($ecosystemsState[uid])}
					<BoxItem>
						<p>The ecosystem {name} is not currently connected</p>
						<p>
							Last connection to the server on
							{formatDateTime(ecosystem['last_seen'])}
						</p>
					</BoxItem>
				{:else}{@html '<!--Only connected and running ecosystems afterwards-->'}
					{@const light = getParamStatus($ecosystemsManagement, uid, 'light')}
					{@const actuator = anyActiveActuator($ecosystemsActuatorsState, uid)}
					{@const ecosystemData = getParamStatus($ecosystemsManagement, uid, 'ecosystem_data')}
					{@const environmentData = getParamStatus($ecosystemsManagement, uid, 'environment_data')}
					{@const plantsData = getParamStatus($ecosystemsManagement, uid, 'plants_data')}
					{#if !(light || actuator || ecosystemData || environmentData || plantsData)}
						<BoxItem>
							<p>No functionality is enabled in {name}</p>
							{#if $currentUser.can(permissions.OPERATE)}
								<p>
									Click
									<a href="/ecosystem/{name}/settings">here</a>
									to configure {name}
								</p>
							{/if}
						</BoxItem>
					{/if}
					{#if light}
						<BoxItem title="Nycthemeral cycle">
							{#await fetchEcosystemNycthemeralCycleData(uid)}
								<p>Fetching data</p>
							{:then ecosystemLightData_notUsed}
								{@const nycthemeralCycle = $ecosystemsNycthemeralCycle[getStoreDataKey(uid)]}
								{@const formatTime = (timeStr) => {
									return strHoursToDate(timeStr).toLocaleTimeString([], {
										timeStyle: 'short',
										hour12: false
									});
								}}
								<p>Method: {nycthemeralCycle['span']}</p>
								{#if nycthemeralCycle['span'] === 'target'}
									<p>Target: {nycthemeralCycle['target']}</p>
								{/if}
								<p>
									Span: {formatTime(nycthemeralCycle['day'])} -
									{formatTime(nycthemeralCycle['night'])}
								</p>
								<p style="font-size: 1rem; font-weight: bold; padding: 2px 0; margin-top: 0.6rem">
									Lighting
								</p>
								<p>Method: {nycthemeralCycle['lighting']}</p>
								{#each computeLightingHours(nycthemeralCycle, 'short') as lightingHours}
									<p>{lightingHours}</p>
								{:else}
									<p>No lighting needed</p>
								{/each}
							{/await}
						</BoxItem>
					{/if}
					{#if actuator}
						<BoxItem title="Actuators" href="/ecosystem/{slugify(name)}/actuators">
							{#each actuatorTypes as actuatorType}
								{@const actuator = $ecosystemsActuatorsState[uid][actuatorType]}
								{#if actuator && actuator['active']}
									<p>
										{capitalize(actuatorType)}:
										<Fa
											icon={faSyncAlt}
											class={actuator['status'] ? 'on' : 'off'}
											spin={actuator['mode'] === 'automatic'}
										/>
									</p>
								{/if}
							{/each}
						</BoxItem>
					{/if}
					{#if ecosystemData}
						<BoxItem title="Ecosystem health" href="/ecosystem/{slugify(name)}/sensors/ecosystem">
							{#await fetchEcosystemSensorsSkeleton(uid, 'ecosystem')}
								<p>Collecting health data from the ecosystem</p>
							{:then sensorsSkeleton}
								{#each $ecosystemsSensorsSkeleton[getStoreDataKey(uid, 'ecosystem')] as sensorsBone}
									{#await fetchHealthLatestDataForMeasure(uid, sensorsBone.measure, sensorsBone.sensors)}
										<p>Collecting sensors data for {sensorsBone.measure} measure</p>
									{:then averageHealthData}
										{#if averageHealthData !== null}
											<p style="margin-bottom: 0">
												{capitalize(sensorsBone.measure).replace('_', ' ')}:
												{averageHealthData}
												{sensorsBone.units[0]}
											</p>
										{:else}
											<p style="margin-bottom: 0">
												No recent data for {capitalize(sensorsBone.measure).replace('_', ' ')}
											</p>
										{/if}
									{/await}
								{/each}
							{/await}
						</BoxItem>
					{/if}
					{#if environmentData & sensorsPrimed}
						<BoxItem title="Environment" href="/ecosystem/{slugify(name)}/sensors/environment">
							{#await fetchEcosystemSensorsSkeleton(uid, 'environment')}
								<p>Collecting environment data from the ecosystem</p>
							{:then sensorsSkeleton}
								{#each $ecosystemsSensorsSkeleton[getStoreDataKey(uid, 'environment')] as sensorsBone}
									{#await fetchSensorsCurrentDataForMeasure(uid, sensorsBone.measure, sensorsBone.sensors)}
										<p>Collecting sensors data for {sensorsBone.measure} measure</p>
									{:then sensorsData}
										{@const averageData = computeAverageSensorsCurrentDataForMeasure(
											$ecosystemsSensorsDataCurrent,
											sensorsBone.measure,
											sensorsBone.sensors
										)}
										{#if averageData !== null}
											<p style="margin-bottom: 0">
												{capitalize(sensorsBone.measure).replace('_', ' ')}:
												{averageData}
												{sensorsBone.units[0]}
											</p>
										{/if}
									{/await}
								{:else}
									<p style="margin-bottom: 0">No sensor data available</p>
								{/each}
							{/await}
						</BoxItem>
					{/if}
					{#if plantsData & sensorsPrimed}
						<BoxItem title="Plants" href="/ecosystem/{slugify(name)}/sensors/plants">
							{#await fetchEcosystemSensorsSkeleton(uid, 'plants')}
								<p>Collecting plants data from the ecosystem</p>
							{:then sensorsSkeleton}
								{#each $ecosystemsSensorsSkeleton[getStoreDataKey(uid, 'plants')] as sensorsBone}
									{#await fetchSensorsCurrentDataForMeasure(uid, sensorsBone.measure, sensorsBone.sensors)}
										<p>Collecting sensors data for {sensorsBone.measure} measure</p>
									{:then sensorsData}
										{@const averageData = computeAverageSensorsCurrentDataForMeasure(
											$ecosystemsSensorsDataCurrent,
											sensorsBone.measure,
											sensorsBone.sensors
										)}
										{#if averageData !== null}
											<p style="margin-bottom: 0">
												{capitalize(sensorsBone.measure).replace('_', ' ')}:
												{averageData}
												{sensorsBone.units[0]}
											</p>
										{/if}
									{/await}
								{:else}
									<p style="margin-bottom: 0">No sensor data available</p>
								{/each}
							{/await}
						</BoxItem>
					{/if}
				{/if}
			</Box>
		{/if}
	{/each}
{/if}

<style>
	p {
		margin-bottom: 0;
	}
</style>
