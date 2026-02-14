<script>
	import { onDestroy, onMount } from 'svelte';

	import { Chart } from 'chart.js/auto';
	import 'chartjs-adapter-date-fns';

	let {
		labels,
		datasets,
		defaultMin = 0,
		suggestedMin = defaultMin,
		defaultMax = 100,
		suggestedMax = defaultMax,
		height = "250px",
		legend = null,
		xScale = null,
		yScale = null
	} = $props();

	let canvas = $state();
	let chart = $state();

	// Chart layout is fixed once the chart is created. It won't be updated if the props change.
	const chartLayout = {
		scales: {
			x: xScale || {
				type: 'time',
				time: {
					unit: 'day'
				}
			},
			y: yScale || {
				display: true,
				suggestedMin: suggestedMin ?? defaultMin,
				suggestedMax: suggestedMax ?? defaultMax
			}
		},
		plugins: {
			legend: legend || {
				display: false
			}
		},
		pointRadius: 0,
		pointHitRadius: 5,
		maintainAspectRatio: false,
		responsive: true
	};

	$effect(() => {
		if (chart) {
			chart.data.labels = labels;
			chart.data.datasets = datasets;
			chart.update();
		}
	});

	onMount(() => {
		const ctx = canvas.getContext('2d');
		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: labels,
				datasets: datasets
			},
			options: chartLayout
		});
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});
</script>

<div class="container" style="--height:{height}">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.container {
		height: var(--height);
	}
</style>
