<script>
	import { createEventDispatcher } from 'svelte';
	import { page } from '$app/stores';

	import Fa from 'svelte-fa';
	import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

	export let item; // {name: "Item name", icon: Fa icon, path: "/path", children: [item11, item12]}

	export let open = false;

	const dispatch = createEventDispatcher();

	let toggledMenuSubItemIndex = null;
	let toggleMenuSubItem = function (index) {
		if (toggledMenuSubItemIndex === index) {
			toggledMenuSubItemIndex = null;
		} else {
			toggledMenuSubItemIndex = index;
		}
	};

	let toggleMenuItem = function () {
		toggledMenuSubItemIndex = null;
		dispatch('click');
	};
</script>

{#if item.children.length === 0}
	<li>
		<a href={item.path} class:active={$page.url.pathname === item.path}>
			<div class="menu-item">
				<div class="left-ico">
					{#if item.icon !== undefined}
						<Fa icon={item.icon} />
					{/if}
				</div>
				<div class="item-name">{item.name}</div>
			</div>
		</a>
	</li>
{:else}
	<li>
		<button class="reset-button" style="width: 100%" on:click={toggleMenuItem}>
			<div class="menu-item">
				<div class="left-ico">
					{#if item.icon !== undefined}
						<Fa icon={item.icon} />
					{/if}
				</div>
				<div class="item-name">{item.name}</div>
				<div class="right-ico" class:rotated={open === true}><Fa icon={faChevronRight} /></div>
			</div>
		</button>
		<ul class="item-submenu" class:open={open === true}>
			{#each item.children as child, index}
				{#if !child.children || child.children.length === 0}
					<a href={child.path} class:active={$page.url.pathname === child.path}>
						<div class="left-ico">
							{#if child.icon !== undefined}
								<Fa icon={child.icon} />
							{/if}
						</div>
						<div class="item-name">{child.name}</div>
					</a>
				{:else}
					<li>
						<button class="reset-button" style="width: 100% " on:click={() => {toggleMenuSubItem(index)}}>
							<div class="menu-sub-item">
								<div class="left-ico"><Fa icon={child.icon} /></div>
								<div class="item-name">{child.name}</div>
								<div class="right-ico" class:rotated={toggledMenuSubItemIndex === index}>
									<Fa icon={faChevronRight} />
								</div>
							</div>
						</button>
					</li>
					<ul class="item-submenu" class:open={toggledMenuSubItemIndex === index}>
						{#each child.children as grandchild}
							<a href="{grandchild.path}" class:active={$page.url.pathname === grandchild.path}>
								<div class="left-ico">
									{#if grandchild.icon !== undefined}
										<Fa icon={grandchild.icon} />
									{/if}
								</div>
								<div class="item-name">{grandchild.name}</div>
							</a>
						{/each}
					</ul>
				{/if}
			{/each}
		</ul>
	</li>
{/if}

<style>
	* {
		list-style: none;
	}

	a {
		text-decoration: none;
		color: inherit;
	}

	.menu-item {
		cursor: pointer;
		display: flex;
		padding: 12px 15px 12px 15px;
		border-bottom: thin solid var(--main-95);
		font-size: 0.86rem;
		line-height: 25px;
		z-index: 50;
	}

	.menu-sub-item {
		cursor: pointer;
		display: flex;
		padding: 11px 12px 11px 12px;
		background-color: var(--green);
		color: var(--main-95);
		border-bottom: thin solid var(--main-95);
		font-size: 0.86rem;
		line-height: 25px;
		z-index: 50;
	}

	.item-name {
		padding-right: 5px;
		margin-right: auto;
	}

	.left-ico {
		width: 18px;
		text-align: center;
		margin: auto 18px auto 0;
	}

	.right-ico {
		float: right;
		line-height: 25px;
		margin: auto 0 auto;
	}

	.rotated {
		transition: transform 0.5s;
		transform: rotate(90deg);
	}

	.item-submenu {
		display: none;
	}

	.item-submenu a {
		background: var(--gray-65);
		color: var(--gray-90);
		cursor: pointer;
		display: flex;
		padding: 11px 12px 11px 12px;
		transition: all 0.4s ease-out;
		font-size: 0.95rem;
		border-bottom: thin solid var(--gray-80);
		line-height: 23px;
	}

	a.active {
		font-weight: 600;
		color: var(--main-60);
	}

	.open {
		display: block;
	}
</style>
