<script>
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition'
	import { page } from '$app/stores';

	import Fa from 'svelte-fa';
	import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

	export let item; // {name: "Item name", icon: Fa icon, path: "/path", children: [item11, item12]}

	export let open = false;

	let anyItemClicked = false;

	const dispatch = createEventDispatcher();

	let toggledMenuSubItemIndex = null;
	const toggleMenuSubItem = function (index) {
		anyItemClicked = true;
		if (toggledMenuSubItemIndex === index) {
			toggledMenuSubItemIndex = null;
		} else {
			toggledMenuSubItemIndex = index;
		}
	};

	const toggleMenuItem = function () {
		anyItemClicked = true;
		toggledMenuSubItemIndex = null;
		dispatch('click');
	};

	const animate = (node, args) =>
		args.anyItemClicked ? slide(node, args): undefined
</script>

{#if item.children.length === 0}
	<li>
		<a
				href={item.path}
				class="menu-item"
				class:active={$page.url.pathname === item.path}
		>
			<div class="left-ico">
				{#if item.icon !== undefined}
					<Fa icon={item.icon} />
				{/if}
			</div>
			<div class="item-name">{item.name}</div>
		</a>
	</li>
{:else}
	<li>
		<button class="reset-button menu-item" style="width: 100%" on:click={toggleMenuItem}>
			<div class="left-ico">
				{#if item.icon !== undefined}
					<Fa icon={item.icon} />
				{/if}
			</div>
			<div class="item-name">{item.name}</div>
			<div class="right-ico" class:rotated={open === true}><Fa icon={faChevronRight} /></div>
		</button>
		{#if open}
			<ul transition:animate={{anyItemClicked: anyItemClicked}}>
				{#each item.children as child, index}
					{#if !child.children || child.children.length === 0}
						<a
								href={child.path}
								class="menu-item"
								class:active={$page.url.pathname === child.path}
						>
							<div class="left-ico">
								{#if child.icon !== undefined}
									<Fa icon={child.icon} />
								{/if}
							</div>
							<div class="item-name">{child.name}</div>
						</a>
					{:else}
						<li>
							<button
									class="reset-button menu-item menu-sub-item"
									on:click={() => {toggleMenuSubItem(index)}}
							>
								<div class="left-ico"><Fa icon={child.icon} /></div>
								<div class="item-name">{child.name}</div>
								<div class="right-ico" class:rotated={toggledMenuSubItemIndex === index}>
									<Fa icon={faChevronRight} />
								</div>
							</button>
						</li>
						{#if toggledMenuSubItemIndex === index}
							<ul transition:slide>
								{#each child.children as grandchild}
									<a
											href="{grandchild.path}"
											class="menu-item"
											class:active={$page.url.pathname === grandchild.path}
									>
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
					{/if}
				{/each}
			</ul>
		{/if}
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

	a.active {
		font-weight: 600;
		color: var(--main-60);
	}

	ul a {
		background: var(--gray-65);
		color: var(--gray-90);
	}

	ul a.active {
		color: var(--derived-40);
	}

	.menu-item {
		cursor: pointer;
		display: flex;
		width: 100%;
		padding: 12px 15px;
		border-bottom: thin solid var(--main-95);
		font-size: 0.84rem;
		line-height: 24px;
		z-index: 50;
	}

	.menu-sub-item {
		background-color: var(--green);
		color: var(--main-95);
	}

	.item-name {
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
</style>
