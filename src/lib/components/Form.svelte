<script>
	import { createEventDispatcher } from 'svelte';

	import Fa from 'svelte-fa';
	import { faCircle } from '@fortawesome/free-solid-svg-icons';

	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';

	import { isEmpty, isObject } from '$lib/utils/functions.js';

	let { data } = $props();
	// [{
	//   label: "The input", key: "the_input", value: "the value"
	//   serializer: undefined | function(value), deserializer: undefined | function(value),
	//   selectFrom: [{ label: "The input", value: "the_value" }]
	//   validate: undefined | function(value) { return value === "validated" },
	//   required: true
	//   all remaining input parameters
	// }]

	const isNotFalse = function (obj) {
		return obj === undefined ? true : obj;
	};

	const notEmptyValue = function (value) {
		return value !== undefined && value !== '';
	};

	const getValues = function (data) {
		const rv = {};
		for (const row of data) {
			const serializer =
				row['serializer'] !== undefined
					? row['serializer']
					: (value) => {
							return value;
						};
			const defaultValidator =
				isNotFalse(row['required'])
					? notEmptyValue
					: (value) => {
							return true;
						};
			const deserializer =
				row['deserializer'] !== undefined
					? row['deserializer']
					: (value) => {
							return value;
						};
			rv[row['key']] = {
				value: row['value'] !== undefined ? serializer(row['value']) : '',
				files: undefined,
				validate: row['validate'] !== undefined ? row['validate'] : defaultValidator,
				deserializer: deserializer
			};
		}
		return rv;
	};

	let values = $state(getValues(data));

	const canSubmit = function (data) {
		for (const [_, obj] of Object.entries(data)) {
			const validate = obj['validate'];
			if (obj['files'] !== undefined) {
				return true
			}
			else if (!validate(obj['value'])) {
				return false;
			}
		}
		return true;
	};

	let disabledSubmit = $derived(!canSubmit(values));

	const dispatch = createEventDispatcher();

	const cancel = function () {
		dispatch('cancel');
	};

	const confirm = function () {
		const payload = {};
		for (const [key, obj] of Object.entries(values)) {
			if (obj['files'] !== undefined) {
				// File type input, need to pass files
				payload[key] = obj['files'];
			} else {
				// Others, need to pass the (deserialized) value
				const deserialized_value = obj['deserializer'](obj['value']);
				if (deserialized_value !== '') {
					payload[key] = deserialized_value;
				}
			}
		}
		dispatch('confirm', payload);
	};
</script>

<table style="display: table">
	<tbody>
		{#each data as row}
			<tr>
				<td>
					<label for={row['key']}>{row['label'] || row['key']}</label>
				</td>
				<td style="width: 10px"></td>
				<td>
					{#if isEmpty(row['selectFrom'])}
						{#if row['type'] !== 'file'}
							<input
								id={row['key']}
								bind:value={values[row['key']]['value']}
								{...row}
							/>
						{:else}
							<input
								id={row['key']}
								bind:files={values[row['key']]['files']}
								{...row}
								type="file"
							/>
						{/if}
					{:else}
						<select
							id={row['key']}
							bind:value={values[row['key']]['value']}
							{...row}
						>
							{#if !row['value']}
								<option disabled value="">Select one</option>
							{/if}
							{#each row['selectFrom'] as choice}
								{#if isObject(choice)}
									<option value={choice['value']}>
										{choice['label'] || choice['value']}
									</option>
								{:else}
									<option value={choice}>
										{choice}
									</option>
								{/if}
							{/each}
						</select>
					{/if}
				</td>
				<td>
					{#if isNotFalse(row['required'])}
						&nbsp;
						<Fa
							icon={faCircle}
							class={
								row['type'] !== 'file'
								? values[row['key']]['validate'](values[row['key']]['value']) ? 'on' : 'off'
								: values[row['key']]['validate'](values[row['key']]['files']) ? 'on' : 'off'
							}
						/>
					{/if}
				</td>
			</tr>
		{/each}
	</tbody>
</table>
<ConfirmButtons disabled={disabledSubmit} on:confirm={confirm} on:cancel={cancel} />

<style>
	label {
		font-size: 1.15rem;
	}

	input {
		height: 1.35rem;
		width: 240px;
		font-family: inherit;
	}

	select {
		height: 1.5rem;
		width: 242px;
		font-family: inherit;
	}

	option {
		height: 1.5rem;
		font-family: inherit;
	}

	input:disabled {
		background-color: var(--gray-90);
		border: var(--gray-50) 1px solid;
	}

	tr {
		height: 28px;
	}
</style>
