<script>
	let {
		showModal = false,
		timeOut = undefined,
		intent = undefined, // A custom property name (eg. '--critical-red'), painted as the sheet's left rail
		bleed = false,
		width = undefined,
		onclose = () => {},
		/* snippets */
		kicker,
		title,
		children
	} = $props();

	let dialog = $state(); // HTMLDialogElement
	let timeout;

	let style = $derived(
		[intent ? `--intent: var(${intent})` : '', width ? `--sheet-width: ${width}` : '']
			.filter(Boolean)
			.join('; ') || undefined
	);

	$effect(() => {
		if (!dialog) return;
		if (showModal) {
			displayModal();
		} else if (dialog.open) {
			closeModal();
		}
	});

	const displayModal = function () {
		dialog.showModal();
		// Browsers focus the close button, ie. the way out. Prefer the first
		// field, or the first button that is not the close one.
		const entry = dialog.querySelector(
			'input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
		);
		if (entry) entry.focus();
		if (timeOut) {
			timeout = setTimeout(() => closeModal(), timeOut);
		}
	};

	const closeModal = function () {
		if (timeout) clearTimeout(timeout);
		dialog.close();
	};
</script>

<dialog
	bind:this={dialog}
	class:bleed
	{style}
	onclose={() => {
		showModal = false;
		onclose();
	}}
	onclick={(e) => {
		if (e.target === dialog) closeModal();
	}}
>
	{#if showModal}
		<div class="head">
			<div class="titles">
				{#if kicker}
					<div class="kicker">{@render kicker()}</div>
				{/if}
				{#if title}
					<h2 class="title">{@render title()}</h2>
				{/if}
			</div>
			<button class="close" type="button" onclick={closeModal} aria-label="Close">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
					<path d="M18 6 6 18M6 6l12 12" />
				</svg>
			</button>
		</div>
		<div class="body">
			{@render children?.(closeModal)}
		</div>
	{/if}
</dialog>

<style>
	dialog {
		margin: auto;
		width: var(--sheet-width, min(460px, calc(100vw - 28px)));
		max-width: 90vw;
		max-height: min(86vh, 760px);
		padding: 0;
		background: var(--surface);
		color: var(--text);
		border: 1px solid var(--border);
		border-left: 3px solid var(--intent, var(--border-strong));
		border-radius: var(--radius);
		box-shadow: var(--sheet-shadow);
		overflow: hidden;
	}

	dialog[open] {
		display: flex;
		flex-direction: column;
		animation: sheet-in 150ms cubic-bezier(0.2, 0.7, 0.3, 1);
	}

	@keyframes sheet-in {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.985);
		}
	}

	dialog::backdrop {
		background: var(--scrim);
	}

	.head {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 15px 16px 13px;
		border-bottom: 1px solid var(--border);
	}

	.titles {
		flex: 1;
		min-width: 0;
	}

	.kicker {
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: 0.6rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--intent, var(--text-faint));
	}

	.title {
		font-family: 'EB Garamond', Garamond, Georgia, serif;
		font-size: 1.375rem;
		font-weight: 600;
		line-height: 1.15;
		margin: 4px 0 0;
		color: var(--text);
		text-wrap: balance;
	}

	.close {
		flex: none;
		width: 28px;
		height: 28px;
		margin: -2px -3px 0 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius);
		color: var(--text-faint);
		cursor: pointer;
	}

	.close:hover {
		border-color: var(--border);
		color: var(--text);
	}

	.close svg {
		width: 15px;
		height: 15px;
	}

	.body {
		/* Read by children that need to bleed out of it, eg. Form's action bar */
		--sheet-padding: 16px;
		padding: var(--sheet-padding);
		overflow-y: auto;
	}

	dialog.bleed .body {
		--sheet-padding: 0px;
	}

	@media (max-width: 560px) {
		dialog {
			width: 100%;
			max-width: 100%;
			max-height: 88vh;
			margin: auto auto 0;
			border-radius: 10px 10px 0 0;
			border-left: 1px solid var(--border);
			border-top: 3px solid var(--intent, var(--border-strong));
		}

		dialog[open] {
			animation-name: sheet-up;
		}

		@keyframes sheet-up {
			from {
				opacity: 0;
				transform: translateY(8px);
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		dialog[open] {
			animation: none;
		}
	}
</style>
