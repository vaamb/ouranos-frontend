<script>
	import { navigating } from '$app/stores';

	import Fa from 'svelte-fa';
	import {
		faAddressCard,
		faBars,
		faPowerOff,
		faUserCog,
		faXmark
	} from '@fortawesome/free-solid-svg-icons';

	import MenuItem from '$lib/components/menu/MenuItem.svelte';

	import { permissions } from '$lib/utils/consts.js';
	import { currentUser, ecosystemsIds } from '$lib/store.svelte.js';

	let { items, width = 210 } = $props();

	let outerWidth = $state(0);

	let showMenu = $state(false);
	let toggleMenu = function () {
		showMenu = !showMenu;
	};

	// Menu item to open
	let toggledMenuItemIndex = $state(null);
	// Pre-open ecosystems submenu if there are less than 3 ecosystems
	if ($ecosystemsIds.length < 3) {
		const index = items.findIndex((item) => item.name === 'Ecosystems');
		if (index !== -1) {
			toggledMenuItemIndex = index;
		}
	}

	let toggleMenuItem = function (index) {
		if (toggledMenuItemIndex === index) {
			toggledMenuItemIndex = null;
		} else {
			toggledMenuItemIndex = index;
		}
	};

	const restartServer = function () {
		if (!currentUser.can(permissions.ADMIN)) {
			return;
		}
	};

	$effect(() => {
		// Close menu when changing page if screen is smaller than 992px
		if ($navigating) {
			if (outerWidth < 992) {
				showMenu = false;
				//toggledMenuItemIndex = null;
			}
		}
	});
</script>

<svelte:window bind:outerWidth />

<nav style="--menu-width:{width}">
	<div class="top-box">
		<div class="menu-title-wrapper">
			<div class="menu-title">GAIA</div>
		</div>
		<div
			class="toggle-button-wrapper"
			tabindex="0"
			role="button"
			aria-pressed="false"
			onclick={toggleMenu}
			onkeypress={toggleMenu}
		>
			<div class="toggle-button">
				{#if !showMenu}
					<Fa icon={faBars} size="2x" />
				{:else}
					<Fa icon={faXmark} size="2x" />
				{/if}
			</div>
		</div>
		<div class="user-box">
			<img src="/images/avatar/{$currentUser.avatar}_64.jpg" alt="User avatar" class="avatar" />
			<div class="welcome">
				{#if $currentUser.isAuthenticated}
					<div>Welcome,</div>
					{#if $currentUser.firstname}
						<div>{$currentUser.firstname}</div>
					{:else}
						<div>{$currentUser.username}</div>
					{/if}
				{:else}
					<div>Welcome</div>
				{/if}
			</div>
		</div>
	</div>
	<div class="toggleable-content" class:show={showMenu === true}>
		<ul class="accordion">
			{#each items as item, index}
				<MenuItem
					{item}
					open={toggledMenuItemIndex === index}
					on:click={() => toggleMenuItem(index)}
				/>
			{/each}
		</ul>
		<div class="bottom-box">
			<a href="/about"><Fa icon={faAddressCard} /></a>
			{#if $currentUser.isAuthenticated}
				<a href="/user/settings"><Fa icon={faUserCog} /></a>
			{/if}
			{#if $currentUser.can(permissions.ADMIN)}
				<button class="reset-button" onclick={restartServer}><Fa icon={faPowerOff} /></button>
			{/if}
		</div>
	</div>
</nav>

<style>
	a {
		text-decoration: none;
		color: inherit;
	}

	nav {
		top: 0;
		position: fixed;
		width: 100%;
		background-color: var(--main-25);
		color: var(--main-95);
		display: flex;
		flex-direction: column;
		z-index: 10;
	}

	.top-box {
		width: calc(100% - 20px);
		padding: 10px;
		display: flex;
		flex-wrap: wrap;
	}

	.menu-title-wrapper {
		width: 25%;
		margin: auto auto auto 10px;
		line-height: 45px;
	}

	.menu-title {
		font-family: sans-serif;
		font-weight: bold;
		font-size: 1.5rem;
		margin: auto;
	}

	.toggle-button-wrapper {
		width: 75px;
		line-height: 45px;
		display: flex;
	}

	.toggle-button {
		margin: auto 15px -5px auto;
	}

	.user-box {
		display: none;
	}

	.avatar {
		width: 50px;
		height: 50px;
		margin: auto;
		border-radius: 50%;
		border: 3px solid var(--main-95);
	}

	.welcome {
		height: 46px;
		margin: auto 0 auto 10px;
		display: flex;
		flex-direction: column;
		padding: 6px 0 6px 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.welcome > div {
		margin: auto auto auto 0;
	}

	.welcome > div + div {
		padding-top: 2px;
	}

	.toggleable-content {
		height: calc(100vh - 65px); /* full screen - reduced menu height */
		display: none;
		flex-direction: column;
		border-top: thin solid var(--main-95);
	}

	.show {
		display: flex;
	}

	.accordion {
		overflow-y: scroll;
		scrollbar-width: none;
	}

	.bottom-box {
		display: flex;
		margin-top: auto;
		line-height: 33px;
		background-color: var(--derived-20);
		color: var(--main-40);
	}

	.bottom-box > a {
		padding: 2px 5px 2px 5px;
		flex: 1;
		text-align: center;
	}

	.bottom-box > button {
		padding: 2px 5px 2px 5px;
		flex: 1;
		text-align: center;
		cursor: pointer;
	}

	@media only screen and (min-width: 992px) {
		nav {
			width: calc(var(--menu-width) * 1px);
			height: 100%;
		}

		.menu-title-wrapper {
			margin: 0 auto 5px auto;
			width: inherit;
			display: flex;
		}

		.toggle-button-wrapper {
			display: none;
		}

		.user-box {
			height: 56px;
			margin-top: 5px;
			margin-bottom: 10px;
			display: flex;
		}

		.toggleable-content {
			display: flex;
			flex-direction: column;
			height: 100%;
			overflow-y: scroll;
			scrollbar-width: none;
			border-top: thin solid var(--main-95);
		}

		.accordion::-webkit-scrollbar {
			width: 0;
		}
	}
</style>
