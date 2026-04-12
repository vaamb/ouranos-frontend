<script>
	import { onMount, onDestroy } from 'svelte';

	import Fa from 'svelte-fa';
	import { faCircle, faCircleExclamation, faMoon, faSun, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Row from '$lib/components/layout/Row.svelte';
	import Box from '$lib/components/layout/Box.svelte';
	import BoxItem from '$lib/components/layout/BoxItem.svelte';
	import WeatherIcon from '$lib/components/WeatherIcon.svelte';

	import {
		appState,
		gaiaState,
		getKey,
		infraState,
		servicesState
	} from '$lib/store.svelte.js';
	import { actuatorTypes, permissions } from '$lib/utils/consts.js';
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
		fetchCameraPicturesInfo,
		fetchEcosystemActuatorsState,
		fetchSensorCurrentData,
		fetchEcosystemSensorsSkeleton,
		fetchEcosystemNycthemeralCycleData,
		fetchHealthLatestDataForMeasure,
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
	let sortedWarnings = $derived(sortWarningsByEcosystem(gaiaState.warnings));

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

	const computeAverageSensorsCurrentDataForMeasure = function (
		ecosystemsSensorsDataCurrent,
		measure,
		sensors
	) {
		let rv = [];
		for (const sensor of sensors) {
			const data = ecosystemsSensorsDataCurrent[getKey(sensor.uid, measure)];
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
	let sensorsPrimed = $state(false);

	const recentPicture = function (timestamp, now) {
		return now - new Date(timestamp) < 5 * 60 * 1000 ? "--green": "--red"
	}

	let ecosystemsDataLoaded = $state({})
	onMount(async () => {
		updateNowInterval = setInterval(updateNow, 3 * 1000);

		await fetchSensorCurrentData(undefined, 'priming', undefined).then(() => {
			sensorsPrimed = true;
		});

		const fetchEcosystemData = async function (uid) {
			await Promise.all([
				fetchEcosystemActuatorsState(uid),
				fetchEcosystemNycthemeralCycleData(uid),
				fetchEcosystemSensorsSkeleton(uid, 'ecosystem'),
				fetchEcosystemSensorsSkeleton(uid, 'environment'),
				fetchEcosystemSensorsSkeleton(uid, 'plants'),
				fetchCameraPicturesInfo(uid)
			]);
			ecosystemsDataLoaded[uid] = true;
		}

		await Promise.all(
			gaiaState.ecosystemsIds
				.map((ecosystemIds) => ecosystemIds['uid'])
				.filter((uid) => isConnected(gaiaState.ecosystemsState[uid]) && gaiaState.ecosystemsState[uid]['status'])
				.map((uid) => fetchEcosystemData(uid))
		)

		if (serviceEnabled(servicesState.services, 'weather')) {
			await fetchWeatherForecast();
		}

		if (serviceEnabled(servicesState.services, 'suntimes')) {
			suntimes = await fetchSuntimes();
		}

		if (serviceEnabled(servicesState.services, 'calendar')) {
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
	{#if serviceEnabled(servicesState.services, 'calendar')}
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
	{/if}
	{#if serviceEnabled(servicesState.services, 'weather') && !isEmpty(servicesState.weatherCurrently)}
		<Box title="Current weather" align="center" href="/weather">
			<WeatherIcon icon={servicesState.weatherCurrently['icon']} />
			<BoxItem title={capitalize(servicesState.weatherCurrently['summary'])}>
				<p>Temperature: {servicesState.weatherCurrently['temperature'].toFixed(1)} °C</p>
				<p>Humidity: {servicesState.weatherCurrently['humidity'].toFixed(1)} %</p>
				{#if !isEmpty(servicesState.weatherHourly)}
					<p>
						Precipitation: {(servicesState.weatherHourly[0]['precipitation_probability'] * 100).toFixed(1)} %
					</p>
				{/if}
				<p>Wind: {servicesState.weatherCurrently['wind_speed'].toFixed(1)} km/h</p>
				<p>Cloud cover: {servicesState.weatherCurrently['cloud_cover'].toFixed(1)} %</p>
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
	<Box title="Server status" align="center">
		<BoxItem title="Average latency">
			{#if appState.pingServerLatency === null}
				<p>Computing ...</p>
			{:else}
				<p>{appState.pingServerLatency} ms</p>
			{/if}
		</BoxItem>
		{#if appState.currentUser.can(permissions.ADMIN)}
			{#each infraState.serversIds as serverIds}
				{@const serverUid = serverIds['uid']}
				<BoxItem title={serverIds['name']}>
					{#await fetchServerCurrentData(serverUid) then serverCurrentData_notUsed}
						{@const server = infraState.servers[serverUid]}
						{@const serverCurrentData = infraState.serversCurrentData[serverUid]}
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
		{/if}
	</Box>
	{#if appState.currentUser.isAuthenticated}
		<Box title="Ecosystem warnings overview" align="center" href="/warnings">
			{#if gaiaState.warnings.length > 0}
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

{#if gaiaState.ecosystemsIds.length > 0}
	<h2>Ecosystems overview</h2>
	{#each gaiaState.ecosystemsIds as { uid } (uid)}
		{@const ecosystem = gaiaState.ecosystems[uid]}
		{#if ecosystemsDataLoaded[uid] === true}
			{@const ecosystemState = gaiaState.ecosystemsState[uid]}
			{@const connected = isConnected(ecosystemState)}
			{@const running = ecosystemState['status']}
			<Box
				title={ecosystem['name']}
				align="center"
				status={computeEcosystemStatusClass(ecosystemState)}
				direction="row"
			>
				{#if connected && running}
					{@const light = getParamStatus(gaiaState.ecosystemsManagement, uid, 'light')}
					{@const actuator = getParamStatus(gaiaState.ecosystemsManagement, uid, 'actuators')}
					{@const ecosystemData = getParamStatus(gaiaState.ecosystemsManagement, uid, 'ecosystem_data')}
					{@const environmentData = getParamStatus(gaiaState.ecosystemsManagement, uid, 'environment_data')}
					{@const plantsData = getParamStatus(gaiaState.ecosystemsManagement, uid, 'plants_data')}
					{@const pictures = getParamStatus(gaiaState.ecosystemsManagement, uid, 'pictures')}
					{@const nycthemeralCycle = gaiaState.ecosystemsNycthemeralCycle[uid]}
					{@const actuatorsState = gaiaState.ecosystemsActuatorsState[uid]}
					{@const ecosystemSensorsSkeleton = gaiaState.ecosystemsSensorsSkeleton[getKey(uid, 'ecosystem')]}
					{@const environmentSensorsSkeleton = gaiaState.ecosystemsSensorsSkeleton[getKey(uid, 'environment')]}
					{@const plantsSensorsSkeleton = gaiaState.ecosystemsSensorsSkeleton[getKey(uid, 'plants')]}
					{#if nycthemeralCycle}
						<BoxItem title="Nycthemeral cycle" href="/ecosystem/{slugify(ecosystem['name'])}/settings">
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
							{#if light}
								<p style="font-size: 1rem; font-weight: bold; padding: 2px 0; margin-top: 0.6rem">
									Lighting
								</p>
								<p>Method: {nycthemeralCycle['lighting']}</p>
								{#each computeLightingHours(nycthemeralCycle, 'short') as lightingHours, index (`${uid}-${index}`)}
									<p>{lightingHours}</p>
								{:else}
									<p>No lighting needed</p>
								{/each}
							{/if}
						</BoxItem>
					{/if}
					{#if actuator && actuatorsState}
						<BoxItem title="Actuators" href="/ecosystem/{slugify(ecosystem['name'])}/actuators">
							{#each actuatorTypes as actuatorType (`${uid}-${actuatorType}`)}
								{@const actuator = actuatorsState[actuatorType]}
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
					{#if ecosystemData && ecosystemSensorsSkeleton}
						<BoxItem title="Ecosystem health" href="/ecosystem/{slugify(ecosystem['name'])}/sensors/ecosystem">
							{#each ecosystemSensorsSkeleton as sensorsBone (`${uid}-ecosystem-${sensorsBone['measure']}`)}
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
						</BoxItem>
					{/if}
					{#if environmentData && environmentSensorsSkeleton && sensorsPrimed}
						<BoxItem title="Environment" href="/ecosystem/{slugify(ecosystem['name'])}/sensors/environment">
							{#each environmentSensorsSkeleton as sensorsBone (`${uid}-environment-${sensorsBone['measure']}`)}
								{#await fetchSensorsCurrentDataForMeasure(uid, sensorsBone.measure, sensorsBone.sensors)}
									<p>Collecting sensors data for {sensorsBone.measure} measure</p>
								{:then _}
									{@const averageData = computeAverageSensorsCurrentDataForMeasure(
										gaiaState.ecosystemsSensorsDataCurrent,
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
						</BoxItem>
					{/if}
					{#if plantsData && plantsSensorsSkeleton && sensorsPrimed}
						<BoxItem title="Plants" href="/ecosystem/{slugify(ecosystem['name'])}/sensors/plants">
							{#each plantsSensorsSkeleton as sensorsBone (`${uid}-ecosystem-${sensorsBone['measure']}`)}
								{#await fetchSensorsCurrentDataForMeasure(uid, sensorsBone.measure, sensorsBone.sensors)}
									<p>Collecting sensors data for {sensorsBone.measure} measure</p>
								{:then _}
									{@const averageData = computeAverageSensorsCurrentDataForMeasure(
										gaiaState.ecosystemsSensorsDataCurrent,
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
						</BoxItem>
					{/if}
					{#if pictures}
						<BoxItem title="Camera" href="/ecosystem/{slugify(ecosystem['name'])}/camera">
							{#await fetchCameraPicturesInfo(uid)}
								<p>Loading camera information</p>
							{:then camerasInfo}
								{#each Object.values(camerasInfo) as cameraInfo (`${uid}-${cameraInfo["camera_name"]}`)}
									<p>
										{cameraInfo["camera_name"]}
										<Fa icon={faCircle} style="color: var({recentPicture(cameraInfo['timestamp'], now)});" />
									</p>
								{/each}
							{/await}
						</BoxItem>
					{/if}
				{:else if connected}
					<BoxItem>
						<p>The ecosystem '{ecosystem['name']}' is not currently running</p>
							{#if appState.currentUser.can(permissions.OPERATE)}
								<p>
									<a href="/ecosystem/{slugify(ecosystem['name'])}/settings">
										Click here to configure {ecosystem['name']}
									</a>
								</p>
							{/if}
					</BoxItem>
				{:else if running}
					<BoxItem>
						<p>The ecosystem {ecosystem['name']} is not currently connected</p>
						<p>
							Last connection to the server on
							{formatDateTime(ecosystemState['last_seen'])}
						</p>
					</BoxItem>
				{:else}
					<BoxItem>
						<p>The ecosystem '{ecosystem['name']}' is not currently running and is not connected</p>
						<p>
							Last connection to the server on
							{formatDateTime(ecosystemState['last_seen'])}
						</p>
					</BoxItem>
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
