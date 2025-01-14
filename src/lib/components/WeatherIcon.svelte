<script>
	import Fa from 'svelte-fa';
	import {
		faCloudBolt,
		faCloudMoon,
		faCloudMoonRain,
		faCloudSun,
		faCloudSunRain,
		faMoon,
		faSmog,
		faSnowflake,
		faSun
	} from '@fortawesome/free-solid-svg-icons';

	/**
	 * @typedef {Object} Props
	 * @property {any} icon
	 * @property {string} [height]
	 * @property {string} [size]
	 */

	/** @type {Props} */
	let { icon, height = '115px', size = '70px' } = $props();

	const weatherIconTranslation = {
		'01d': faSun,
		'01n': faMoon,
		'02d': faCloudSun,
		'02n': faCloudMoon,
		'03d': faCloudSun,
		'03n': faCloudMoon,
		'04d': faCloudSun,
		'04n': faCloudMoon,
		'09d': faCloudSunRain,
		'09n': faCloudMoonRain,
		'10d': faCloudSunRain,
		'10n': faCloudMoonRain,
		'11d': faCloudBolt,
		'11n': faCloudBolt,
		'13d': faSnowflake,
		'13n': faSnowflake,
		'50d': faSmog,
		'50n': faSmog
	};

	export const getWeatherIcon = function (weather) {
		return weatherIconTranslation[weather];
	};
</script>

<div class="weather-icon" style="--icon-height: {height}; --icon-size: {size}">
	<Fa icon={getWeatherIcon(icon)} />
</div>

<style>
	.weather-icon {
		height: var(--icon-height);
		line-height: var(--icon-height);
		font-size: var(--icon-size);
		background: var(--main-95);
		margin-bottom: -1px;
	}
</style>
