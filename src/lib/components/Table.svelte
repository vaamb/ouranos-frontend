<script>
	import { createEventDispatcher, onMount } from 'svelte';

	import Fa from 'svelte-fa';
	import {
		faCircle,
		faTrashCan,
		faSquarePlus,
		faPenToSquare
	} from '@fortawesome/free-solid-svg-icons';

	import { permissions } from '$lib/utils/consts.js';
	import { formatDateTime, getStatusClass } from '$lib/utils/functions.js';
	import { currentUser } from '$lib/store.js';

	export let tableID;
	export let columns = [{}]; // [{label: "My column", key: "data_key", isTime: false, isStatus: false}]
	export let data = [{}]; // [{data_key: data1}, {data_key: data2}]
	export let editable = false;

	const dispatch = createEventDispatcher();

	const timeStringToDate = function (timeString) {
		if (timeString !== null) {
			return formatDateTime(new Date(timeString));
		} else {
			return 'NA';
		}
	};

	const emitEvent = function (action, rowIndex) {
		const payload = {
			action: action,
			rowIndex: rowIndex
		};
		dispatch('crud', payload);
	};

	const checkCongruency = function () {
		let mismatch = false;
		for (const column of columns) {
			if (mismatch === true) {
				break;
			}
			if (!Object.prototype.hasOwnProperty.call(data[0], column.key)) {
				console.warn("SimpleTable '" + tableID + "': Columns and data keys do not match");
				mismatch = true;
			}
		}
	};

	onMount(() => {
		checkCongruency();
	});
</script>

<table class="table-base table-alternate-colors">
	<thead>
		<tr>
			{#each columns as column}
				<th>{column.label}</th>
			{/each}
			{#if $currentUser.can(permissions.OPERATE) & editable}
				<th>Action</th>
			{/if}
		</tr>
	</thead>
	<tbody>
		{#each data as row, rowIndex}
			<tr>
				{#each columns as column}
					<td>
						{#if column['isStatus'] === true}
							<Fa icon={faCircle} class={getStatusClass(row[column.key])} />
						{:else if column['isTime'] === true}
							{timeStringToDate(row[column.key])}
						{:else}
							{row[column.key]}
						{/if}
					</td>
				{/each}
				{#if $currentUser.can(permissions.OPERATE) & editable}
					<td>
						<div>
							<button on:click={() => emitEvent('update', rowIndex)}>
								<Fa icon={faPenToSquare} />
							</button>
							<button on:click={() => emitEvent('delete', rowIndex)}>
								<Fa icon={faTrashCan} />
							</button>
						</div>
					</td>
				{/if}
			</tr>
		{/each}
	</tbody>
	{#if $currentUser.can(permissions.OPERATE) & editable}
		<tbody>
			<tr>
				<td colspan="8" style="text-align: center; vertical-align: middle">
					<button class="table-bigger-line" on:click={() => emitEvent('create')}>
						<Fa icon={faSquarePlus} />
					</button>
				</td>
			</tr>
		</tbody>
	{/if}
</table>

<style>
	.table-base {
		display: table;
		/* table-layout: fixed; */
		width: 100%;
		border-collapse: collapse;
		font-family: sans-serif;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
		margin-bottom: 1.5rem;
	}

	.table-base thead {
		text-align: left;
	}

	.table-base thead th {
		padding: 1.25rem 1rem;
	}

	.table-base td {
		padding: 0.75rem 1rem;
	}

	.table-base thead tr {
		background-color: #73879c;
		color: #f9f9fb;
	}

	.table-base tbody {
		text-align: left;
	}

	.table-base tbody tr {
		border-bottom: thin solid #dddddd;
	}

	.table-base tbody tr:last-of-type {
		border-bottom: 2px solid #73879c;
	}

	.table-base tbody tr .table-bigger-line {
		height: 3.14rem;
		font-size: 2rem;
	}

	.table-base button {
		border: none;
		color: inherit;
		background-color: inherit;
		font-size: 1.2rem;
		cursor: pointer;
	}

	.table-base button:disabled {
		color: rgba(115, 135, 156, 0.33);
	}

	.table-base button + button {
		margin-left: 8px;
	}

	.table-alternate-colors tbody tr:nth-child(even) {
		background-color: #f3f3f3;
	}
</style>
