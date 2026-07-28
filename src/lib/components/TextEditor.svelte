<script>
	// A writing desk: the source on the left, its rendering on the right, and the
	// actions on a bar of their own.
	//
	// The preview HTML is rendered by the caller (`rendered`): the wiki's markdown
	// goes through a renderer that resolves its own `!picture:slug!` codes, and
	// that knowledge belongs to the page, not here.
	let {
		value = $bindable(''),
		rendered = '',
		saveLabel = 'Save changes',
		// Height of the two panes. A viewport unit keeps the actions bar in sight.
		height = 'min(60vh, 540px)',
		onsave = () => {},
		oncancel = () => {},
		/* snippets */
		tools // extra buttons, on the left of the actions bar
	} = $props();

	// Captured at creation: the component is mounted when editing starts, so this
	// is the text as it was opened. What is unchanged cannot be saved, and saying
	// so is what the state line is for.
	const openedWith = value;
	let dirty = $derived(value !== openedWith);

	// Narrow layouts show one pane at a time — two stacked scrollers is two
	// half-views of the same text.
	let pane = $state('source');

	const handleKeydown = function (event) {
		if ((event.ctrlKey || event.metaKey) && event.key === 's') {
			event.preventDefault();
			if (dirty) onsave();
		}
	};
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="desk" style="--pane-height: {height}">
	<div class="tabs">
		<button
			class="tab"
			class:on={pane === 'source'}
			type="button"
			aria-pressed={pane === 'source'}
			onclick={() => (pane = 'source')}
		>
			Write
		</button>
		<button
			class="tab"
			class:on={pane === 'preview'}
			type="button"
			aria-pressed={pane === 'preview'}
			onclick={() => (pane = 'preview')}
		>
			Preview
		</button>
	</div>

	<div class="panes" data-pane={pane}>
		<section class="pane source">
			<header class="pane-head">
				<span class="kicker">Source</span>
				<span class="note">Markdown</span>
			</header>
			<textarea bind:value spellcheck="false" aria-label="Source text"></textarea>
		</section>

		<section class="pane preview">
			<header class="pane-head">
				<span class="kicker">Preview</span>
			</header>
			<div class="rendered prose">
				{#if rendered}
					{@html rendered}
				{:else}
					<p class="empty">Nothing to preview yet.</p>
				{/if}
			</div>
		</section>
	</div>

	<div class="actions">
		{#if tools}
			<div class="tools">{@render tools()}</div>
		{/if}
		<span class="state" class:dirty>{dirty ? 'Unsaved changes' : 'No change yet'}</span>
		<button class="button" type="button" onclick={oncancel}>Cancel</button>
		<button class="button save" type="button" disabled={!dirty} onclick={onsave}>
			{saveLabel}
		</button>
	</div>
</div>

<style>
	.desk {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		overflow: hidden;
		margin-bottom: 1.5rem;
		/* the one-pane form below keys off this card's width, not the viewport */
		container-type: inline-size;
	}

	.panes {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
	}

	.pane {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.pane + .pane {
		border-left: 1px solid var(--border);
	}

	.pane-head {
		display: flex;
		align-items: baseline;
		gap: 10px;
		padding: 11px 14px 9px;
		border-bottom: 1px solid var(--border-strong);
	}

	.kicker {
		font-family: 'Raleway', sans-serif;
		font-size: 0.64rem;
		font-weight: 700;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: var(--text-dim-solid);
	}

	.note {
		font-size: 0.68rem;
		color: var(--text-faint);
	}

	textarea {
		/* The source is code, not prose: a monospace keeps markdown's own
		   alignment (tables, lists, indented blocks) legible. */
		font-family: ui-monospace, 'Cascadia Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
		font-size: 0.8rem;
		line-height: 1.65;
		tab-size: 2;
		box-sizing: border-box;
		width: 100%;
		height: var(--pane-height);
		padding: 14px;
		resize: none;
		border: 0;
		background: var(--surface);
		color: var(--text);
	}

	textarea:focus {
		outline: 2px solid var(--grow-soft);
		outline-offset: -2px;
	}

	.rendered {
		height: var(--pane-height);
		padding: 14px;
		overflow-y: auto;
	}

	.empty {
		font-family: 'Raleway', sans-serif;
		font-size: 0.8rem;
		color: var(--text-faint);
	}

	/* Secondary region of the card: --surface-2 behind a hairline, never a second
	   border. Same bar as ConfirmButtons', but this one never leaves the card. */
	.actions {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 11px 14px;
		border-top: 1px solid var(--border);
		background: var(--surface-2);
	}

	.tools {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	/* The caller's own buttons wear the bar's button, so a tool never has to
	   restate this styling on the page. */
	.tools :global(button) {
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
	}

	.tools :global(button:hover) {
		border-color: var(--border-strong);
		color: var(--text);
	}

	.state {
		flex: 1;
		min-width: 0;
		text-align: right;
		font-size: 0.72rem;
		color: var(--text-faint);
	}

	.state.dirty {
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
		transition:
			color 120ms ease,
			border-color 120ms ease,
			background 120ms ease;
	}

	.button:hover {
		border-color: var(--border-strong);
		color: var(--text);
	}

	.save {
		background: var(--text);
		border-color: var(--text);
		color: var(--surface);
	}

	.save:hover {
		background: var(--text-dim-solid);
		border-color: var(--text-dim-solid);
		color: var(--surface);
	}

	.button:disabled {
		background: var(--surface-2);
		border-color: var(--border);
		color: var(--text-faint);
		cursor: not-allowed;
	}

	.tabs {
		display: none;
	}

	/* One pane at a time once the card itself is narrow — a container query, so a
	   desk in a narrow column folds on a wide screen too. */
	@container (max-width: 700px) {
		.tabs {
			display: flex;
			gap: 4px;
			padding: 9px 10px;
			border-bottom: 1px solid var(--border);
		}

		.tab {
			font-family: 'Raleway', sans-serif;
			font-size: 0.64rem;
			font-weight: 700;
			letter-spacing: 0.13em;
			text-transform: uppercase;
			padding: 6px 12px;
			border: 1px solid transparent;
			border-radius: var(--radius);
			background: transparent;
			color: var(--text-faint);
			cursor: pointer;
		}

		.tab.on {
			border-color: var(--border);
			background: var(--surface);
			color: var(--text);
		}

		.panes {
			grid-template-columns: minmax(0, 1fr);
		}

		.pane,
		.pane-head {
			display: none;
		}

		.panes[data-pane='source'] .source,
		.panes[data-pane='preview'] .preview {
			display: flex;
		}

		.pane + .pane {
			border-left: 0;
		}
	}

	@container (max-width: 420px) {
		.actions {
			flex-wrap: wrap;
		}

		.state {
			flex-basis: 100%;
			text-align: left;
		}

		.button {
			flex: 1;
		}
	}
</style>
