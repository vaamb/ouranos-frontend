<script>
	import { onMount } from 'svelte';

	import { Chart } from 'chart.js/auto';
	import 'chartjs-adapter-date-fns';

	export let labels;
	export let datasets;
	export let suggestedMin = 0;
	export let suggestedMax = 10;
	export let height = 250;

	let canvas;
	let chart;

	const chartLayout = {
		scales: {
			x: {
				type: 'time',
				time: {
					unit: 'day'
				}
			},
			y: {
				display: true,
				suggestedMin: suggestedMin,
				suggestedMax: suggestedMax
			}
		},
		plugins: {
			legend: {
				display: false
			}
		},
		pointRadius: 0,
		pointHitRadius: 5,
		maintainAspectRatio: false,
		responsive: true
	};

	$: {
		if (chart) {
			chart.data.labels = labels;
			chart.data.datasets = datasets;
			chart.update();
		}
	}

	onMount(async () => {
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
</script>

<div class="container" style="height:{height}">
	<canvas bind:this={canvas} width="clientWidth" height="clientHeight" />
</div>
