<script>
	import { slide } from 'svelte/transition';
	import { page } from '$app/state';

	import Fa from 'svelte-fa';
	import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

	let {
		item,
		open = false,
		onclick = () => {}
	} = $props();

	let anyItemClicked = $state(false);

	let toggledMenuSubItemIndex = $state(null);
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
		onclick();
	};

	const animate = (node, args) => (args.anyItemClicked ? slide(node, args) : undefined);
</script>

{#if item.children.length === 0}
	<li>
		<a href={item.path} class="menu-item" class:active={page.url.pathname === item.path}>
			<div class="left-ico">
				{#if item.icon !== undefined}
					<Fa icon={item.icon} />
				{/if}
			</div>
			<div class="item-name">{item.name}</div>
			<div class="right-ico"></div>
		</a>
	</li>
{:else}
	<li>
		<button class="reset-button menu-item" onclick={toggleMenuItem}>
			<div class="left-ico">
				{#if item.icon !== undefined}
					<Fa icon={item.icon} />
				{/if}
			</div>
			<div class="item-name">{item.name}</div>
			<div class="right-ico" class:rotated={open === true}><Fa icon={faChevronRight} /></div>
		</button>
		{#if open}
			<ul transition:animate={{ anyItemClicked: anyItemClicked }}>
				{#each item.children as child, index}
					{#if !child.children || child.children.length === 0}
						<a href={child.path} class="menu-item menu-sub-item" class:active={page.url.pathname === child.path}>
							<div class="left-ico">
								{#if child.icon !== undefined && child.name !== undefined}
									<Fa icon={child.icon} />
								{/if}
							</div>
							<div class="item-name">
								{#if child.name !== undefined}
									{child.name}
								{:else if child.icon !== undefined}
									<div style="margin: auto">
										<Fa icon={child.icon} />
									</div>
								{/if}
							</div>
							<div class="right-ico"></div>
						</a>
					{:else}
						<li>
							<button
								class="reset-button menu-item menu-sub-item"
								style="background-color: {child.color ? child.color : 'var(--green)'}"
								onclick={() => {
									toggleMenuSubItem(index);
								}}
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
										href={grandchild.path}
										class="menu-item menu-sub-item menu-sub-sub-item item-name"
										class:active={page.url.pathname === grandchild.path}
									>
										<div class="left-ico">
											{#if grandchild.icon !== undefined && grandchild.name !== undefined}
												<Fa icon={grandchild.icon} />
											{/if}
										</div>
										<div class="item-name">
											{#if grandchild.name !== undefined}
												{grandchild.name}
											{:else if grandchild.icon !== undefined}
												<div style="margin: auto">
													<Fa icon={grandchild.icon} />
												</div>
											{/if}
										</div>
										<div class="right-ico"></div>
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

	button {
		width: 100%;
	}

	.menu-item {
		cursor: pointer;
		display: flex;
		padding: 11px 10px 11px 15px;
		border-bottom: thin solid var(--main-95);
		font-size: 0.82rem;
		line-height: 24px;
		z-index: 50;
	}

	.menu-sub-item {
		padding: 9px 10px 9px 15px;
	}

	.menu-sub-sub-item {
		/*background: hsl(0, 0%, 75%);*/
	}

	.item-name {
		display: flex;
		text-align: left;
	}

	.left-ico {
		width: 25px;
		text-align: center;
		margin: auto 14px auto 0;
	}

	.right-ico {
		width: 25px;
		line-height: 24px;
		margin: auto 0 auto auto;
		transition: transform 0.7s;
	}

	.rotated {
		transform: rotate(90deg);
	}
</style>
