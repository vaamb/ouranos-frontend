<script>
	import { onMount } from 'svelte';

	import { Gauge } from 'gaugeJS';

	let {
		defaultMin = 0,
		value = 50,
		minValue = defaultMin,
		defaultMax = 100,
		maxValue = defaultMax,
		unit = ''
	} = $props();

	let canvas = $state();
	let gauge = $state();

	const gaugeOpts = {
		lines: 12,
		angle: -0.11, // The span of the gauge arc
		lineWidth: 0.25, // The line thickness
		radiusScale: 0.7, // Relative radius
		pointer: {
			length: 0.6, // Relative to gauge radius
			strokeWidth: 0.035, // The thickness
			color: '#000000' // Fill color
		},
		limitMax: false, // If false, max value increases automatically if value > maxValue
		limitMin: false, // If true, the min value of the gauge will be fixed
		colorStart: '#6FADCF', // Colors
		colorStop: '#8FC0DA', // just experiment with them
		strokeColor: '#E0E0E0', // to see which ones work best for you
		generateGradient: true,
		highDpiSupport: true // High resolution support
	};

	$effect(() => {
		if (gauge) {
			gauge.set(value);
		}
	});

	onMount(async () => {
		gauge = new Gauge(canvas);
		gauge.setOptions(gaugeOpts); // create sexy gauge!
		gauge.minValue = minValue || defaultMin; // set min value
		gauge.maxValue = maxValue || defaultMax; // set max gauge value
		gauge.set(value);
	});
</script>

<div class="container">
	<canvas bind:this={canvas}></canvas>

	<span class="value">{value} {unit}</span>
</div>

<style>
	canvas {
		width: 100%;
		height: 100%;
		margin: auto;
		max-width: 300px;
	}

	.container {
		display: flex;
		flex-direction: column;
	}

	.value {
		font-size: 1.2rem;
	}
</style>
