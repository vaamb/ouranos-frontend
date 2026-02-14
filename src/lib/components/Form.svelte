<script>
	import Fa from 'svelte-fa';
	import { faCircle } from '@fortawesome/free-solid-svg-icons';

	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';

	import { isEmpty, isObject } from '$lib/utils/functions.js';

	let {
		data,
		onconfirm = (payload) => {},
		oncancel = () => {}
	} = $props();
	// [{
	//   label: "The input", key: "the_input", value: "the value"
	//   serializer: undefined | function(value), deserializer: undefined | function(value),
	//   selectFrom: [{ label: "The input", value: "the_value" }]
	//   validate: undefined | function(value) { return value === "validated" },
	//   required: true
	//   all remaining input parameters
	// }]

	const isRequired = function (maybeRequired) {
		return maybeRequired === undefined ? true : maybeRequired;
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
				isRequired(row['required'])
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
			const defaultValue = row['value'] !== undefined ? serializer(row['value']) : ''
			rv[row['key']] = {
				type: row['type'] !== undefined ? row['type'] : 'text',
				defaultValue: defaultValue,
				value: defaultValue,
				files: undefined,
				validate: row['validate'] !== undefined ? row['validate'] : defaultValidator,
				deserializer: deserializer
			};
		}
		return rv;
	};

	let formDataValues = $state(getValues(data));

	const canSubmit = function (data) {
		for (const obj of Object.values(data)) {
			const validate = obj['validate'];
			if (obj['type'] === 'file') {
				if (!validate(obj['files'])) {
					return false;
				}
			} else if (!validate(obj['value'])) {
				return false;
			}
		}
		return true;
	};

	let disabledSubmit = $derived(!canSubmit(formDataValues));

	const confirm = function () {
		const payload = {};
		for (const [key, obj] of Object.entries(formDataValues)) {
			if (obj['files'] !== undefined) {
				// File type input, need to pass files
				payload[key] = obj['files'];
			} else {
				// Others, need to pass the (deserialized) value
				const deserializedDefaultValue = obj['deserializer'](obj['defaultValue'])
				const deserializedValue = obj['deserializer'](obj['value']);
				if (deserializedValue !== '' && deserializedValue !== deserializedDefaultValue) {
					payload[key] = deserializedValue;
				}
			}
		}
		onconfirm(payload);
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
								bind:value={formDataValues[row['key']]['value']}
								{...row}
							/>
						{:else}
							<input
								id={row['key']}
								bind:files={formDataValues[row['key']]['files']}
								{...row}
								type="file"
							/>
						{/if}
					{:else}
						<select
							id={row['key']}
							bind:value={formDataValues[row['key']]['value']}
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
					{#if isRequired(row['required'])}
						&nbsp;
						<Fa
							icon={faCircle}
							class={row['type'] === 'file'
								? formDataValues[row['key']]['validate'](formDataValues[row['key']]['files'])
									? 'on'
									: 'off'
								: formDataValues[row['key']]['validate'](formDataValues[row['key']]['value'])
									? 'on'
									: 'off'}
						/>
					{/if}
				</td>
			</tr>
		{/each}
	</tbody>
</table>
<ConfirmButtons disabled={disabledSubmit} onconfirm={confirm} oncancel={oncancel} />

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
