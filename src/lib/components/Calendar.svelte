<script>
	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';
	import Form from '$lib/components/Form.svelte';
	import Modal from '$lib/components/Modal.svelte';

	import { appState } from '$lib/store.svelte.ts';
	import { eventLevels, eventVisibility } from '$lib/utils/consts.js';
	import {
		deserializeDatetime,
		formatDate,
		getLevelColor,
		months,
		serializeDatetime
	} from '$lib/utils/functions.js';

	const now = new Date();
	let {
		month = $bindable(now.getMonth()), // 0-indexed month
		year = $bindable(now.getFullYear()),
		events = [],
		handleCrudEvent
	} = $props();

	// The month is drawn as one continuous column of days rather than a 7x6 grid
	const MAX_LANES = 4;

	// Two letters, not one: unlike a grid, the thread has no weekday columns to
	// disambiguate Tuesday from Thursday, or Saturday from Sunday.
	const weekdayInitials = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

	// Levels loud enough to be named on the bar, so severity never rides on
	// colour alone.
	const loudLevels = ['high', 'severe', 'critical'];

	let today = $derived(new Date(now.getFullYear(), now.getMonth(), now.getDate()));

	const midnight = function (date) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate());
	};

	// Whole days between two dates, both normalised to midnight first.
	const daysBetween = function (date, origin) {
		return Math.round((midnight(date) - origin) / 86400000);
	};

	// ISO-8601 week number (weeks start Monday; week 1 is the one holding the
	// first Thursday). Marked on Mondays as the thread's major tick.
	const isoWeek = function (date) {
		const thursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
		thursday.setUTCDate(thursday.getUTCDate() - ((thursday.getUTCDay() + 6) % 7) + 3);
		const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
		firstThursday.setUTCDate(
			firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3
		);
		return 1 + Math.round((thursday - firstThursday) / (7 * 86400000));
	};

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

	const goToToday = function () {
		month = now.getMonth();
		year = now.getFullYear();
	};

	let firstOfMonth = $derived(new Date(year, month, 1));
	let dayCount = $derived(new Date(year, month + 1, 0).getDate());
	let lastOfMonth = $derived(new Date(year, month, dayCount, 23, 59, 59));

	let monthDays = $derived.by(() => {
		const days = [];
		for (let date = 1; date <= dayCount; date++) {
			const day = new Date(year, month, date);
			const weekday = day.getDay();
			days.push({
				date: date,
				day: day,
				weekday: weekday,
				weekend: weekday === 0 || weekday === 6,
				// The week number only labels the row that starts the week.
				week: weekday === 1 || date === 1 ? isoWeek(day) : null,
				weekStart: weekday === 1,
				past: day < today,
				today: day.getTime() === today.getTime()
			});
		}
		return days;
	});

	// Lay the month's events out in lanes. An event takes the lowest lane that is
	// free for its whole run
	let laidOutEvents = $derived.by(() => {
		const visible = events
			.filter((event) => event['start_time'] <= lastOfMonth && event['end_time'] >= firstOfMonth)
			.sort(
				(a, b) => a['start_time'] - b['start_time'] || b['end_time'] - a['end_time']
			);

		const laneEnds = []; // last day (ms) occupied, per lane
		const laidOut = visible.map((event) => {
			let lane = laneEnds.findIndex((end) => end <= midnight(event['start_time']));
			if (lane === -1) {
				lane = laneEnds.length;
			}
			laneEnds[lane] = midnight(event['end_time']);
			return {
				event: event,
				lane: Math.min(lane, MAX_LANES - 1),
				from: Math.max(0, daysBetween(event['start_time'], firstOfMonth)),
				to: Math.min(dayCount - 1, daysBetween(event['end_time'], firstOfMonth)),
				continuesBefore: event['start_time'] < firstOfMonth,
				continuesAfter: event['end_time'] > lastOfMonth,
				running: event['start_time'] <= now && now <= event['end_time'],
				past: midnight(event['end_time']) < today
			};
		});

		const laneCount = Math.min(Math.max(laneEnds.length, 1), MAX_LANES);
		const occupied = Array.from({ length: laneCount }, () => new Array(dayCount).fill(false));
		for (const item of laidOut) {
			for (let i = item.from; i <= item.to; i++) {
				occupied[item.lane][i] = true;
			}
		}
		for (const item of laidOut) {
			let span = 1;
			while (item.lane + span < laneCount) {
				let free = true;
				for (let i = item.from; i <= item.to && free; i++) {
					free = !occupied[item.lane + span][i];
				}
				if (!free) {
					break;
				}
				span++;
			}
			item.span = span;
		}

		return { items: laidOut, laneCount: laneCount };
	});

	// Which days already carry something, so only the free ones offer "+ Add".
	let busyDays = $derived.by(() => {
		const busy = new Set();
		for (const item of laidOutEvents.items) {
			for (let i = item.from; i <= item.to; i++) {
				busy.add(i);
			}
		}
		return busy;
	});

	const spanLabel = function (event) {
		const days = daysBetween(event['end_time'], midnight(event['start_time'])) + 1;
		return days === 1 ? '1 day' : `${days} days`;
	};

	const timeLabel = function (date) {
		return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
	};

	const shortDate = function (date) {
		return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	};

	// The bar's own line: a single-day event reads as a time range, a multi-day
	// one as the run it covers.
	const eventMeta = function (item) {
		if (item.from === item.to) {
			return `${timeLabel(item.event['start_time'])}–${timeLabel(item.event['end_time'])}`;
		}
		return (
			`${shortDate(item.event['start_time'])} → ${shortDate(item.event['end_time'])}` +
			` · ${spanLabel(item.event)}`
		);
	};

	const visibilityLabel = {
		private: 'Visible to you only',
		users: 'Visible to signed-in users',
		public: 'Visible to everyone'
	};

	// Modal: either an event's detail, or one of the create/update/delete forms.
	let selectedEvent = $state(undefined);
	let crudAction = $state(undefined);
	let crudDay = $state(undefined);

	const resetModal = function () {
		selectedEvent = undefined;
		crudAction = undefined;
		crudDay = undefined;
	};

	const startCreate = function (day) {
		crudDay = day;
		crudAction = 'create';
	};

	let modalOpen = $derived(selectedEvent !== undefined || crudAction !== undefined);

	// The sheet's rail: the event's own severity, except when the act is destructive
	let modalIntent = $derived(
		crudAction === 'delete'
			? '--critical-red'
			: selectedEvent
				? getLevelColor(selectedEvent['level'])
				: '--grow'
	);
</script>

<section class="calendar">
	<div class="calendar-head">
		<div class="month-nav">
			<button class="icon-button" type="button" onclick={prevMonth} aria-label="Previous month">
				&#8249;
			</button>
			<h2>{months[month]} {year}</h2>
			<button class="icon-button" type="button" onclick={nextMonth} aria-label="Next month">
				&#8250;
			</button>
		</div>
		<button class="ghost-button" type="button" onclick={goToToday}>Today</button>
		{#if appState.currentUser.isAuthenticated}
			<button
				class="ghost-button new-event"
				type="button"
				onclick={() => startCreate(today >= firstOfMonth && today <= lastOfMonth ? today : firstOfMonth)}
			>
				+ New event
			</button>
		{/if}
	</div>

	<div class="thread-scroll">
		<div class="thread" style="--lanes: {laidOutEvents.laneCount}">
			<!-- Row backgrounds first: the bars paint over them in DOM order. -->
			{#each monthDays as day (day.date)}
				<div
					class="stripe"
					class:today={day.today}
					class:week-start={day.weekStart}
					class:first={day.date === 1}
					style="grid-row: {day.date}"
				>
					{#if appState.currentUser.isAuthenticated && !busyDays.has(day.date - 1)}
						<button
							class="add-event"
							type="button"
							onclick={() => startCreate(day.day)}
							aria-label="Add an event on {formatDate(day.day)}"
						>
							+ Add
						</button>
					{/if}
				</div>
			{/each}

			<!-- Day gutter: sticky, so the dates hold while the lanes scroll sideways -->
			{#each monthDays as day (day.date)}
				<div
					class="day"
					class:weekend={day.weekend}
					class:past={day.past}
					class:today={day.today}
					style="grid-row: {day.date}"
				>
					<span class="week">{day.week ? `W${day.week}` : ''}</span>
					<span class="weekday">{weekdayInitials[day.weekday]}</span>
					<span class="date">{day.date}</span>
				</div>
			{/each}

			<!-- One unbroken rail per event, from its first row to its last -->
			{#each laidOutEvents.items as item (item.event['id'])}
				<button
					class="event"
					class:single-day={item.from === item.to}
					class:running={item.running}
					class:past={item.past}
					class:continues-before={item.continuesBefore}
					class:continues-after={item.continuesAfter}
					type="button"
					style="
						--level-color: var({getLevelColor(item.event['level'])});
						grid-column: {item.lane + 2} / span {item.span};
						grid-row: {item.from + 1} / {item.to + 2};
					"
					onclick={() => (selectedEvent = item.event)}
				>
					<span class="rail" aria-hidden="true"></span>
					<span class="event-head">
						<span class="title">{item.event['title']}</span>
						<span class="meta">{eventMeta(item)}</span>
						{#if loudLevels.includes(item.event['level'])}
							<span class="level-tag">{item.event['level']}</span>
						{/if}
					</span>
				</button>
			{/each}
		</div>
	</div>
</section>

{#snippet modalTitle()}
	{#if crudAction === 'create'}
		New event
	{:else if crudAction === 'update'}
		Edit event
	{:else if crudAction === 'delete'}
		Delete event
	{:else if selectedEvent}
		{selectedEvent['title']}
	{/if}
{/snippet}

{#snippet modalKicker()}
	{#if crudAction === 'create'}
		Calendar · {formatDate(crudDay)}
	{:else if crudAction === 'delete'}
		This cannot be undone
	{:else if selectedEvent}
		<span class="swatch"></span>
		{selectedEvent['level']}{crudAction === undefined ? ` · ${spanLabel(selectedEvent)}` : ''}
	{/if}
{/snippet}

<Modal
	showModal={modalOpen}
	onclose={resetModal}
	intent={modalIntent}
	title={modalTitle}
	kicker={modalKicker}
>
	{#snippet children(closeModal)}
		{#if crudAction === undefined && selectedEvent}
			<div class="detail">
				<p class="detail-when">
					Starts <b>{formatDate(selectedEvent['start_time'])}</b>,
					{timeLabel(selectedEvent['start_time'])}<br />
					Ends <b>{formatDate(selectedEvent['end_time'])}</b>,
					{timeLabel(selectedEvent['end_time'])}
				</p>
				{#if selectedEvent['description']}
					<p class="detail-description">{selectedEvent['description']}</p>
				{/if}
				<div class="detail-visibility">
					{visibilityLabel[selectedEvent['visibility']] || ''}
				</div>
				{#if appState.currentUser.isAuthenticated}
					<div class="detail-actions">
						<button class="ghost-button" type="button" onclick={() => (crudAction = 'update')}>
							Edit
						</button>
						<button
							class="ghost-button danger"
							type="button"
							onclick={() => (crudAction = 'delete')}
						>
							Delete
						</button>
					</div>
				{/if}
			</div>
		{:else if crudAction === 'create'}
			<Form
				data={[
					{ label: 'Title', key: 'title' },
					{
						label: 'From',
						key: 'start_time',
						type: 'datetime-local',
						deserializer: deserializeDatetime,
						value: serializeDatetime(crudDay),
						group: 'Runs'
					},
					{
						label: 'Until',
						key: 'end_time',
						type: 'datetime-local',
						deserializer: deserializeDatetime,
						group: 'Runs'
					},
					{ label: 'Description', key: 'description', required: false, type: 'textarea' },
					{
						label: 'Level',
						key: 'level',
						value: eventLevels[0],
						selectFrom: eventLevels,
						group: 'Filed as'
					},
					{
						label: 'Visible to',
						key: 'visibility',
						value: eventVisibility[1],
						selectFrom: eventVisibility,
						group: 'Filed as'
					}
				]}
				confirmLabel="Add event"
				onconfirm={(payload) => {
					handleCrudEvent('create', payload);
					closeModal();
				}}
				oncancel={closeModal}
			/>
		{:else if crudAction === 'update'}
			<Form
				data={[
					{ label: 'Title', key: 'title', value: selectedEvent['title'] },
					{
						label: 'From',
						key: 'start_time',
						type: 'datetime-local',
						value: selectedEvent['start_time'],
						serializer: serializeDatetime,
						deserializer: deserializeDatetime,
						group: 'Runs'
					},
					{
						label: 'Until',
						key: 'end_time',
						type: 'datetime-local',
						value: selectedEvent['end_time'],
						serializer: serializeDatetime,
						deserializer: deserializeDatetime,
						group: 'Runs'
					},
					{
						label: 'Description',
						key: 'description',
						value: selectedEvent['description'],
						required: false,
						type: 'textarea'
					},
					{
						label: 'Level',
						key: 'level',
						value: selectedEvent['level'],
						selectFrom: eventLevels,
						group: 'Filed as'
					},
					{
						label: 'Visible to',
						key: 'visibility',
						value: selectedEvent['visibility'],
						selectFrom: eventVisibility,
						group: 'Filed as'
					}
				]}
				confirmLabel="Save changes"
				onconfirm={(payload) => {
					handleCrudEvent('update', { eventID: selectedEvent['id'], ...payload });
					closeModal();
				}}
				oncancel={closeModal}
			/>
		{:else if crudAction === 'delete'}
			<p class="confirm-copy">
				<b>{selectedEvent['title']}</b> disappears from the calendar for everyone who can see it.
				<span class="confirm-runs">
					{shortDate(selectedEvent['start_time'])} → {shortDate(selectedEvent['end_time'])}
					· {selectedEvent['level']}
				</span>
			</p>
			<ConfirmButtons
				confirmLabel="Delete event"
				cancelLabel="Keep it"
				danger
				onconfirm={() => {
					handleCrudEvent('delete', { eventID: selectedEvent['id'] });
					closeModal();
				}}
				oncancel={closeModal}
			/>
		{/if}
	{/snippet}
</Modal>

<style>
	.calendar {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}

	.calendar-head {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		padding: 13px 16px;
		border-bottom: 1px solid var(--border);
	}

	.month-nav {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.month-nav h2 {
		font-family: 'EB Garamond', Garamond, Georgia, serif;
		font-size: 1.375rem;
		font-weight: 600;
		line-height: 1.1;
		margin: 0 6px;
		min-width: 8.8ch;
		color: var(--text);
	}

	.icon-button {
		width: 28px;
		height: 28px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--text-dim-solid);
		cursor: pointer;
		font-size: 0.85rem;
		line-height: 1;
	}

	.icon-button:hover {
		border-color: var(--border-strong);
		color: var(--text);
	}

	.ghost-button {
		font-family: 'Raleway', sans-serif;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 7px 13px;
		border-radius: var(--radius);
		cursor: pointer;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text-dim-solid);
	}

	.ghost-button:hover {
		border-color: var(--border-strong);
		color: var(--text);
	}

	.new-event {
		margin-left: auto;
		border-color: var(--border-strong);
		color: var(--text);
	}

	.new-event:hover {
		border-color: var(--grow);
		color: var(--grow);
	}

	.thread-scroll {
		overflow-x: auto;
	}

	.thread {
		--row: 26px;
		display: grid;
		grid-template-columns: 96px repeat(var(--lanes), minmax(170px, 1fr));
		grid-auto-rows: var(--row);
		min-width: 100%;
		padding-bottom: 8px;
	}

	.stripe {
		grid-column: 1 / -1;
		position: relative;
	}

	.stripe.week-start,
	.stripe.first {
		box-shadow: inset 0 1px 0 var(--border);
	}

	/* Today is the one strong line on the page; it wins over the week rule. */
	.stripe.today,
	.stripe.today.week-start {
		box-shadow: inset 0 1px 0 var(--text);
	}

	.add-event {
		position: absolute;
		top: 50%;
		right: 10px;
		transform: translateY(-50%);
		opacity: 0;
		border: 0;
		background: transparent;
		cursor: pointer;
		font-family: 'Raleway', sans-serif;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-faint);
		padding: 3px 6px;
	}

	.stripe:hover .add-event,
	.add-event:focus-visible {
		opacity: 1;
	}

	.add-event:hover {
		color: var(--grow);
	}

	.day {
		grid-column: 1;
		z-index: 2;
		position: sticky;
		left: 0;
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 0 10px 0 12px;
		background: var(--surface);
		box-shadow: 1px 0 0 var(--border);
	}

	.day.weekend {
		background: var(--surface-2);
	}

	/* Week number, on the row that starts the week: growers plan in week numbers
	   ("sow in week 12"), so the thread's major tick is marked in that unit. */
	.week {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--text-faint);
		width: 3.4ch;
		flex: none;
	}

	/* Two letters, not one: the thread has no columns to disambiguate T/T, S/S. */
	.weekday {
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-faint);
		width: 2.6ch;
	}

	.day.weekend .weekday {
		color: var(--text-dim-solid);
	}

	.date {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text);
		width: 2ch;
		text-align: right;
	}

	.day.past .date {
		color: var(--text-faint);
		font-weight: 400;
	}

	.day.past .weekday {
		color: var(--text-faint);
	}

	.day.today .date {
		background: var(--text);
		color: var(--surface);
		border-radius: 3px;
		width: auto;
		min-width: 22px;
		padding: 1px 4px;
		text-align: center;
		font-weight: 700;
	}

	/* An event is a rail the length of its run, labelled at its head. Deliberately
	   not a filled box: a two-week event would be a two-week void. */
	.event {
		z-index: 1;
		margin: 2px 10px 2px 0;
		padding: 0;
		border: 0;
		border-radius: 3px;
		background: transparent;
		display: flex;
		align-items: stretch;
		gap: 9px;
		overflow: hidden;
		text-align: left;
		cursor: pointer;
		font-family: 'Raleway', sans-serif;
		transition: background 120ms ease;
	}

	.event:hover {
		background: color-mix(in srgb, var(--level-color) 9%, transparent);
	}

	.rail {
		flex: none;
		width: 3px;
		border-radius: 2px;
		background: var(--level-color);
		align-self: stretch;
	}

	/* An event in effect today needs no fill: its rail visibly crosses the today
	   line. A heavier rail is enough to pick it out. */
	.event.running .rail {
		width: 5px;
	}

	/* Cut, not closed, where the run continues past the edge of the month */
	.event.continues-before .rail {
		border-radius: 0 0 2px 2px;
		margin-top: -2px;
	}

	.event.continues-after .rail {
		border-radius: 2px 2px 0 0;
		margin-bottom: -2px;
	}

	.event-head {
		min-width: 0;
		overflow: hidden;
		padding: 1px 6px 0 0;
	}

	.event.single-day {
		align-items: center;
	}

	.event.single-day .event-head {
		display: flex;
		align-items: baseline;
		gap: 11px;
		width: 100%;
		padding-top: 0;
	}

	.event.single-day .title {
		flex: 0 1 auto;
		min-width: 0;
	}

	.event.single-day .meta,
	.event.single-day .level-tag {
		flex: none;
	}

	.title {
		display: block;
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text);
		line-height: 1.3;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.meta {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.66rem;
		color: var(--text-dim-solid);
		line-height: 1.35;
		white-space: nowrap;
	}

	/* Severity is loud enough to name from `high` up, so colour is never alone. */
	.level-tag {
		font-size: 0.56rem;
		font-weight: 800;
		letter-spacing: 0.11em;
		text-transform: uppercase;
		color: var(--level-color);
	}

	.event.past {
		opacity: 0.62;
	}

	/* Event detail */
	/* The kicker's severity dot, rendered into the modal's head */
	.swatch {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--intent);
	}

	.detail-when {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.8rem;
		color: var(--text-dim-solid);
		margin: 0;
		line-height: 1.7;
	}

	.detail-when b {
		color: var(--text);
		font-weight: 600;
	}

	.detail-description {
		font-size: 0.85rem;
		color: var(--text-dim-solid);
		margin: 12px 0 0;
		padding-top: 12px;
		border-top: 1px solid var(--border);
	}

	.confirm-copy {
		font-size: 0.9rem;
		color: var(--text-dim-solid);
	}

	.confirm-copy b {
		color: var(--text);
		font-weight: 600;
	}

	.confirm-runs {
		display: block;
		margin-top: 6px;
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.78rem;
		color: var(--text-faint);
	}

	.detail-visibility {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-faint);
		margin-top: 14px;
	}

	.detail-actions {
		display: flex;
		gap: 8px;
		margin-top: 18px;
		padding-top: 14px;
		border-top: 1px solid var(--border);
	}

	.detail-actions .danger:hover {
		border-color: var(--critical-red);
		color: var(--critical-red);
	}

	@media only screen and (max-width: 640px) {
		.thread {
			--row: 30px;
			grid-template-columns: 92px repeat(var(--lanes), minmax(190px, 1fr));
		}
			
		.event.single-day .meta {
			display: none;
		}

		.new-event {
			margin-left: 0;
		}
	}
</style>
