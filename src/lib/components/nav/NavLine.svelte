<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	import { isCurrentView, locate } from '$lib/components/nav/functions.js';

	// The app's navigation: one line under the header carrying the views you can
	// reach from where you are, and one door — "Go to" — opening every place in
	// the install on a single screen. See `generateNavigation()` for the model.
	let { siteViews = [], groups = [] } = $props();

	const TONES = {
		good: 'var(--good-green)',
		critical: 'var(--critical-red)',
		neutral: 'var(--text-dim-solid)'
	};

	let open = $state(false);
	let root = $state(null);

	const pathname = $derived(page.url.pathname);
	const here = $derived(locate(pathname, { groups: groups }));
	const place = $derived(here['place']);

	// Nothing to open means no door: an install with no ecosystems, no servers
	// and no wiki has no places, and a button onto an empty sheet is worse than
	// no button.
	const hasPlaces = $derived(groups.some((group) => group['places'].length > 0));

	// Switching place from a place's *name* keeps you on the same kind of view
	// when the new place has one. When it does not, it falls back to that place's
	// last view (its settings, in practice) and the link says so in its accessible name.
	const destination = function (target) {
		if (target['views'].length === 0) {
			return { path: target['base'], name: null };
		}
		const kept = here['viewId'] ? target['views'].find((v) => v['id'] === here['viewId']) : null;
		const view = kept || target['views'][target['views'].length - 1];
		return { path: view['path'], name: kept ? null : view['name'] };
	};

	// The sheet is a disclosure, not a modal. It closes when you leave, when
	// you press Escape and when you click away from it.
	$effect(() => {
		// Depend on the path, and only on the path: arriving anywhere closes it.
		void pathname;
		open = false;
	});

	// A scroller that opens on its first item hides which view you are on as soon
	// as there are more views than fit.
	const reveal = function (node) {
		const run = function () {
			requestAnimationFrame(() => {
				const current = node.querySelector('[aria-current="page"]');
				if (!current) {
					return;
				}
				const overflow = current.offsetLeft + current.offsetWidth - node.clientWidth;
				node.scrollLeft = overflow > 0 ? overflow + 12 : 0;
			});
		};
		run();
		return { update: run };
	};

	const onWindowClick = function (event) {
		if (open && root && !root.contains(event.target)) {
			open = false;
		}
	};

	const onWindowKeydown = function (event) {
		if (open && event.key === 'Escape') {
			open = false;
		}
	};
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

{#snippet views(list)}
	<div class="views" use:reveal={pathname}>
		{#each list as view (view['id'])}
			<a
				class="view"
				href={resolve(view['path'])}
				aria-current={isCurrentView(pathname, view) ? 'page' : undefined}
			>
				{view['name']}
			</a>
		{/each}
	</div>
{/snippet}

{#snippet chip(label, href, current, describedBy)}
	<a
		class="chip"
		href={resolve(href)}
		aria-current={current ? 'page' : undefined}
		aria-label={describedBy}
	>
		{label}
	</a>
{/snippet}

<div class="nav-root" bind:this={root}>
	<nav class="navline" class:has-place={!!place} aria-label="Site">
		<div class="grp grp-site">
			{@render views(siteViews)}
		</div>

		{#if place}
			<div class="grp grp-place">
				<button
					type="button"
					class="scope"
					style="--tone: {place['status'] ? TONES[place['status']['tone']] : 'var(--text-faint)'}"
					aria-expanded={open}
					aria-controls="nav-sheet"
					onclick={() => (open = !open)}
				>
					<span class="dot" aria-hidden="true"></span>
					{place['name']}
					<span class="caret" aria-hidden="true">&#9662;</span>
				</button>
				{@render views(place['views'])}
			</div>
		{/if}

		{#if hasPlaces}
			<button
				type="button"
				class="door"
				aria-expanded={open}
				aria-controls="nav-sheet"
				onclick={() => (open = !open)}
			>
				<span class="txt">Go to</span>
				<span class="caret" aria-hidden="true">&#9662;</span>
			</button>
		{/if}
	</nav>

	{#if hasPlaces}
		<div class="sheet" id="nav-sheet" hidden={!open}>
			<div class="sheet-body">
				<section class="sect">
					<p class="kicker">Site</p>
					<div class="chiprow">
						{#each siteViews as view (view['id'])}
							{@render chip(view['name'], view['path'], isCurrentView(pathname, view))}
						{/each}
					</div>
				</section>

				{#each groups as group (group['id'])}
					{@const rows = group['places'].filter((p) => p['views'].length > 0)}
					{@const flats = group['places'].filter((p) => p['views'].length === 0)}
					<section class="sect">
						<p class="kicker">{group['label']}</p>

						{#if group['lead']}
							<div class="chiprow lead">
								{@render chip(
									group['lead']['name'],
									group['lead']['path'],
									isCurrentView(pathname, group['lead'])
								)}
							</div>
						{/if}

						{#each rows as row (row['id'])}
							{@const to = destination(row)}
							<div
								class="place"
								style="--tone: {row['status']
									? TONES[row['status']['tone']]
									: 'var(--border-strong)'}"
							>
								<a
									class="nm"
									class:mono={row['mono']}
									href={resolve(to['path'])}
									aria-label={to['name'] ? `${row['name']} — open ${to['name']}` : undefined}
								>
									{row['name']}
								</a>
								{#if row['status']}
									<span class="pill">
										<span class="dot" aria-hidden="true"></span>
										{row['status']['word']}
									</span>
								{/if}
								<div class="chiprow">
									{#each row['views'] as view (view['id'])}
										{@render chip(view['name'], view['path'], pathname === view['path'])}
									{/each}
								</div>
							</div>
						{/each}

						{#if flats.length > 0}
							<div class="chiprow">
								{#each flats as flat (flat['id'])}
									{@render chip(flat['name'], flat['base'], pathname.startsWith(flat['base']))}
								{/each}
							</div>
						{/if}
					</section>
				{/each}
			</div>

			<div class="sheet-foot">
				<a href={resolve('/about')}>About Ouranos</a>
				<span class="said">Every place in this install</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.nav-root {
		position: relative;
		margin-bottom: clamp(20px, 3vw, 30px);
	}

	/* One row, always: the groups shrink and their views scroll rather than
	   wrapping, because a wrapped group would start a row with the separating
	   hairline hanging off its left edge. */
	.navline {
		display: flex;
		align-items: stretch;
		flex-wrap: nowrap;
		gap: 0 14px;
		border-bottom: 1px solid var(--border);
	}

	.grp {
		display: flex;
		align-items: center;
		min-width: 0;
	}

	/* A second group is a different scope, and the hairline is what says so. */
	.grp + .grp {
		border-left: 1px solid var(--border);
		padding-left: 14px;
	}

	.grp-site {
		flex: 0 3 auto;
	}

	.grp-place {
		flex: 0 1 auto;
	}

	.views {
		display: flex;
		align-items: stretch;
		min-width: 0;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.views::-webkit-scrollbar {
		display: none;
	}

	/* The current view is the ink itself, not `--grow`: the accent means "light
	   is on" and nothing else (DESIGN.md §4). */
	.view {
		display: inline-flex;
		align-items: center;
		white-space: nowrap;
		padding: 11px 12px;
		margin-bottom: -1px;
		font-family: 'Raleway', sans-serif;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-dim-solid);
		text-decoration: none;
		border-bottom: 2px solid transparent;
	}

	.view:hover {
		color: var(--text);
	}

	.view[aria-current='page'] {
		color: var(--text);
		font-weight: 700;
		border-bottom-color: var(--text);
	}

	.view:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: -3px;
	}

	/* Where you are. The same pill as the account chip at the other end of the
	   chrome: one says who you are, this one says where. */
	.scope {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		flex: none;
		margin: 5px 12px 5px 0;
		padding: 5px 10px 5px 8px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		box-shadow: var(--shadow);
		font-family: 'Raleway', sans-serif;
		font-size: 13px;
		font-weight: 700;
		color: var(--text);
		white-space: nowrap;
		cursor: pointer;
	}

	.scope:hover {
		border-color: var(--border-strong);
	}

	.scope:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 2px;
	}

	.caret {
		font-size: 9px;
		color: var(--text-dim-solid);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex: none;
		background: var(--tone);
	}

	.door {
		margin-left: auto;
		align-self: center;
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 7px 13px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: var(--shadow);
		font-family: 'Raleway', sans-serif;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-dim-solid);
		white-space: nowrap;
		cursor: pointer;
	}

	.door:hover {
		color: var(--text);
		border-color: var(--text-dim-solid);
	}

	.door:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 2px;
	}

	/* ---- The sheet ------------------------------------------------------
	   Every place in the install on one screen. A row carries exactly the views
	   its place has, so the width of a row is a hardware census. */
	.sheet {
		position: absolute;
		z-index: 60;
		right: 0;
		top: calc(100% + 3px);
		width: min(760px, 100%);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--sheet-shadow);
		overflow: hidden;
	}

	.sheet-body {
		padding: 16px 18px 8px;
		max-height: 66vh;
		overflow-y: auto;
	}

	.sect + .sect {
		margin-top: 18px;
		padding-top: 16px;
		border-top: 1px solid var(--border);
	}

	.kicker {
		margin: 0 0 9px;
		font-family: 'Raleway', sans-serif;
		font-size: 0.64rem;
		font-weight: 700;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: var(--text-dim-solid);
	}

	.chiprow {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.chiprow.lead {
		margin-bottom: 8px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		padding: 5px 10px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		font-family: 'Raleway', sans-serif;
		font-size: 12.5px;
		font-weight: 600;
		color: var(--text-dim-solid);
		text-decoration: none;
		white-space: nowrap;
	}

	.chip:hover {
		color: var(--text);
		border-color: var(--border-strong);
		background: var(--surface-2);
	}

	.chip:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 2px;
	}

	.chip[aria-current='page'] {
		color: var(--text);
		font-weight: 700;
		border-color: var(--text-dim-solid);
	}

	.place {
		position: relative;
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 4px 12px;
		padding: 9px 2px 11px 13px;
	}

	.place + .place {
		border-top: 1px solid var(--border);
	}

	/* Rails, not boxes (§5.1) — and an absolutely positioned one, because an
	   inset shadow is painted under a child's background. */
	.place::before {
		content: '';
		position: absolute;
		left: 0;
		top: 7px;
		bottom: 7px;
		width: 3px;
		border-radius: 2px;
		background: var(--tone);
	}

	.place .nm {
		font-family: 'Raleway', sans-serif;
		font-size: 14px;
		font-weight: 700;
		color: var(--text);
		text-decoration: none;
	}

	.place .nm:hover {
		color: var(--grow);
	}

	.place .nm:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 3px;
	}

	.place .nm.mono {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 13px;
		font-weight: 600;
	}

	.place .chiprow {
		grid-column: 1 / -1;
		margin-top: 2px;
	}

	.pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 3px 9px 3px 7px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--tone) 12%, transparent);
		color: var(--tone);
		font-family: 'Raleway', sans-serif;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.pill .dot {
		width: 6px;
		height: 6px;
	}

	.sheet-foot {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 11px 18px;
		background: var(--surface-2);
		border-top: 1px solid var(--border);
	}

	.sheet-foot a {
		font-family: 'Raleway', sans-serif;
		font-size: 12px;
		font-weight: 600;
		color: var(--text-dim-solid);
		text-decoration: none;
	}

	.sheet-foot a:hover {
		color: var(--text);
	}

	.sheet-foot .said {
		margin-left: auto;
		font-family: 'Raleway', sans-serif;
		font-size: 11.5px;
		color: var(--text-faint);
	}

	/* Narrow: the site views fold into the sheet and only the views of the place
	   you are in stay on the line. A media query rather than a container query
	   (§6) for two reasons: the line is always the full width of `.wrap`, so
	   there is no narrow-column case to serve, and `container-type` would make
	   this element the containing block for the docked sheet below. */
	@media only screen and (max-width: 760px) {
		.navline.has-place .grp-site {
			display: none;
		}

		.navline.has-place .grp + .grp {
			border-left: 0;
			padding-left: 0;
		}

		.door {
			padding: 7px 10px;
		}

		.door .txt {
			display: none;
		}

		/* Sheets dock to the bottom edge on mobile, like every other one. */
		.sheet {
			position: fixed;
			inset: auto 0 0 0;
			width: 100%;
			border-radius: 10px 10px 0 0;
			border-bottom: 0;
		}

		.sheet-body {
			max-height: min(72vh, 560px);
		}
	}
</style>
