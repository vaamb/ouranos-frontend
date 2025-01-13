<script>
	import { onMount, onDestroy } from 'svelte';

	import Fa from 'svelte-fa';
	import { faCircleExclamation, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Row from '$lib/components/layout/Row.svelte';
	import Box from '$lib/components/layout/Box.svelte';
	import BoxItem from '$lib/components/layout/BoxItem.svelte';
	import WeatherIcon from '$lib/components/WeatherIcon.svelte';

	import {
		calendarEvents,
		currentUser,
		ecosystems,
		ecosystemsIds,
		ecosystemsActuatorsState,
		ecosystemsLightData,
		ecosystemsManagement,
		ecosystemsSensorsDataCurrent,
		ecosystemsSensorsSkeleton,
		getStoreDataKey,
		pingServerLatency,
		servers,
		serversCurrentData,
		serversIds,
		services,
		warnings,
		weatherCurrently
	} from '$lib/store.js';
	import { actuatorTypes, permissions } from '$lib/utils/consts.js';
	import {
		computeEcosystemStatusClass,
		computeLightingHours,
		computeServerUptime,
		isConnected,
		isEmpty,
		formatDate,
		formatDateTime,
		serviceEnabled,
		getParamStatus,
		capitalize,
		timeStringToDate
	} from '$lib/utils/functions.js';
	import {
		fetchEcosystemActuatorsState,
		fetchSensorCurrentData,
		fetchEcosystemSensorsSkeleton,
		fetchEcosystemLightData,
		fetchServerCurrentData,
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

	const sortCalendarEventsByHappening = function (calendarEvents) {
		const sortedEvents = {
			happening: [],
			future: []
		};
		const now = new Date();
		for (const event of calendarEvents) {
			if (event['start_time'] <= now && now <= event['end_time']) {
				sortedEvents['happening'].push(event);
			} else if (now <= event['start_time']) {
				sortedEvents['future'].push(event);
			}
		}
		return sortedEvents;
	};
	let sortedCalendarEvents = $derived(sortCalendarEventsByHappening($calendarEvents));

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
			const data = await fetchSensorCurrentData(ecosystemUID, sensor['uid'], measure.replace(' ', '_'));
			rv.push(data);
		}
		return rv;
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

	onMount(async () => {
		updateNowInterval = setInterval(updateNow, 3 * 1000);

		await fetchSensorCurrentData(undefined, 'priming', undefined)

		for (const { uid, name } of $ecosystemsIds) {
			if (isConnected($ecosystems[uid])) {
				await fetchEcosystemActuatorsState(uid);
			}
		}
		if (serviceEnabled($services, 'weather')) {
			await fetchWeatherForecast();
		}
	});

	onDestroy(async () => {
		clearInterval(updateNowInterval);
	});
</script>

<HeaderLine title={'Home'} />

<h2>Global overview</h2>
<Row>
	<Box title="Calendar - {formatDate(now)}" align="center">
		<a href="/calendar" style="background: var(--main-95); color:inherit; display: contents">
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
		</a>
	</Box>
	{#if serviceEnabled($services, 'weather') && !isEmpty($weatherCurrently)}
		<Box title="Current weather" align="center">
			<a href="/weather" style="display: inherit; flex-direction: inherit">
				<WeatherIcon icon={$weatherCurrently['icon']} />
				<BoxItem title={capitalize($weatherCurrently['summary'])}>
					<p>Temperature: {$weatherCurrently['temperature'].toFixed(1)} °C</p>
					<p>Humidity: {$weatherCurrently['humidity'].toFixed(1)} %</p>
					<!--<p>Precipitation: {$weatherCurrently['precipitation_probability'].toFixed(1)} %</p>-->
					<p>Wind: {$weatherCurrently['wind_speed'].toFixed(1)} km/h</p>
					<p>Cloud cover: {$weatherCurrently['cloud_cover'].toFixed(1)} %</p>
				</BoxItem>
			</a>
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
		<Box title="Ecosystem warnings overview" align="center">
			<a href="/warnings" style="background: var(--main-95); color:inherit; display: contents">
				{#if $warnings.length > 0}
					{#each Object.keys(sortedWarnings) as name}
						{@const ecosystemWarnings = sortedWarnings[name]}
						{#if ecosystemWarnings}
							<BoxItem title={name}>
								{#each ecosystemWarnings as warning}
									{@const color = getLevelColor(warning['level'])}
									<p style="text-align: left">
										<Fa icon={faCircleExclamation} style="color: var({color});" />
										On {timeStringToDate(warning['created_on'])}: {warning['title']}
									</p>
								{/each}
							</BoxItem>
						{/if}
					{/each}
				{:else}
					<BoxItem title="No warning" />
				{/if}
			</a>
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
				status={computeEcosystemStatusClass(ecosystem)}
				direction="row"
			>
				{#if !ecosystem['status']}
					<BoxItem>
						{#if isConnected(ecosystem)}
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
				{:else if !isConnected(ecosystem)}
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
					{@const environmentData = getParamStatus($ecosystemsManagement, uid, 'environment_data')}
					{@const plantsData = getParamStatus($ecosystemsManagement, uid, 'plants_data')}
					{#if !(light || actuator || environmentData || plantsData)}
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
						<BoxItem title="Lighting">
							{#await fetchEcosystemLightData(uid)}
								<p>Fetching data</p>
							{:then ecosystemLightData_notUsed}
								{@const lightData = $ecosystemsLightData[getStoreDataKey(uid)]}
								{#each computeLightingHours(lightData) as lightingHours}
									<p>{lightingHours}</p>
								{:else}
									<p>No lighting needed</p>
								{/each}
							{/await}
						</BoxItem>
					{/if}
					{#if actuator}
						<BoxItem title="Actuators">
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
					{#if environmentData}
						<BoxItem title="Environment">
							{#await fetchEcosystemSensorsSkeleton(uid, 'environment')}
								<p>Collecting environment's data from the ecosystem</p>
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
					{#if plantsData}
						<BoxItem title="Plants">
							{#await fetchEcosystemSensorsSkeleton(uid, 'plants')}
								<p>Collecting environment's data from the ecosystem</p>
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
