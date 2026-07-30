<script>
	// One reading, one tile.
	//
	// It is the `DataSheet` row turned into a card: kicker label, tabular value,
	// one quiet line underneath.
	//
	// `sensor` is only worth passing when a measure has more than one sensor; a
	// single-sensor measure reads better as just its own name.
	//
	// `precision` overrides the rounding for measures the default rule is wrong
	// about: a vegetation index lives in [-1, 1], so one decimal rounds most of
	// it away.
	let {
		label,
		sensor = null,
		value = null,
		unit = '',
		delta = null,
		deltaWindow = '24 h',
		note = null,
		precision = null
	} = $props();

	// Degrees and percentages sit tight against the figure the way they are
	// written; anything wordier (lux, ppm, g.m-3) gets a space.
	let tightUnit = $derived(['°C', '%', '°'].includes(unit.trim()));

	// One decimal is the useful resolution for a climate reading, but a value in
	// the hundreds or thousands (lux, ppm) only gets noisier for it.
	const format = function (number) {
		if (precision !== null) {
			return number.toFixed(precision);
		}
		return Math.abs(number) >= 100 ? number.toFixed(0) : number.toFixed(1);
	};

	// The sign carries the direction, so the line survives without colour. A
	// rising temperature is neither good nor bad.
	let deltaText = $derived.by(() => {
		if (delta === null || delta === undefined) {
			return null;
		}
		const rounded = format(Math.abs(delta));
		if (Number(rounded) === 0) {
			return `steady over ${deltaWindow}`;
		}
		const sign = delta > 0 ? '+' : '−';
		return `${sign}${rounded}${tightUnit ? '' : ' '}${unit.trim()} in ${deltaWindow}`;
	});
</script>

<div class="tile">
	<div class="tk">
		{label}
		{#if sensor}
			<span class="sub">{sensor}</span>
		{/if}
	</div>
	<div class="tv">
		{#if value === null || value === undefined}
			<span class="empty">—</span>
		{:else}
			{format(value)}{#if unit}<u class:tight={tightUnit}>{unit.trim()}</u>{/if}
		{/if}
	</div>
	<div class="td">
		{#if deltaText}
			{deltaText}
		{:else if note}
			{note}
		{:else}
			<span class="empty">—</span>
		{/if}
	</div>
</div>

<style>
	.tile {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 11px 13px 10px;
	}

	/* The app-wide kicker. */
	.tk {
		font-size: 0.64rem;
		font-weight: 700;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: var(--text-dim-solid);
	}

	.tk .sub {
		display: block;
		margin-top: 2px;
		letter-spacing: 0.04em;
		text-transform: none;
		font-weight: 600;
		color: var(--text-faint);
	}

	.tv {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1.1;
		margin-top: 4px;
		color: var(--text);
	}

	.tv u {
		text-decoration: none;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-dim-solid);
		margin-left: 0.22em;
	}

	.tv u.tight {
		margin-left: 0.08em;
	}

	.td {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.72rem;
		color: var(--text-dim-solid);
		margin-top: 3px;
	}

	.empty {
		color: var(--text-faint);
	}

	@media (max-width: 560px) {
		.tv {
			font-size: 1.3rem;
		}
	}
</style>
