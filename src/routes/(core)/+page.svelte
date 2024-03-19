<script>
	import { onMount } from 'svelte';

	import Fa from 'svelte-fa';
	import { faCircleExclamation, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Row from '$lib/components/layout/Row.svelte';
	import Box from '$lib/components/layout/Box.svelte';
	import BoxItem from '$lib/components/layout/BoxItem.svelte';

	import {
		currentUser,
		ecosystems,
		ecosystemsIds,
		ecosystemsActuatorData,
		ecosystemsLightData,
		ecosystemsManagement,
		ecosystemsSensorsDataCurrent,
		ecosystemsSensorsSkeleton,
		serverCurrentData,
		serverLastSeen,
		serverLatency,
		services,
		warnings,
		weatherCurrently
	} from '$lib/store.js';
	import { actuatorTypes, permissions } from '$lib/utils/consts.js';
	import {
		computeEcosystemStatusClass,
		computeLightingHours,
		computeUptime,
		isEmpty,
		formatDate,
		formatDateTime,
		getWeatherIcon,
		serviceEnabled,
		getParamStatus,
		capitalize,
		getStoreDataKey,
		timeStringToDate
	} from '$lib/utils/functions.js';
	import {
		fetchEcosystemActuatorsData,
		fetchSensorCurrentData,
		fetchEcosystemSensorsSkeleton,
		fetchEcosystemLightData,
		loadWeatherForecast
	} from '$lib/actions.js';

	export let data;
	const { serverCurrentDataValues, serverStartTimeValue } = data;
	serverCurrentData.set(serverCurrentDataValues);
	const serverStartTime = new Date(serverStartTimeValue);
	let now = new Date();

	$: weatherEnabled = serviceEnabled($services, 'weather');
	$: calendarEnabled = serviceEnabled($services, 'calendar');
	$: uptime = computeUptime($serverLastSeen, serverStartTime);

	const sortWarningsByEcosystem = function (warnings) {
		const sortedWarnings = {};
		for (const warning of warnings) {
			sortedWarnings[warning['created_by']] = sortedWarnings[warning['created_by']] || [];
			sortedWarnings[warning['created_by']].push(warning);
		}
		return sortedWarnings;
	};
	$: sortedWarnings = sortWarningsByEcosystem($warnings);

	const anyActiveActuator = function (ecosystemsActuatorData, uid) {
		const actuatorsStatus = ecosystemsActuatorData[uid];
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

	const fetchSensorsCurrentDataForMeasure = async function (measure, sensors) {
		let rv = [];
		for (const sensor of sensors) {
			const data = await fetchSensorCurrentData(sensor['uid'], measure.replace(' ', '_'));
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
		for (const { uid, name } of $ecosystemsIds) {
			if ($ecosystems[uid]['connected']) {
				await fetchEcosystemActuatorsData(uid);
			}
		}
		if (weatherEnabled) {
			await loadWeatherForecast(['hourly', 'daily']);
		}
	});
</script>

<HeaderLine title={'Home'} />

<h2>Global overview</h2>
<Row>
	<Box title="Calendar" align="center">
		<BoxItem title={formatDate(now)}>
			{#if calendarEnabled}
				<p>Later here: your personal calendar</p>
			{/if}
		</BoxItem>
	</Box>
	{#if weatherEnabled && !isEmpty($weatherCurrently)}
		<Box title="Current weather" align="center">
			<i class="{getWeatherIcon($weatherCurrently['icon'])} weather-icon"></i>
			<BoxItem title={$weatherCurrently['summary']}>
				<p>Temperature: {$weatherCurrently['temperature'].toFixed(1)} °C</p>
				<p>Wind: {$weatherCurrently['windSpeed'].toFixed(1)} km/h</p>
				<p>Precipitation:{($weatherCurrently['precipProbability'] * 100).toFixed(1)} %</p>
				<p>Humidity: {($weatherCurrently['humidity'] * 100).toFixed(1)} %</p>
				<p>Cloud cover:{($weatherCurrently['cloudCover'] * 100).toFixed(1)} %</p>
			</BoxItem>
		</Box>
	{/if}
	{#if $currentUser.can(permissions.ADMIN) && !isEmpty($serverCurrentData)}
		<Box title="Server info" align="center">
			<BoxItem title="Uptime">
				{uptime}
			</BoxItem>
			<BoxItem title="Average latency">
				<p>{$serverLatency} ms</p>
			</BoxItem>
			<BoxItem title="System usage">
				<p>Average CPU load: {$serverCurrentData.CPU_used} %</p>
				{#if $serverCurrentData.CPU_temp}
					<p>CPU temperature: {$serverCurrentData.CPU_temp} °C</p>
				{/if}
				<p>
					RAM used:
					{$serverCurrentData.RAM_used} GB / {$serverCurrentData.RAM_total} GB
				</p>
				<p>
					Disk used:
					{$serverCurrentData.DISK_used} GB / {$serverCurrentData.DISK_total} GB
				</p>
			</BoxItem>
		</Box>
	{/if}
	{#if $currentUser.isAuthenticated}
		<Box title="Ecosystem warnings overview" align="center">
			<a href="/warnings" style="background: var(--main-95); color:inherit; display: contents">
				{#if $warnings}
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
				{#if !ecosystem['connected']}
					<BoxItem>
						<p>The ecosystem {name} is not currently connected</p>
						<p>
							Last connection to the server on
							{formatDateTime(ecosystem['last_seen'])}
						</p>
					</BoxItem>
				{:else if !ecosystem['status']}
					<BoxItem>
						<p>The ecosystem {name} is not currently running</p>
						{#if $currentUser.can(permissions.OPERATE)}
							<p>
								Click
								<a href="/settings/ecosystem/{name}">here</a>
								to configure {name}
							</p>
						{/if}
					</BoxItem>
				{:else}{@html '<!--Only connected and running ecosystems afterwards-->'}
					{@const light = getParamStatus($ecosystemsManagement, uid, 'light')}
					{@const actuator = anyActiveActuator($ecosystemsActuatorData, uid)}
					{@const environmentData = getParamStatus($ecosystemsManagement, uid, 'environment_data')}
					{@const plantsData = getParamStatus($ecosystemsManagement, uid, 'plants_data')}
					{#if !(light || actuator || environmentData || plantsData)}
						<BoxItem>
							<p>No functionality is enabled in {name}</p>
							{#if $currentUser.can(permissions.OPERATE)}
								<p>
									Click
									<a href="/settings/ecosystem/{name}">here</a>
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
								{@const actuator = $ecosystemsActuatorData[uid][actuatorType]}
								{#if actuator['active']}
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
									{#await fetchSensorsCurrentDataForMeasure(sensorsBone.measure, sensorsBone.sensors)}
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
									{#await fetchSensorsCurrentDataForMeasure(sensorsBone.measure, sensorsBone.sensors)}
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

	.weather-icon {
		height: 115px;
		line-height: 115px;
		font-size: 70px;
		background: inherit;
		margin-bottom: -1px;
	}
</style>
