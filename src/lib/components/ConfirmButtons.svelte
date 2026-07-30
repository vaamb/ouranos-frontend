<script>
	let {
		disabled = false,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		danger = false,
		hint = undefined,
		// A form that is the whole page has nowhere to cancel to
		showCancel = true,
		submit = false,
		onconfirm = () => {},
		oncancel = () => {}
	} = $props();
</script>

<div class="actions">
	<p class="hint">{hint || ''}</p>
	{#if showCancel}
		<button class="button" type="button" onclick={oncancel}>{cancelLabel}</button>
	{/if}
	<button
		class="button confirm"
		class:danger
		type={submit ? 'submit' : 'button'}
		onclick={submit ? undefined : onconfirm}
		{disabled}
	>
		{confirmLabel}
	</button>
</div>

<style>
	.actions {
		position: sticky;
		bottom: calc(-1 * var(--sheet-padding, 0px));
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 8px;
		margin: var(--sheet-padding, 16px) calc(-1 * var(--sheet-padding, 0px))
			calc(-1 * var(--sheet-padding, 0px));
		padding: 11px 16px;
		border-top: 1px solid var(--border);
		background: var(--surface-2);
	}

	.hint {
		flex: 1;
		min-width: 0;
		font-size: 0.72rem;
		line-height: 1.35;
		color: var(--transition-orange);
	}

	.button {
		font-family: 'Raleway', sans-serif;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 8px 14px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--text-dim-solid);
		cursor: pointer;
		transition: color 120ms ease, border-color 120ms ease, background 120ms ease;
	}

	.button:hover {
		border-color: var(--border-strong);
		color: var(--text);
	}

	.confirm {
		background: var(--text);
		border-color: var(--text);
		color: var(--surface);
	}

	.confirm:hover {
		background: var(--text-dim-solid);
		border-color: var(--text-dim-solid);
		color: var(--surface);
	}

	.confirm.danger {
		background: var(--critical-red);
		border-color: var(--critical-red);
		color: #fff;
	}

	.confirm.danger:hover {
		filter: brightness(1.08);
		color: #fff;
	}

	.button:disabled {
		background: var(--surface-2);
		border-color: var(--border);
		color: var(--text-faint);
		cursor: not-allowed;
	}

	@media (max-width: 560px) {
		.actions {
			flex-wrap: wrap;
		}

		.hint {
			flex-basis: 100%;
		}

		.button {
			flex: 1;
		}
	}
</style>
