<script>
	import { onMount } from 'svelte';

	import Box from '$lib/components/layout/Box.svelte';
	import BoxItem from '$lib/components/layout/BoxItem.svelte';
	import Graph from '$lib/components/Graph.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import WeatherIcon from '$lib/components/WeatherIcon.svelte';

	import { fetchWeatherForecast } from '$lib/actions.js';
	import { services, weatherCurrently, weatherDaily, weatherHourly } from '$lib/store.js';
	import {
		capitalize,
		formatDate,
		formatDateTime,
		isEmpty,
		serviceEnabled
	} from '$lib/utils/functions.js';
	import { colors } from '$lib/utils/styling.js';

	// Last update
	const lastUpdate = function (timestamp) {
		if (!timestamp) return '';
		return 'Last update: ' + formatDateTime(new Date(timestamp));
	};

	// Hourly forecast switch
	const measures = ['temperature', 'humidity', 'precipitation_probability'];
	let currentMeasure = measures[0];

	const setcurrentMeasure = function (newMeasure) {
		return function () {
			currentMeasure = newMeasure;
		};
	};

	const getHourlyDataset = function (weatherHourly, measure) {
		return {
			label: capitalize(measure.replace('_', ' ')),
			data: weatherHourly.slice(0, 23).map((elem) => elem[measure]),
			borderColor: {
				temperature: colors.red,
				humidity: colors.blue,
				precipitation_probability: colors.blue
			}[measure],
			borderWidth: 1
		};
	};

	const getSuggestedMin = function (measure) {
		return {
			temperature: 0,
			humidity: 0,
			precipitation_probability: 0
		}[measure];
	};

	const getSuggestedMax = function (measure) {
		return {
			temperature: 10,
			humidity: 100,
			precipitation_probability: 100
		}[measure];
	};

	onMount(async () => {
		if (serviceEnabled($services, 'weather')) {
			await fetchWeatherForecast();
		}
	});
</script>

<HeaderLine title="Weather" info={lastUpdate($weatherCurrently['timestamp'])} />

<Box title="Day forecast" direction="row" align="center">
	<BoxItem maxWidth="250px">
		{#if !isEmpty($weatherCurrently)}
			<WeatherIcon icon={$weatherCurrently['icon']} />
			<h1>{capitalize($weatherCurrently['summary'])}</h1>
			<p>Temperature: {$weatherCurrently['temperature'].toFixed(1)} °C</p>
			<p>Humidity: {$weatherCurrently['humidity'].toFixed(1)} %</p>
			<!--<p>Precipitation: {$weatherCurrently['precipitation_probability'].toFixed(1)} %</p>-->
			<p>Wind: {$weatherCurrently['wind_speed'].toFixed(1)} km/h</p>
			<p>Cloud cover: {$weatherCurrently['cloud_cover'].toFixed(1)} %</p>
		{:else}
			<p>Loading current weather data ...</p>
		{/if}
	</BoxItem>
	<BoxItem>
		{#if !isEmpty($weatherHourly)}
			<div style="display: flex; margin-bottom: 12px">
				{#each measures as measure}
					<button
						on:click={setcurrentMeasure(measure)}
						class="text-button"
						style={measure !== currentMeasure
							? 'background-color: var(--derived-60)'
							: 'background-color: var(--main-40)'}
					>
						{capitalize(measure).replace('_', ' ')}
					</button>
				{/each}
			</div>
			<Graph
				height="200px"
				datasets={[getHourlyDataset($weatherHourly, currentMeasure)]}
				labels={$weatherHourly.slice(0, 23).map((elem) => new Date(elem['timestamp']))}
				suggestedMin={getSuggestedMin(currentMeasure)}
				suggestedMax={getSuggestedMax(currentMeasure)}
			/>
		{/if}
	</BoxItem>
</Box>

<Box title="Week forecast" direction="row" align="center">
	{#each $weatherDaily as weather, index}
		{#if index > 0 && index < 7}
			<BoxItem title={formatDate(new Date(weather['timestamp']))} minWidth="175px">
				<WeatherIcon icon={weather['icon']} size="45px" height="75px" />
				<h1>{capitalize(weather['summary'])}</h1>
				<p>Temperature: {weather['temperature'].toFixed(1)} °C</p>
				<p>Humidity: {weather['humidity']} %</p>
				<p>Precipitation: {weather['precipitation_probability']} %</p>
				<p>Wind: {weather['wind_speed'].toFixed(1)} km/h</p>
				<p>Cloud cover: {weather['cloud_cover']} %</p>
			</BoxItem>
		{/if}
	{/each}
</Box>

<style>
	h1 {
		font-size: 1rem;
		font-weight: bold;
	}

	p {
		margin-bottom: 0;
	}
</style>
