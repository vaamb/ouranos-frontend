<script>
	import { resolve } from '$app/paths';

	import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

	import HeaderItem from '$lib/components/header/HeaderItem.svelte';

	import { logOut } from '$lib/actions.svelte.js';
	import { permissions } from '$lib/utils/consts.js';
	import { appState, gaiaState } from '$lib/store.svelte.ts';

	let { children } = $props();

	const user = $derived(appState.currentUser);

	const initial = $derived((user.username?.[0] ?? '?').toUpperCase());

	const role = $derived.by(() => {
		if (user.can(permissions.ADMIN)) {
			return 'Admin';
		} else if (user.can(permissions.OPERATE)) {
			return 'Operator';
		} else if (user.can(permissions.EDIT)) {
			return 'Editor';
		}
		return 'User';
	});

	const warningsCount = $derived(gaiaState.warnings.length);

	const hasCtx = $derived(appState.headerItems.length > 0 || !!children);

	let theme = $state('light');
	$effect(() => {
		document.documentElement.dataset.theme = theme;
	});
</script>

<header class="topbar" class:has-ctx={hasCtx}>
	<a class="brand" href={resolve('/')}>
		Ouranos<small>Gaia&nbsp;control</small>
	</a>

	<!-- Contextual middle, published by the current page via `useHeaderItems()` -->
	<div class="ctx">
		{#each appState.headerItems as item (item['id'])}
			<HeaderItem {...item} />
		{/each}
		{@render children?.()}
	</div>

	<div class="core">
		{#if user.isAuthenticated && warningsCount > 0}
			<HeaderItem
				icon={faTriangleExclamation}
				value={warningsCount}
				href={resolve('/warnings')}
				tone="warn"
				description="{warningsCount} active warnings"
			/>
		{/if}

		<div class="seg" role="group" aria-label="Interface follows the greenhouse day/night cycle">
			<button type="button" aria-pressed={theme === 'light'} onclick={() => (theme = 'light')}>
				Day
			</button>
			<button type="button" aria-pressed={theme === 'dark'} onclick={() => (theme = 'dark')}>
				Night
			</button>
		</div>

		<div class="userbox">
			{#if user.isAnonymous}
				<a class="login" href={resolve('/auth/login')}>Log&nbsp;in</a>
			{:else}
				<div class="acct-wrap">
					<button type="button" class="acct" aria-haspopup="menu" aria-expanded="false">
						<span class="avatar" aria-hidden="true">{initial}</span>
						<span class="name">{user.username}</span>
						<span class="caret" aria-hidden="true">&#9662;</span>
					</button>
					<div class="menu" role="menu" aria-label="Account">
						<div class="who">
							<div class="u">{user.username}</div>
							<div class="role">{role}</div>
						</div>
						<a href={resolve(`/user/u/${user.username}/profile`)} role="menuitem">Profile</a>
						<div class="sep"></div>
						<button type="button" class="mi danger" role="menuitem" onclick={logOut}>
							Log out
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</header>

<style>
	.topbar {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 6px;
		flex-wrap: wrap;
		margin-bottom: clamp(20px, 3vw, 34px);
	}

	.brand {
		margin-right: auto;
		font-family: 'Garamond', Georgia, serif;
		font-size: 27px;
		font-weight: 600;
		letter-spacing: 0.02em;
		display: flex;
		align-items: baseline;
		gap: 10px;
		color: var(--text);
		text-decoration: none;
	}

	.topbar.has-ctx .brand {
		padding-right: 14px;
    border-right: 1px solid var(--border);
  }

	.brand small {
		font-family: 'Raleway', sans-serif;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--text-faint);
	}

	.ctx {
		display: none;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}

	.topbar.has-ctx .ctx {
		display: flex;
	}

	.core {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	/* Day/night toggle */
	.seg {
		display: inline-flex;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--surface);
	}
	.seg button {
		font-family: 'Raleway', sans-serif;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 7px 13px;
		border: 0;
		background: transparent;
		color: var(--text-dim-solid);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.seg button[aria-pressed='true'] {
		background: var(--grow);
		color: #fff;
	}
	.seg button:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: -2px;
	}

	/* User box */
	.userbox {
		position: relative;
	}

	.userbox .login {
		font-family: 'Raleway', sans-serif;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 7px 14px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--text-dim-solid);
		box-shadow: var(--shadow);
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 7px;
		cursor: pointer;
	}
	.userbox .login:hover {
		color: var(--grow);
		border-color: var(--grow);
	}
	.userbox .login:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 2px;
	}

	.acct-wrap {
		position: relative;
	}
	.acct {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		padding: 5px 11px 5px 6px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		box-shadow: var(--shadow);
		cursor: pointer;
		font-family: 'Raleway', sans-serif;
	}
	.acct:hover {
		border-color: var(--border-strong);
	}
	.acct:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 2px;
	}
	.avatar {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--text-dim-solid);
		color: var(--surface);
		font-weight: 700;
		font-size: 12px;
		letter-spacing: 0.01em;
	}
	.acct .name {
		font-size: 13px;
		font-weight: 600;
		color: var(--text);
	}
	.acct .caret {
		font-size: 10px;
		color: var(--text-dim-solid);
		margin-left: -2px;
	}

	.userbox .menu {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		min-width: 212px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		box-shadow: var(--shadow);
		padding: 6px;
		z-index: 40;
		opacity: 0;
		visibility: hidden;
		transform: translateY(-4px);
		transition:
			opacity 0.14s ease,
			transform 0.14s ease,
			visibility 0.14s;
	}
	.userbox:hover .menu,
	.userbox:focus-within .menu {
		opacity: 1;
		visibility: visible;
		transform: none;
	}
	.menu .who {
		padding: 8px 10px 10px;
		border-bottom: 1px solid var(--border);
		margin-bottom: 6px;
	}
	.menu .who .u {
		font-family: 'Raleway', sans-serif;
		font-weight: 700;
		color: var(--text);
	}
	.menu .who .role {
		font-family: 'Raleway', sans-serif;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-dim-solid);
		margin-top: 3px;
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.menu .who .role::before {
		content: '';
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--leaf);
	}
	.menu a,
	.menu button.mi {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 8px 10px;
		border-radius: 8px;
		border: 0;
		background: transparent;
		font-family: 'Raleway', sans-serif;
		font-size: 13px;
		color: var(--text);
		text-align: left;
		text-decoration: none;
		cursor: pointer;
	}
	.menu a:hover,
	.menu button.mi:hover {
		background: var(--surface-2);
	}
	.menu .sep {
		height: 1px;
		background: var(--border);
		margin: 6px 4px;
	}
	.menu .danger {
		color: var(--red);
	}
</style>
