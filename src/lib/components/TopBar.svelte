<script>
	import Fa from 'svelte-fa';
	import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

	import { logOut } from '$lib/actions.js';
	import { permissions } from '$lib/utils/consts.js';
	import { currentUser, warnings } from '$lib/store.js';

	export let development;
</script>

<div class="top-bar">
	<div class="left">
		{#if $currentUser.can(permissions.ADMIN)}
			<div>Logged as Admin</div>
		{:else if $currentUser.can(permissions.OPERATE)}
			<div>Logged as Operator</div>
		{/if}
	</div>
	<div class="center">
		{#if development}
			<div style="color: var(--red)">Development mode</div>
		{/if}
	</div>
	<div class="right">
		<div style="margin: auto"></div>
		<div class="dropdown">
			{#if $currentUser.isAnonymous}
				<a href="/auth/login">
					<div class="center-content">Log in</div>
				</a>
			{:else}
				<button class="reset-button dropdown-button center-content">
					{$currentUser.username}
				</button>
				<div class="dropdown-content" id="userDropdownContent">
					<div>
						<a href="/user/profile">Profile</a>
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
		width: 250px;
		margin: auto 0 auto 20px;
		display: none;
	}

	.center {
		margin: auto auto auto 20px;
	}

	.right {
		width: 150px;
		display: flex;
	}

	.clickable {
		cursor: pointer;
	}

	.dropdown {
		width: 55px;
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
		width: 113px;
		z-index: 10;
		right: 0;
		border: thin solid var(--main-40);
		margin-top: 26px;
	}

	.dropdown-content > div {
		padding: 0 16px;
		width: 81px;
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
		.left {
			display: inherit;
		}

		.center {
			margin: auto;
		}

		.right {
			width: 250px;
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
