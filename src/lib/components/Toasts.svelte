<script>
	import { flip } from 'svelte/animate';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade, fly } from 'svelte/transition';

	import { appState } from '$lib/store.svelte.ts';

	// A receipt is worth about as long as it takes to read it. Callers that know
	// better pass their own `timeOut`; a failure ignores both and stays until it
	// is dismissed, because you may well have been looking elsewhere.
	const DEFAULT_TIMEOUT = 3000;

	// Bookkeeping only, and deliberately a plain `Map` rather than a `SvelteMap`:
	// nothing in the template reads it, and the scheduling effect below both reads
	// and writes it — a reactive map would have that effect re-run on every tick
	// of its own timers.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const timers = new Map();
	let paused = false;

	const dismiss = function (id) {
		const index = appState.flashMessages.findIndex((message) => message['id'] === id);
		if (index !== -1) {
			appState.flashMessages.splice(index, 1);
		}
	};

	const start = function (id) {
		const timer = timers.get(id);
		if (!timer || timer['handle'] !== undefined) return;
		timer['startedAt'] = Date.now();
		timer['handle'] = setTimeout(() => dismiss(id), timer['remaining']);
	};

	// Hovering or tabbing into a toast is someone reading it. Stop the clock on
	// the whole stack, not just the one under the pointer: they are read together.
	const pause = function () {
		if (paused) return;
		paused = true;
		for (const timer of timers.values()) {
			if (timer['handle'] === undefined) continue;
			clearTimeout(timer['handle']);
			timer['handle'] = undefined;
			timer['remaining'] -= Date.now() - timer['startedAt'];
		}
	};

	const resume = function () {
		if (!paused) return;
		paused = false;
		for (const id of timers.keys()) {
			start(id);
		}
	};

	$effect(() => {
		const messages = appState.flashMessages;
		// Adopt the ones that arrived...
		for (const message of messages) {
			if (message['tone'] === 'bad') continue;
			if (timers.has(message['id'])) continue;
			timers.set(message['id'], {
				handle: undefined,
				remaining: message['timeOut'] ?? DEFAULT_TIMEOUT,
				startedAt: 0
			});
			if (!paused) start(message['id']);
		}
		// ...and forget the ones that left, however they left.
		for (const [id, timer] of timers) {
			if (messages.some((message) => message['id'] === id)) continue;
			clearTimeout(timer['handle']);
			timers.delete(id);
		}

		return () => {
			for (const timer of timers.values()) {
				clearTimeout(timer['handle']);
			}
		};
	});

	// Colour is never the only channel: the state is a word before it is a rail.
	const kickerFor = function (message) {
		return message['title'] || (message['tone'] === 'bad' ? 'Failed' : 'Done');
	};

	const duration = function (ms) {
		return prefersReducedMotion.current ? 0 : ms;
	};
</script>

<div class="toasts" aria-live="polite" aria-atomic="false">
	{#each appState.flashMessages as message (message['id'])}
		{@const failed = message['tone'] === 'bad'}
		<div
			class="toast"
			class:failed
			role={failed ? 'alert' : undefined}
			onmouseenter={pause}
			onmouseleave={resume}
			onfocusin={pause}
			onfocusout={resume}
			animate:flip={{ duration: duration(200) }}
			in:fly={{ y: 8, duration: duration(160) }}
			out:fade={{ duration: duration(120) }}
		>
			<div class="head">
				<span class="kicker">{kickerFor(message)}</span>
				<button
					class="close"
					type="button"
					onclick={() => dismiss(message['id'])}
					aria-label="Dismiss"
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						aria-hidden="true"
					>
						<path d="M18 6 6 18M6 6l12 12" />
					</svg>
				</button>
			</div>
			<p class="message">{message['message']}</p>
		</div>
	{/each}
</div>

<style>
	/* Sits at the top of `(core)/+layout.svelte`'s fixed bottom stack, so it
	   clears the two banners by being before them in the flow rather than by
	   knowing their heights. */
	.toasts {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		gap: 8px;
		width: min(320px, calc(100vw - 32px));
		margin: 0 16px 16px auto;
		max-height: calc(100vh - 140px);
		/* The newest toast is the one nearest the corner, so a burst overflows
		   upwards and the oldest is what gets clipped. */
		overflow: hidden;
		/* The gaps between toasts are not part of the toasts. */
		pointer-events: none;
	}

	.toast {
		pointer-events: auto;
		box-sizing: border-box; /* the app sets no global `box-sizing` */
		width: 100%;
		background: var(--surface);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--sheet-shadow);
		padding: 10px 12px 12px;
	}

	/* Rails, not boxes: the rail is present only when the toast carries
	   something. A routine receipt carries nothing, so it stays uncoloured —
	   `--good-green` is for operational status, not for "your click arrived". */
	.toast.failed {
		border-left: 3px solid var(--critical-red);
	}

	.head {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.kicker {
		flex: 1;
		min-width: 0;
		font-size: 0.6rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-faint);
	}

	.toast.failed .kicker {
		color: var(--critical-red);
	}

	.close {
		flex: none;
		width: 22px;
		height: 22px;
		margin: -3px -4px 0 0;
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

	.close:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 2px;
	}

	.close svg {
		width: 13px;
		height: 13px;
	}

	.message {
		margin: 3px 0 0;
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--text-dim-solid);
	}
</style>
