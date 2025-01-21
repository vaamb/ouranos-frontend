<script>
	import Fa from 'svelte-fa';
	import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

	import Form from '$lib/components/Form.svelte';
	import Modal from '$lib/components/Modal.svelte';

	import {
		capitalize,
		days,
		deserializeDatetime,
		formatDate,
		formatDateTime,
		months,
		serializeDatetime,
	} from '$lib/utils/functions.js';
	import Table from '$lib/components/Table.svelte';
	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';
	import { eventLevels } from '$lib/utils/consts.js';

	const now = new Date();
	let {
		month = $bindable(now.getMonth()), // 0-indexed month
		year = $bindable(now.getFullYear()),
		events = [],
		handleCrudEvent
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

	const getDayEventsID = function (day) {
		const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
		const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
		return (
			events
				// Keep only index of events that fall between dayStart and dayEnd
				.map((event, i) =>
					dayStart <= event['end_time'] && event['start_time'] <= dayEnd ? i : undefined
				)
				.filter((i) => i !== undefined)
				// Get the IDs of the events
				.map((i) => events[i]['id'])
		);
	};

	const computeEventsDepths = function (events, month, year) {
		const firstDayOfMonth = new Date(year, month);
		const lastDayOfMonth = new Date(year, month + 1, 0);

		const depths = {};
		const days = {};

		for (let date = firstDayOfMonth.getDate(); date <= lastDayOfMonth.getDate(); date++) {
			const day = new Date(year, month, date);
			const dayEventsID = getDayEventsID(day);
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

	// Modal
	let modal = $state();
	let modalDay = $state(undefined);
	let crudAction = $state(undefined);
	let crudIndex = $state(undefined);

	const resetModal = function () {
		modalDay = undefined;
		crudAction = undefined;
		crudIndex = undefined;
	};
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
									onclick={() => {
										modalDay = day;
									}}
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

<Modal
	bind:this={modal}
	showModal={modalDay !== undefined}
	on:close={resetModal}
	title={modalDay !== undefined ? formatDate(modalDay) : ''}
>
	{#if modalDay !== undefined}
		{@const eventsID = getDayEventsID(modalDay)}
		{@const filteredEventsArray = eventsID.map((eventID) => eventsByID[eventID])}
		<div style="width: 800px">
			{#if crudAction === undefined}
				<Table
					tableID="events"
					columns={[
						{ label: 'Title', key: 'title' },
						{ label: 'Start', key: 'start_time', serializer: formatDateTime },
						{ label: 'End', key: 'end_time', serializer: formatDateTime },
						{ label: 'Level', key: 'level', serializer: (value) => capitalize(value) },
						{ label: 'Description', key: 'description' }
					]}
					data={filteredEventsArray}
					editable={true}
					on:crud={(event) => {
						crudAction = event['detail']['action'];
						crudIndex = event['detail']['rowIndex'];
					}}
				/>
			{:else if crudAction === 'create'}
				<Form
					data={[
						{ label: 'Title', key: 'title' },
						{ label: 'Start', key: 'start_time', type: 'datetime-local', deserializer: deserializeDatetime },
						{ label: 'End', key: 'end_time', type: 'datetime-local', deserializer: deserializeDatetime },
						{ label: 'Description', key: 'description' },
						{ label: 'Level', key: 'level', value: eventLevels[0], selectFrom: eventLevels }
					]}
					on:confirm={(event) => {
						const payload = event.detail;
						handleCrudEvent('create', payload);
						modal.closeModal();
					}}
					on:cancel={modal.closeModal}
				/>
			{:else if crudAction === 'update'}
				<Form
					data={[
						{ label: 'Title', key: 'title', value: filteredEventsArray[crudIndex]['title'] },
						{
							label: 'Start',
							key: 'start_time',
							type: 'datetime-local',
							value: filteredEventsArray[crudIndex]['start_time'],
							serializer: serializeDatetime,
							deserializer: deserializeDatetime
						},
						{
							label: 'End',
							key: 'end_time',
							type: 'datetime-local',
							value: filteredEventsArray[crudIndex]['end_time'],
							serializer: serializeDatetime,
							deserializer: deserializeDatetime
						},
						{
							label: 'Description',
							key: 'description',
							value: filteredEventsArray[crudIndex]['description']
						},
						{
							label: 'Level',
							key: 'level',
							value: filteredEventsArray[crudIndex]['level'],
							selectFrom: eventLevels
						}
					]}
					on:confirm={(event) => {
						const payload = event.detail;
						handleCrudEvent('update', {
							eventID: filteredEventsArray[crudIndex]['id'],
							...payload
						});
						modal.closeModal();
					}}
					on:cancel={modal.closeModal}
				/>
			{:else if crudAction === 'delete'}
				<p>Delete '{filteredEventsArray[crudIndex]['title']}' event ?</p>
				<ConfirmButtons
					on:confirm={() => {
						handleCrudEvent('delete', { eventID: filteredEventsArray[crudIndex]['id'] });
						modal.closeModal();
					}}
					on:cancel={modal.closeModal}
				/>
			{/if}
		</div>
	{/if}
</Modal>

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
