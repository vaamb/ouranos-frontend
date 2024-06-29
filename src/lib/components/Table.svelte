<script>
	import { createEventDispatcher } from 'svelte';

	import Fa from 'svelte-fa';
	import {
		faCircle,
		faTrashCan,
		faSquarePlus,
		faPenToSquare
	} from '@fortawesome/free-solid-svg-icons';

	import { permissions } from '$lib/utils/consts.js';
	import { getStatusClass, timeStringToDate } from '$lib/utils/functions.js';
	import { currentUser } from '$lib/store.js';

	export let tableID;
	export let columns = []; // [{label: "My column", key: "data_key", isTime: false, isStatus: false}]
	export let data = []; // [{data_key: data1}, {data_key: data2}]
	export let editable = false;
	export let crudOptions = ['create', 'update', 'delete'];

	const dispatch = createEventDispatcher();

	const emitEvent = function (action, rowIndex) {
		const payload = {
			action: action,
			rowIndex: rowIndex
		};
		dispatch('crud', payload);
	};

	const checkCongruency = function () {
		for (const column of columns) {
			if (!Object.prototype.hasOwnProperty.call(data[0], column.key)) {
				console.warn("SimpleTable '" + tableID + "': Columns and data keys do not match");
				break;
			}
		}
	};

	if (data.length > 0) {
		checkCongruency();
	}
</script>

<div class="table-wrap">
	<table class="table-base table-spaced table-alternate-colors">
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
					{#if $currentUser.can(permissions.OPERATE) & editable & (crudOptions.includes('update') || crudOptions.includes('delete'))}
						<td>
							<div>
								{#if crudOptions.includes('update')}
									<button class="crud-button" on:click={() => emitEvent('update', rowIndex)}>
										<Fa icon={faPenToSquare} />
									</button>
								{/if}
								{#if crudOptions.includes('delete')}
									<button class="crud-button" on:click={() => emitEvent('delete', rowIndex)}>
										<Fa icon={faTrashCan} />
									</button>
								{/if}
							</div>
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
		{#if $currentUser.can(permissions.OPERATE) & editable & crudOptions.includes('create')}
			<tbody>
				<tr class="table-bigger-line">
					<td colspan="8" style="text-align: center; vertical-align: middle">
						<button class="crud-button" style="font-size: 2rem" on:click={() => emitEvent('create')}>
							<Fa icon={faSquarePlus} />
						</button>
					</td>
				</tr>
			</tbody>
		{/if}
	</table>
</div>
<style>
	.table-wrap {
		overflow-x: auto;
	}
</style>
