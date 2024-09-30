<script>
	import Fa from 'svelte-fa';
	import { faCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

	import { logOut } from '$lib/actions.js';
	import { permissions } from '$lib/utils/consts.js';
	import { currentUser, pingServerIsConnected, warnings } from '$lib/store.js';

	export let development;
	export let menuWidth = 210;
</script>

<div class="top-bar" style="--menu-width:{menuWidth}">
	<div class="left">
		<div style="margin-right: 10px">
			<Fa icon={faCircle} class={$pingServerIsConnected ? 'on' : 'deco'} />
		</div>
		<div class="user-permission">
			{#if $currentUser.can(permissions.ADMIN)}
				<div>Logged as Admin</div>
			{:else if $currentUser.can(permissions.OPERATE)}
				<div>Logged as Operator</div>
			{/if}
		</div>
	</div>
	<div class="center">
		<div class="development-warning">
			{#if development}
				<div class="small-screen">Dev mode</div>
				<div class="big-screen">Development mode</div>
			{/if}
		</div>
	</div>
	<div class="right">
		<div class="dropdown">
			{#if $currentUser.isAnonymous}
				<a href="/auth/login">
					<div class="center-content" style="display: flex">
						<div style="margin: auto">
							Log in
						</div>
					</div>
				</a>
			{:else}
				<button class="reset-button dropdown-button center-content">
					{$currentUser.username}
				</button>
				<div class="dropdown-content" id="userDropdownContent">
					<div>
						<a href="/user/{$currentUser.username}/profile">Profile</a>
					</div>
					<div>
						<button class="reset-button clickable" on:click={logOut}>Log out</button>
					</div>
				</div>
			{/if}
		</div>
		<div class="warning-button">
			{#if $currentUser.isAuthenticated && $warnings.length > 0}
				<a href="/warnings">
					<Fa icon={faExclamationTriangle} />
				</a>
			{/if}
		</div>
	</div>
</div>

<style>
	a {
		text-decoration: none;
		color: inherit;
	}

	.top-bar {
		display: flex;
		font-size: 1rem;
		font-weight: bold;
		height: 45px;
		background: var(--main-93);
		border-bottom: 1px solid var(--main-80);
		z-index: 10;
	}

	.left {
		display: flex;
		margin: auto 0 auto 20px;
	}

	.user-permission {
		display: none;
	}

	.center {
		margin: auto;
	}

	.development-warning {
		color: var(--red);
	}

	.small-screen {
		display: inherit;
	}

	.big-screen {
		display: none;
	}

	.right {
		display: flex;
	}

	.clickable {
		cursor: pointer;
	}

	.dropdown {
		width: 104px;
		height: 100%;
		justify-content: center;
		display: block;
		background-color: var(--main-40);
		color: var(--main-95);
		padding: 0 30px;
		position: relative;
	}

	.dropdown-button {
		font-weight: bold;
		font-size: 1em;
	}

	.dropdown-content {
		display: none;
		position: absolute;
		color: var(--derived-50);
		background-color: var(--main-95);
		width: 163px; /* dropdown width (104px) + padding (2 * 30px) - border (1px) */
		z-index: 10;
		right: 0;
		border: 1px solid var(--main-40);
		margin-top: 26px;
	}

	.dropdown-content > div {
		padding: 0 16px;
		width: 131px /* dropdown-content (163) - padding (2 * 16px) */;
		display: block;
		line-height: 45px;
	}

	.dropdown-content > div:hover {
		background-color: var(--main-90);
	}

	.dropdown:hover .dropdown-content {
		display: block;
	}

	.warning-button {
		width: 20px;
		margin: auto 0;
	}

	.warning-button > a {
		display: none;
	}

	@media only screen and (min-width: 992px) {
		.top-bar {
			position: fixed;
			top: 0;
			width: calc(100% - var(--menu-width) * 1px);
			margin-left: calc(var(--menu-width) * 1px);
		}

		.left {
			width: 210px;
		}

		.user-permission {
			display: inherit;
		}

		.small-screen {
			display: none;
		}

		.big-screen {
			display: inherit;
		}

		.warning-button {
			color: var(--red);
			text-align: center;
			font-size: 1.5rem;
			width: 45px;
		}
		.warning-button > a {
			display: block;
		}
	}
</style>
