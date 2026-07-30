<script>
	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';

	import { isEmpty, isObject } from '$lib/utils/functions.js';

	let {
		data,
		confirmLabel = 'Confirm',
		danger = false,
		showCancel = true,
		onchange = undefined, // Reports the live values, for a caller that reacts as you type
		onconfirm = (payload) => {},
		oncancel = () => {}
	} = $props();
	// [{
	//   label: "The input", key: "the_input", value: "the value"
	//   serializer: undefined | function(value), deserializer: undefined | function(value),
	//   selectFrom: [{ label: "The input", value: "the_value" }]
	//   validate: undefined | function(value, values) { return value === values["other"] },
	//   required: true
	//   hint: "Rendered under the input"
	//   hintTone: "--critical-red"  // a hint that reports on the value, not on the field
	//   note: "From invitation"  // chip beside the label, says why the field is as it is
	//   group: "Runs"  // consecutive rows sharing it are laid out together
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
			const type = row['type'] !== undefined ? row['type'] : 'text';
			// A checkbox is never "missing", so it defaults to false rather than ''
			const emptyValue = type === 'checkbox' ? false : '';
			const originalValue = row['value'] !== undefined ? serializer(row['value']) : emptyValue
			rv[row['key']] = {
				type: type,
				label: row['label'] || row['key'],
				originalValue: originalValue,
				value: originalValue,
				files: undefined,
				// A field is only shown as wrong once it has been left wrong
				touched: false,
				validate: row['validate'] !== undefined ? row['validate'] : defaultValidator,
				deserializer: deserializer
			};
		}
		return rv;
	};

	// Consecutive rows sharing a 'group' are rendered together under its legend
	const groupRows = function (data) {
		const rv = [];
		for (const row of data) {
			const previous = rv[rv.length - 1];
			if (row['group'] && previous && previous['group'] === row['group']) {
				previous['rows'].push(row);
			} else {
				rv.push({ group: row['group'], rows: [row] });
			}
		}
		return rv;
	};

	let formDataValues = $state(getValues(data));
	let groupedData = $derived(groupRows(data));

	// The live value of every field, so that a validator can check its own value
	// against another one (eg. a password and its repeat).
	let values = $derived(
		Object.fromEntries(
			Object.entries(formDataValues).map(([key, obj]) => [
				key,
				obj['type'] === 'file' ? obj['files'] : obj['value']
			])
		)
	);

	$effect(() => {
		onchange?.(values);
	});

	const isValid = function (obj, values) {
		const validate = obj['validate'];
		if (obj['type'] === 'file') {
			return validate(obj['files'], values);
		}
		return validate(obj['value'], values);
	};

	let missingFields = $derived(
		Object.values(formDataValues)
			.filter((obj) => !isValid(obj, values))
			.map((obj) => obj['label'])
	);

	const confirm = function () {
		const payload = {};
		for (const [key, obj] of Object.entries(formDataValues)) {
			if (obj['files'] !== undefined) {
				// File type input, need to pass files
				payload[key] = obj['files'];
			} else {
				// Others, need to pass the (deserialized) value
				const deserializedOriginalValue = obj['deserializer'](obj['originalValue'])
				const deserializedValue = obj['deserializer'](obj['value']);
				if (deserializedValue !== '' && deserializedValue !== deserializedOriginalValue) {
					payload[key] = deserializedValue;
				}
			}
		}
		onconfirm(payload);
	};
</script>

{#snippet field(row)}
	{@const { label, key, value, serializer, deserializer, selectFrom, validate, required, hint, hintTone, note, group, ...inputAttrs } = row}
	{@const invalid = formDataValues[key]['touched'] && !isValid(formDataValues[key], values)}
	<div class="field" class:inline={row['type'] === 'checkbox'}>
		{#if row['type'] === 'checkbox'}
			<!-- A checkbox reads as its own sentence, so it keeps its label beside it
			     rather than under a kicker. -->
			<input
				id={key}
				type="checkbox"
				bind:checked={formDataValues[key]['value']}
				{...inputAttrs}
			/>
			<label class="check" for={key}>{label || key}</label>
		{:else}
			<label class="label" for={key}>
				{label || key}
				{#if note}
					<em class="note">{note}</em>
				{:else if !isRequired(required)}
					<em class="optional">Optional</em>
				{/if}
			</label>
			{#if isEmpty(selectFrom)}
				{#if row['type'] === 'file'}
					<input
						id={key}
						bind:files={formDataValues[key]['files']}
						onblur={() => (formDataValues[key]['touched'] = true)}
						aria-invalid={invalid}
						{...inputAttrs}
						type="file"
					/>
				{:else if row['type'] === 'textarea'}
					<textarea
						id={key}
						bind:value={formDataValues[key]['value']}
						onblur={() => (formDataValues[key]['touched'] = true)}
						aria-invalid={invalid}
						{...inputAttrs}
					></textarea>
				{:else}
					<input
						id={key}
						bind:value={formDataValues[key]['value']}
						onblur={() => (formDataValues[key]['touched'] = true)}
						aria-invalid={invalid}
						{...inputAttrs}
					/>
				{/if}
			{:else}
				<select
					id={key}
					bind:value={formDataValues[key]['value']}
					onblur={() => (formDataValues[key]['touched'] = true)}
					aria-invalid={invalid}
					{...inputAttrs}
				>
					{#if !value}
						<option disabled value="">Select one</option>
					{/if}
					{#each selectFrom as choice (choice)}
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
		{/if}
		{#if hint}
			<p class="hint" style={hintTone ? `--hint-tone: var(${hintTone})` : undefined}>{hint}</p>
		{/if}
	</div>
{/snippet}

<!-- A real <form>, so that Enter submits and password managers recognise it.
     Validation is ours, hence `novalidate`: the native bubbles would contradict
     the touched state and the "Still needed" hint. -->
<form
	novalidate
	onsubmit={(event) => {
		event.preventDefault();
		if (missingFields.length === 0) {
			confirm();
		}
	}}
>
	<div class="fields">
		{#each groupedData as block (block['rows'][0]['key'])}
			{#if block['group']}
				<div class="group">
					<span class="legend">{block['group']}</span>
					{#each block['rows'] as row (`group-${row['key']}`)}
						{@render field(row)}
					{/each}
				</div>
			{:else}
				{@render field(block['rows'][0])}
			{/if}
		{/each}
	</div>

	<ConfirmButtons
		disabled={missingFields.length > 0}
		hint={missingFields.length ? `Still needed: ${missingFields.join(', ')}.` : undefined}
		{confirmLabel}
		{danger}
		{showCancel}
		submit
		onconfirm={confirm}
		{oncancel}
	/>
</form>

<style>
	form {
		margin: 0;
	}

	/* minmax(0, …) everywhere: a date input's intrinsic width would otherwise
	   grow the column and push the whole form past the edge of the sheet. */
	.fields {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 13px;
	}

	.field {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 5px;
		min-width: 0;
	}

	.label {
		display: flex;
		align-items: baseline;
		gap: 8px;
		font-size: 0.6rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-dim-solid);
	}

	.optional,
	.note {
		font-size: 0.56rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		font-style: normal;
		color: var(--text-faint);
	}

	/* Says *why* a field is not yours to fill, so that a disabled input is not
	   left explaining itself in colour alone. */
	.note {
		text-transform: none;
		letter-spacing: 0.04em;
		font-size: 0.6rem;
	}

	/* A checkbox is a sentence, not a labelled value: label beside, no kicker. */
	.field.inline {
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 9px;
	}

	.field.inline input {
		width: 15px;
		height: 15px;
		padding: 0;
		margin: 0;
		accent-color: var(--grow);
	}

	.check {
		font-family: 'Raleway', sans-serif;
		font-size: 0.78rem;
		color: var(--text-dim-solid);
		cursor: pointer;
	}

	input,
	select,
	textarea {
		font-family: 'Open Sans', sans-serif;
		font-size: 0.82rem;
		font-variant-numeric: tabular-nums;
		box-sizing: border-box;
		width: 100%;
		padding: 8px 10px;
		color: var(--text);
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	textarea {
		resize: vertical;
		min-height: 54px;
		line-height: 1.5;
	}

	input:hover,
	select:hover,
	textarea:hover {
		border-color: var(--border-strong);
	}

	input:focus,
	select:focus,
	textarea:focus {
		background: var(--surface);
		border-color: var(--grow);
		outline: none;
		box-shadow: 0 0 0 3px var(--grow-soft);
	}

	input[aria-invalid='true'],
	select[aria-invalid='true'],
	textarea[aria-invalid='true'] {
		border-color: var(--critical-red);
	}

	input:disabled,
	select:disabled,
	textarea:disabled {
		background: var(--bg);
		color: var(--text-faint);
		border-style: dashed;
		cursor: default;
	}

	input[type='file'] {
		padding: 6px 8px;
		color: var(--text-dim-solid);
	}

	input[type='file']::file-selector-button {
		font-family: 'Raleway', sans-serif;
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		margin-right: 10px;
		padding: 5px 10px;
		color: var(--text-dim-solid);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		cursor: pointer;
	}

	/* Grouped rows: one legend, side by side while there is room */
	.group {
		display: grid;
		gap: 10px;
		/* 170px is what a datetime field needs to stay readable: below that the
		   group folds to one column rather than clipping its own values. */
		grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		min-width: 0;
		padding: 11px 12px 12px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.group .legend {
		grid-column: 1 / -1;
		font-size: 0.6rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-dim-solid);
	}

	.group .label {
		color: var(--text-faint);
	}

	/* A hint explains the field and stays quiet; a toned one reports on the value
	   that was entered, so it takes the ramp token the caller gives it. */
	.hint {
		font-size: 0.72rem;
		line-height: 1.35;
		color: var(--hint-tone, var(--text-faint));
	}
</style>
