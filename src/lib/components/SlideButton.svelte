<script>
	let {
		disabled = false,
		id = 'primary',
		checked = $bindable(true),
		ontoggle = (checked) => {}
	} = $props();

	const label = id + 'Button';

	const toggle = function (event) {
		const target = event.target;
		const state = target.getAttribute('aria-checked');
		checked = state !== 'true';
		ontoggle(checked);
	};
</script>

<div class="slider">
	<button
		role="switch"
		{disabled}
		aria-checked={checked}
		aria-labelledby={label}
		onclick={toggle}
	></button>
</div>

<style>
	.slider {
		display: inline-flex;
		align-items: center;
		--track-off: var(--border-strong);
		--track-on: var(--good-green);
		--knob: #ffffff;
	}

	/* a white knob would glare on the dark surfaces */
	:global(:root[data-theme='dark']) .slider {
		--knob: #d7e0ee;
	}

	.slider button {
		position: relative;
		width: 38px;
		height: 20px;
		flex: none;
		padding: 0;
		border: none;
		border-radius: 10px;
		background: var(--track-off);
		cursor: pointer;
		transition: background-color 160ms ease;
	}

	.slider button::before {
		content: '';
		position: absolute;
		top: 3px;
		left: 3px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--knob);
		box-shadow: 0 1px 2px #16202e40;
		transition: transform 160ms ease;
	}

	.slider button[aria-checked='true'] {
		background: var(--track-on);
	}

	.slider button[aria-checked='true']::before {
		transform: translateX(18px);
	}

	.slider button:hover:not(:disabled) {
		background: color-mix(in srgb, var(--track-off) 82%, var(--text));
	}

	.slider button[aria-checked='true']:hover:not(:disabled) {
		background: color-mix(in srgb, var(--track-on) 88%, var(--text));
	}

	.slider button:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 2px;
	}

	.slider button:disabled {
		cursor: default;
		opacity: 0.5;
	}
</style>
