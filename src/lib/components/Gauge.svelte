<script>
  import { onMount } from "svelte";

  import { Gauge } from "gaugeJS";

  import { gaugeOpts } from "$lib/utils/styling.js";

  export let minValue = 0;
  export let value = 50;
  export let maxValue = 100;
  export let unit = "";

  let canvas;
  let gauge

  $: {
    if (gauge) {
      gauge.set(value)
    }
  }

  onMount(async () => {
    gauge = new Gauge(canvas)
    gauge.setOptions(gaugeOpts); // create sexy gauge!
    gauge.maxValue = maxValue; // set max gauge value
    gauge.minValue = minValue;  // set min value
    gauge.set(value);
  })


</script>

<div class="container">
  <div>
    <canvas bind:this={canvas} width="clientWidth" height="clientHeight"></canvas>
  </div>

  <span class="value">{value} {unit}</span>
</div>

<style>
  canvas {
    width: 100%;
    height: 100%;
    margin-top: -15px;
  }

  .container {
    display: flex;
    flex-direction: column;
  }

  .value {
    font-size: 1.4rem;
  }
</style>