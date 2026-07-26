<script>
	/**
	 * Two-tone line weather icons. The warm element (sun / moon / lightning) is
	 * drawn in `currentColor` (driven by the `color` prop, amber by default); the
	 * cloud / rain / fog parts are muted (`--text-dim-solid`).
	 *
	 * @typedef {Object} Props
	 * @property {string} icon - OpenWeatherMap icon code, e.g. "01d", "10n"
	 * @property {string} [height]
	 * @property {string} [size]
	 * @property {string} [background]
	 * @property {string} [color] - the warm element's colour (currentColor)
	 */

	/** @type {Props} */
	let {
		icon,
		height = '115px',
		size = '70px',
		background = 'var(--main-95)',
		color = 'var(--amber)'
	} = $props();

	// Map an OWM code to one of the snippets below. Day/night is the trailing
	// letter; the leading two digits are the condition.
	const iconFor = function (code) {
		const day = code?.endsWith('d');
		switch (code?.slice(0, 2)) {
			case '01':
				return day ? sun : moon;
			case '02':
			case '03':
				return day ? cloudSun : cloudMoon;
			case '04':
				return cloud;
			case '09':
				return cloudRain;
			case '10':
				return day ? cloudSunRain : cloudMoonRain;
			case '11':
				return cloudBolt;
			case '13':
				return cloudSnow;
			case '50':
				return cloudFog;
			default:
				return cloud;
		}
	};
</script>

{#snippet sun()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
		<circle cx="12" cy="12" r="4" />
		<path
			d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
		/>
	</svg>
{/snippet}

{#snippet moon()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
		<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
	</svg>
{/snippet}

{#snippet cloud()}
	<svg viewBox="0 0 24 24" fill="none" stroke="var(--text-dim-solid)">
		<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
	</svg>
{/snippet}

{#snippet cloudSun()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
		<path
			d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.947 12.65a4 4 0 0 0-5.925-4.128"
		/>
		<path stroke="var(--text-dim-solid)" d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
	</svg>
{/snippet}

{#snippet cloudMoon()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
		<path d="M10.1 9A6 6 0 0 1 16 4a4.24 4.24 0 0 0 6 6 6 6 0 0 1-3 5.197" />
		<path stroke="var(--text-dim-solid)" d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
	</svg>
{/snippet}

{#snippet cloudRain()}
	<svg viewBox="0 0 24 24" fill="none" stroke="var(--text-dim-solid)">
		<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
		<path d="M16 14v6M8 14v6M12 16v6" />
	</svg>
{/snippet}

{#snippet cloudSunRain()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
		<path
			d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.947 12.65a4 4 0 0 0-5.925-4.128"
		/>
		<path stroke="var(--text-dim-solid)" d="M3 20a5 5 0 1 1 8.9-4H13a3 3 0 0 1 2 5.24" />
		<path stroke="var(--text-dim-solid)" d="M11 20v2M7 19v2" />
	</svg>
{/snippet}

{#snippet cloudMoonRain()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
		<path d="M10.188 8.5A6 6 0 0 1 16 4a4.24 4.24 0 0 0 6 6 6 6 0 0 1-3 5.197" />
		<path stroke="var(--text-dim-solid)" d="M3 20a5 5 0 1 1 8.9-4H13a3 3 0 0 1 2 5.24" />
		<path stroke="var(--text-dim-solid)" d="M11 20v2M7 19v2" />
	</svg>
{/snippet}

{#snippet cloudBolt()}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
		<path stroke="var(--text-dim-solid)" d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
		<path d="M13 12l-3 5h4l-3 5" />
	</svg>
{/snippet}

{#snippet cloudSnow()}
	<svg viewBox="0 0 24 24" fill="none" stroke="var(--text-dim-solid)">
		<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
		<path d="M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01" />
	</svg>
{/snippet}

{#snippet cloudFog()}
	<svg viewBox="0 0 24 24" fill="none" stroke="var(--text-dim-solid)">
		<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
		<path d="M16 17H7M17 21H9" />
	</svg>
{/snippet}

<div
	class="weather-icon"
	style="--icon-height: {height}; --icon-size: {size}; --icon-bg: {background}; --icon-color: {color}"
>
	{@render iconFor(icon)()}
</div>

<style>
	.weather-icon {
		height: var(--icon-height);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--icon-color);
		background: var(--icon-bg);
	}

	.weather-icon svg {
		width: var(--icon-size);
		height: var(--icon-size);
		display: block;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
