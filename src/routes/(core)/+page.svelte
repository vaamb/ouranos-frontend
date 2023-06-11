<script>
	import { onMount } from 'svelte';

	import Fa from 'svelte-fa';
	import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';

	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Row from '$lib/components/layout/Row.svelte';
	import Box from '$lib/components/layout/Box.svelte';
	import BoxItem from '$lib/components/layout/BoxItem.svelte';

	import {
		currentUser,
		ecosystems,
		ecosystemsIds,
		ecosystemsManagement,
		serverCurrentData,
		ecosystemsSensorsSkeleton,
		serverLastSeen,
		serverLatency,
		services,
		warnings,
		weatherCurrently
	} from '$lib/store.js';
	import { permissions } from '$lib/utils/consts.js';
	import {
		computeEcosystemStatusClass,
		computeLightingHours,
		computeLightStatusClass,
		formatSensorsSkeleton,
		computeUptime,
		isEmpty,
		formatDate,
		formatDateTime,
		getWeatherIcon,
		serviceEnabled,
		getParamStatus,
		capitalize
	} from '$lib/utils/functions.js';
	import {
		fetchSensorCurrentData,
		fetchEcosystemsSensorsSkeleton,
		fetchEcosystemLighting,
		fetchWeatherForecast
	} from '$lib/actions.js';

	export let data;
	const { serverCurrentDataValues, serverStartTimeValue } = data;
	serverCurrentData.set(serverCurrentDataValues);
	const serverStartTime = new Date(serverStartTimeValue);
	let now = new Date();

	const filledBox = {};
	$: weatherEnabled = serviceEnabled($services, 'weather');
	$: calendarEnabled = serviceEnabled($services, 'calendar');
	$: uptime = computeUptime($serverLastSeen, serverStartTime);

	const fetchAndComputeCurrentSensorsAverages = async function (FormattedSensorsSkeleton) {
		if (isEmpty(FormattedSensorsSkeleton)) {
			return [];
		}
		const average = (array) => array.reduce((a, b) => a + b) / array.length;
		const rv = [];
		for (const measureInfo of FormattedSensorsSkeleton) {
			const sensors = measureInfo['sensors'];
			if (isEmpty(sensors)) {
				continue;
			}
			let values = [];
			for (const sensorInfo of sensors) {
				const data = await fetchSensorCurrentData(sensorInfo['uid'], measureInfo['measure']);
				values.push(data['value']);
			}
			if (isEmpty(values)) {
				continue;
			}
			rv.push({
				measure: measureInfo['measure'],
				unit: measureInfo['unit'],
				average: average(values).toFixed(1)
			});
		}
		return rv;
	};

	const formatCurrentSensorsAverages = function (averagedCurrentSensorsData) {
		if (isEmpty(averagedCurrentSensorsData)) {
			return '<p>No sensor data available</p>';
		}
		let rv = '';
		for (const measureRecord of averagedCurrentSensorsData) {
			rv += `<p>${
				capitalize(measureRecord['measure']).replace('_', ' ') +
				': ' +
				measureRecord['average'] +
				measureRecord['unit']
			}</p>`;
		}
		return rv;
	};

	onMount(async () => {
		const { weatherCurrentlyValues } = await fetchWeatherForecast('hourly,daily');
		await fetchEcosystemsSensorsSkeleton(); // TODO: move to server ? But make sure not run too often
		weatherCurrently.set(weatherCurrentlyValues);
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
			<i class="{getWeatherIcon($weatherCurrently.icon)} weather-icon" />
			<BoxItem title={$weatherCurrently.summary}>
				<p>Temperature: {$weatherCurrently.temperature.toFixed(1)} °C</p>
				<p>Wind: {$weatherCurrently.windSpeed.toFixed(1)} km/h</p>
				<p>Precipitation:{($weatherCurrently.precipProbability * 100).toFixed(1)} %</p>
				<p>Humidity: {($weatherCurrently.humidity * 100).toFixed(1)} %</p>
				<p>Cloud cover:{($weatherCurrently.cloudCover * 100).toFixed(1)} %</p>
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
		<Box title="Warnings overview" align="center">
			<BoxItem>
				{#each $warnings as warning}
					{warning.content}
				{:else}
					No warning
				{/each}
			</BoxItem>
		</Box>
	{/if}
</Row>

{#if $ecosystemsIds.length > 0}
	<h2>Ecosystems overview</h2>
	{#each $ecosystemsIds as { uid, name }}
		<Box
			title={name}
			align="center"
			status={computeEcosystemStatusClass($ecosystems[uid])}
			direction="row"
		>
			<template>{(filledBox[uid] = false)}</template>

			{#if getParamStatus($ecosystems, uid, 'connected') && getParamStatus($ecosystemsManagement, uid, 'light')}
				<template>{(filledBox[uid] = true)}</template>
				<BoxItem title="Light">
					{#await fetchEcosystemLighting(uid)}
						<p>Fetching data</p>
					{:then ecosystemLight}
						<p>
							Status:
							<Fa
								icon={faSyncAlt}
								class={computeLightStatusClass(ecosystemLight)}
								spin={ecosystemLight['mode'] === 'automatic'}
							/>
						</p>
						<p>{computeLightingHours(ecosystemLight)}</p>
					{/await}
				</BoxItem>
			{/if}
			{#if getParamStatus($ecosystems, uid, 'connected') && getParamStatus($ecosystemsManagement, uid, 'environment_data')}
				<template>{(filledBox[uid] = true)}</template>
				<BoxItem title="Environment">
					{#await formatSensorsSkeleton($ecosystemsSensorsSkeleton, uid, 'environment')}
						<p>Collecting environment's data from the ecosystem</p>
					{:then skeleton}
						{#await fetchAndComputeCurrentSensorsAverages(skeleton)}
							<p>Collecting environment's data from the ecosystem</p>
						{:then avg}
							{@html formatCurrentSensorsAverages(avg)}
						{/await}
					{/await}
				</BoxItem>
			{/if}
			{#if getParamStatus($ecosystems, uid, 'connected') && getParamStatus($ecosystemsManagement, uid, 'plants_data')}
				<template>{(filledBox[uid] = true)}</template>
				<BoxItem title="Plants">
					{#await formatSensorsSkeleton($ecosystemsSensorsSkeleton, uid, 'plants')}
						<p>Collecting environment's data from the ecosystem</p>
					{:then skeleton}
						{#await fetchAndComputeCurrentSensorsAverages(skeleton)}
							<p>Collecting environment's data from the ecosystem</p>
						{:then avg}
							{@html formatCurrentSensorsAverages(avg)}
						{/await}
					{/await}
				</BoxItem>
			{/if}
			{#if getParamStatus($ecosystems, uid, 'connected') && !$ecosystems[uid]['status']}
				<template>{(filledBox[uid] = true)}</template>
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
			{/if}
			{#if $ecosystems[uid] && !$ecosystems[uid]['connected']}
				<template>{(filledBox[uid] = true)}</template>
				<BoxItem>
					<p>The ecosystem {name} is not currently connected</p>
					<p>
						Last connection to the server on
						{formatDateTime(new Date($ecosystems[uid]['last_seen']))}
					</p>
				</BoxItem>
			{/if}
			{#if $ecosystems[uid] && !filledBox[uid]}
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
		</Box>
	{/each}
{/if}

<style>
	.weather-icon {
		height: 115px;
		line-height: 115px;
		font-size: 70px;
		background: inherit;
		margin-bottom: -1px;
	}
</style>
