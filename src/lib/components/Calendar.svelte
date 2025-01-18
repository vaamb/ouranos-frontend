<script>
	import Fa from 'svelte-fa';
	import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

	import { days, months } from '$lib/utils/functions.js';

	const now = new Date();
	let {
		month = $bindable(now.getMonth()), // 0-indexed month
		year = $bindable(now.getFullYear()),
		events = []
	} = $props();

	let today = $derived(new Date(now.getFullYear(), now.getMonth(), now.getDate()));

	let eventsByID = $derived(events.reduce((acc, value) => ({ ...acc, [value['id']]: value }), {}));

	let outerWidth = $state(0);
	let daysName = $derived.by(() => {
		if (outerWidth < 640) return ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
		if (outerWidth < 992) return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		return days;
	});

	// Navigation
	const nextMonth = function () {
		month++;
		if (month > 11) {
			month = 0;
			year++;
		}
	};

	const prevMonth = function () {
		month--;
		if (month < 0) {
			month = 11;
			year--;
		}
	};

	const computeCalendarArray = function (month, year) {
		const calendarArray = [
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0]
		];
		// months are 0 indexed
		const firstDayOfMonth = new Date(year, month);
		const lastDayOfMonth = new Date(year, month + 1, 0);

		let started = false;
		let i = 1;
		for (let row = 0; row < calendarArray.length; row++) {
			for (let col = 0; col < days.length; col++) {
				if (i > lastDayOfMonth.getDate()) {
					break;
				}
				if (row === 0 && !started) {
					if (col === firstDayOfMonth.getDay()) {
						started = true;
					} else {
						continue;
					}
				}
				calendarArray[row][col] = new Date(year, month, i);
				i++;
			}
		}
		return calendarArray;
	};
	let calendarArray = $derived(computeCalendarArray(month, year));

	const computeColorsIndex = function (events) {
		const colors = {
			0: '--red',
			1: '--orange',
			2: '--yellow',
			3: '--green',
			4: '--green-blue',
			5: '--blue',
			6: '--purple'
		};

		const colorsIndex = {};
		let colorIndex = 0;
		for (const event of events) {
			colorsIndex[event['id']] = colors[colorIndex];
			colorIndex++;
			colorIndex = colorIndex % 7;
		}
		return colorsIndex;
	};
	let colorsIndex = $derived(computeColorsIndex(events));

	const computeEventsDepths = function (events, month, year) {
		const firstDayOfMonth = new Date(year, month);
		const lastDayOfMonth = new Date(year, month + 1, 0);

		const depths = {};
		const days = {};

		for (let date = firstDayOfMonth.getDate(); date <= lastDayOfMonth.getDate(); date++) {
			const day = new Date(year, month, date);
			const dayStart = new Date(day.getFullYear(), day.getMonth(), date);
			const dayEnd = new Date(day.getFullYear(), day.getMonth(), date + 1);
			const dayEventsID = events
				// Keep only index of events that fall between dayStart and dayEnd
				.map((event, i) =>
					dayStart <= event['end_time'] && event['start_time'] <= dayEnd ? i : undefined
				)
				.filter((i) => i !== undefined)
				// Get the IDs of the events
				.map((i) => events[i]['id']);
			if (dayEventsID.length === 0) {
				continue;
			}
			days[day.getTime()] = days[day.getTime()] || {};
			let depthsAvailable = [1, 2, 3];
			for (const dayEventID of dayEventsID) {
				if (depths[dayEventID] === undefined) {
					depths[dayEventID] = Math.min(...depthsAvailable) || 4;
				}
				const depth = depths[dayEventID];
				days[day.getTime()][depth] = days[day.getTime()][depth] || [];
				days[day.getTime()][depth].push(dayEventID);
				depthsAvailable = depthsAvailable.filter(function (item) {
					return item !== depth;
				});
			}
		}
		return days;
	};
	let eventsDepths = $derived(computeEventsDepths(events, month, year));
</script>

<svelte:window bind:outerWidth />

<div class="calendar">
	<div class="header">
		<button class="prev-next" onclick={prevMonth}>
			<Fa icon={faChevronLeft} />
		</button>
		{months[month] + ' ' + year}
		<button class="prev-next" onclick={nextMonth}>
			<Fa icon={faChevronRight} />
		</button>
	</div>
	<table>
		<thead>
			<tr>
				{#each daysName as day}
					<th>{day}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each calendarArray as row}
				<tr>
					{#each row as day}
						<td>
							{#if day}
								{@const eventsDepth = eventsDepths[day.getTime()] || {}}
								{@const depths = [1, 2, 3, 4]}
								<div
									class="
										day
										{day.getTime() === today.getTime() ? 'today' : ''}
										{day.getTime() < today.getTime() ? 'past' : ''}
									"
								>
									<div class="date">{day.getDate()}</div>
									{#each depths as depth}
										{#if eventsDepth[depth]}
											{@const dayEventsID = eventsDepth[depth]}
											{#if depth < 4}
												{@const dayEventID = dayEventsID[0]}
												{@const event = eventsByID[dayEventID]}
												<div class="event" style="background: var({colorsIndex[dayEventID]})">
													{event['title']}
												</div>
											{:else}
												<div class="event event-extra">...</div>
											{/if}
										{:else}
											<div class="event">&nbsp;</div>
										{/if}
									{/each}
								</div>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	table {
		display: table;
		table-layout: fixed;
		width: 100%;
	}

	table thead th {
		padding: 0.8rem 0.5rem;
	}

	.calendar {
		max-width: 900px;
		margin-bottom: 1.5rem;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
	}

	.header {
		font-size: 1.2rem;
		font-weight: 600;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background-color: var(--main-60);
		color: var(--background-color);
	}

	.prev-next {
		border: none;
		font-size: 1rem;
		cursor: pointer;
		background: var(--background-color) none;
		line-height: 1.5rem;
		width: 1.5rem;
		border-radius: 5px;
	}

	.day {
		height: 94px;
		display: flex;
		flex-direction: column;
		cursor: pointer;
		border-radius: 10px;
		color: var(--main-60);
		background: var(--main-92);
		margin: 1px;
		border: var(--main-50-shadow) solid 1px;
	}

	.past {
		background: var(--main-94);
	}

	.today {
		background: var(--main-90);
		border: var(--main-60) solid 1px;
		font-weight: bold;
	}

	.date {
		margin: 3px 3px 1px auto;
	}

	.event {
		padding: 0 5px;
		margin: 1px 0;
		font-size: 0.75rem;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.event-extra {
		background: var(--main-80);
	}
</style>
