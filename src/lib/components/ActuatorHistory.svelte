<script>
	// An actuator's week, drawn as a lane rather than a chart.
	let {
		records = [],
		status = false,
		mode = 'automatic',
		nycthemeralCycle = {},
		now = Date.now(),
		days = 7
	} = $props();

	const DAY = 24 * 60 * 60 * 1000;

	const startOfDay = function (time) {
		const date = new Date(time);
		date.setHours(0, 0, 0, 0);
		return date.getTime();
	};

	// Whole days: a trailing window would open on a sliver of a day, and the day
	// strip below the lane would have a column too narrow to label.
	let end = $derived(now instanceof Date ? now.getTime() : now);
	let start = $derived(startOfDay(end) - (days - 1) * DAY);
	let span = $derived(end - start);

	const percent = function (time) {
		return ((time - start) / span) * 100;
	};

	let events = $derived(
		records
			.map((record) => ({
				time: new Date(record[0]).getTime(),
				status: record[3],
				mode: record[2]
			}))
			.filter((event) => !isNaN(event.time))
			.sort((first, second) => first.time - second.time)
	);

	// Before the first record we only know what the first record says, so the
	// state is extended backwards — the same assumption the graphs make.
	const stateAt = function (time) {
		let current = events.length
			? { status: events[0].status, mode: events[0].mode }
			: { status: status, mode: mode };
		for (const event of events) {
			if (event.time > time) {
				break;
			}
			current = { status: event.status, mode: event.mode };
		}
		return current;
	};

	// Flatten the events into segments of one field over the window.
	const segments = function (field) {
		const flattened = [];
		let current = stateAt(start);
		let segmentStart = start;
		for (const event of events) {
			if (event.time <= start) {
				continue;
			}
			if (event.time > end) {
				break;
			}
			if (event[field] !== current[field]) {
				flattened.push({ start: segmentStart, end: event.time, value: current[field] });
				segmentStart = event.time;
			}
			current = { status: event.status, mode: event.mode };
		}
		flattened.push({ start: segmentStart, end: end, value: current[field] });
		return flattened;
	};

	let runs = $derived(segments('status').filter((segment) => segment.value));
	let modeSegments = $derived(segments('mode'));

	let onTime = $derived(runs.reduce((total, run) => total + (run.end - run.start), 0));

	const toSeconds = function (strHour) {
		if (!strHour) {
			return null;
		}
		const [hours, minutes, seconds] = strHour.split(':');
		return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds || 0);
	};

	// The greenhouse's dark period, from the nycthemeral cycle: it is what makes
	// "the heater only fires at night" readable straight off the lane.
	let nightSpans = $derived.by(() => {
		const dayStart = toSeconds(nycthemeralCycle['day']);
		const nightStart = toSeconds(nycthemeralCycle['night']);
		if (dayStart === null || nightStart === null) {
			return [];
		}
		const spans = [];
		for (let day = startOfDay(start) - DAY; day <= end + DAY; day += DAY) {
			const from = Math.max(day + nightStart * 1000, start);
			const to = Math.min(day + DAY + dayStart * 1000, end);
			if (to > from) {
				spans.push({ left: percent(from), width: percent(to) - percent(from) });
			}
		}
		return spans;
	});

	// One column per calendar day, aligned to the lane, holding that day's on-time.
	let daySlots = $derived.by(() => {
		const slots = [];
		for (let day = startOfDay(start); day < end; day += DAY) {
			const from = Math.max(day, start);
			const to = Math.min(day + DAY, end);
			const dayOnTime = runs.reduce((total, run) => {
				return total + Math.max(0, Math.min(run.end, to) - Math.max(run.start, from));
			}, 0);
			slots.push({
				day: day,
				left: percent(from),
				width: percent(to) - percent(from),
				today: day === startOfDay(end),
				onTime: dayOnTime
			});
		}
		return slots;
	});

	let lastChange = $derived.by(() => {
		let last = null;
		for (const event of events) {
			if (event.time <= end) {
				last = event;
			}
		}
		return last;
	});

	const formatDuration = function (milliseconds) {
		const minutes = Math.round(milliseconds / 60000);
		if (minutes < 60) {
			return `${minutes}m`;
		}
		return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`;
	};

	const formatTime = function (time) {
		return new Date(time).toLocaleTimeString([], { timeStyle: 'short', hour12: false });
	};

	const formatDay = function (time) {
		return new Date(time).toLocaleDateString([], { weekday: 'short', day: 'numeric' });
	};

	const runLabel = function (run) {
		const until = run.end >= end ? 'now' : formatTime(run.end);
		return `${formatTime(run.start)} → ${until} · ${formatDuration(run.end - run.start)}`;
	};

	// Hover readout. Mouse only on purpose: the numbers everyone needs are in the
	// day strip below, so the bars do not become a keyboard trap of 150 stops.
	let hovered = $state(null);
</script>

<figure class="history" style="--tone: var({status ? '--good-green' : '--text-dim-solid'})">
	<figcaption>
		{#if events.length}
			on <b>{formatDuration(onTime)}</b> · <b>{Math.round((onTime / span) * 100)}%</b> of the week ·
			<b>{runs.length}</b>
			{runs.length === 1 ? 'run' : 'runs'}
		{:else}
			no record over the last {days} days
		{/if}
	</figcaption>

	<div class="lane-wrapper">
		<div class="lane">
			{#each nightSpans as night, index (index)}
				<span class="night" style="left: {night.left}%; width: {night.width}%"></span>
			{/each}
			{#each daySlots as slot (slot.day)}
				{#if slot.left > 0}
					<span class="day-mark" style="left: {slot.left}%"></span>
				{/if}
			{/each}
			{#each runs as run (run.start)}
				<span
					class="run"
					class:live={run.end >= end}
					style="left: {percent(run.start)}%; width: {Math.max(0.12, percent(run.end) - percent(run.start))}%"
					role="img"
					aria-label="On {runLabel(run)}"
					onmouseenter={() => (hovered = run)}
					onmouseleave={() => (hovered = null)}
				></span>
			{/each}
			<span class="now"></span>
		</div>
		{#if hovered}
			<span class="tip" style="left: {(percent(hovered.start) + percent(hovered.end)) / 2}%">
				{runLabel(hovered)}
			</span>
		{/if}
	</div>

	<div class="ribbon">
		{#each modeSegments as segment (segment.start)}
			<span
				class="mode"
				class:manual={segment.value !== 'automatic'}
				style="left: {percent(segment.start)}%; width: {percent(segment.end) - percent(segment.start)}%"
			></span>
		{/each}
	</div>

	<div class="days">
		{#each daySlots as slot (slot.day)}
			<div class="slot" style="left: {slot.left}%; width: {slot.width}%">
				<span class="label">{slot.today ? 'Today' : formatDay(slot.day)}</span>
				<span class="value" class:none={!slot.onTime}>
					{slot.onTime ? formatDuration(slot.onTime) : '—'}
				</span>
			</div>
		{/each}
	</div>

	{#if lastChange}
		<p class="since">
			{status ? 'On' : 'Off'}{mode === 'automatic' ? '' : ' by hand'} since
			<b>{formatTime(lastChange.time)}</b> · {formatDuration(end - lastChange.time)} ago
		</p>
	{:else}
		<p class="since">Never switched over this period.</p>
	{/if}
</figure>

<style>
	.history {
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 14px 16px;
	}

	figcaption {
		align-self: flex-end;
		margin-bottom: 7px;
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.78rem;
		color: var(--text-dim-solid);
	}

	figcaption b {
		color: var(--text);
		font-weight: 600;
	}

	.lane-wrapper {
		position: relative;
	}

	.lane {
		position: relative;
		height: 46px;
		border: 1px solid var(--border);
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}

	.night {
		position: absolute;
		top: 0;
		bottom: 0;
		background: var(--night-shade);
	}

	.day-mark {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--border);
	}

	/* The record is ink: a week of accent-coloured bars would be a wall of
	   colour. Only the run in progress wears the state colour, which is what
	   ties the lane back to the dial on the left. */
	.run {
		position: absolute;
		top: 0;
		bottom: 0;
		min-width: 1.5px;
		background: color-mix(in srgb, var(--text-dim-solid) 72%, transparent);
	}

	.run.live {
		background: var(--tone);
	}

	.run:hover {
		outline: 1px solid var(--text);
		outline-offset: -1px;
	}

	.now {
		position: absolute;
		top: 0;
		bottom: 0;
		left: calc(100% - 1px);
		width: 1px;
		background: var(--text);
	}

	.tip {
		position: absolute;
		bottom: calc(100% + 6px);
		transform: translateX(-50%);
		padding: 5px 8px;
		border-radius: var(--radius);
		background: var(--text);
		color: var(--bg);
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.72rem;
		font-weight: 600;
		white-space: nowrap;
		pointer-events: none;
		z-index: 2;
	}

	/* Mode never shares a channel with on/off, so it gets its own hairline. */
	.ribbon {
		position: relative;
		height: 3px;
		margin-top: 3px;
		border-radius: 2px;
		overflow: hidden;
		background: var(--surface-2);
	}

	.mode {
		position: absolute;
		top: 0;
		bottom: 0;
		background: var(--border-strong);
	}

	.mode.manual {
		background: var(--amber);
	}

	.days {
		position: relative;
		height: 40px;
		margin-top: 5px;
	}

	.slot {
		position: absolute;
		top: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1px;
		overflow: hidden;
	}

	.slot + .slot {
		border-left: 1px solid var(--border);
	}

	.label {
		font-size: 0.58rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-faint);
		white-space: nowrap;
	}

	.value {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text);
		white-space: nowrap;
	}

	.value.none {
		font-weight: 400;
		color: var(--text-faint);
	}

	.since {
		margin-top: 9px;
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.8rem;
		color: var(--text-dim-solid);
	}

	.since b {
		color: var(--text);
		font-weight: 600;
	}

	@container (max-width: 560px) {
		.days {
			height: 34px;
		}

		.label {
			font-size: 0.52rem;
		}

		.value {
			font-size: 0.7rem;
		}
	}
</style>
