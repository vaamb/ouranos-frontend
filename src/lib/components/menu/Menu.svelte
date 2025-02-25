<script>
	import { navigating } from '$app/stores';

	import Fa from 'svelte-fa';
	import { faAddressCard, faUserCog, faPowerOff } from '@fortawesome/free-solid-svg-icons';

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
	<div
		class="top-box"
		tabindex="0"
		role="button"
		aria-pressed="false"
		onclick={toggleMenu}
		onkeypress={toggleMenu}
	>
		<div class="menu-title">
			<h1>GAIA</h1>
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
	<div class="toggle-accordion" class:show={showMenu === true}>
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
	h1 {
		font-family: sans-serif;
		font-weight: bold;
		font-size: 1.5rem;
	}

	a {
		text-decoration: none;
		color: inherit;
	}

	nav {
		top: 0;
		background-color: var(--main-25);
		color: var(--main-95);
		display: flex;
		flex-direction: column;
		z-index: 10;
	}

	.top-box {
		padding: 10px;
		display: flex;
		flex-wrap: wrap;
	}

	.accordion {
		overflow-y: scroll;
		scrollbar-width: none;
	}

	.toggle-accordion {
		display: none;
		flex-direction: column;
		border-top: thin solid var(--main-95);
	}

	.show {
		display: flex;
	}

	.menu-title {
		margin: auto;
		line-height: 45px;
		display: flex;
	}

	.user-box {
		height: 56px;
		margin-top: 5px;
		margin-bottom: 10px;
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
			position: fixed;
			height: 100%;
		}

		.menu-title {
			margin: 0 auto 5px auto;
		}

		.user-box {
			display: flex;
		}

		.toggle-accordion {
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
