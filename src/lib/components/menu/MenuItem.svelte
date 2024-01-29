<script>
	import { page } from '$app/stores';

	import Fa from 'svelte-fa';
	import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

	export let item;
	export let open = false;
</script>

{#if item.children.length === 0}
	<li>
		<a href={item.path} class:active={$page.url.pathname === item.path}>
			<div class="menu-item">
				<div class="left-ico"><Fa icon={item.icon} /></div>
				<div class="item-name">{item.name}</div>
			</div>
		</a>
	</li>
{:else}
	<li>
		<button class="reset-button" style="width: 100%" on:click>
			<div class="menu-item">
				<div class="left-ico"><Fa icon={item.icon} /></div>
				<div class="item-name">{item.name}</div>
				<div class="right-ico"><Fa icon={faChevronRight} /></div>
			</div>
		</button>

		<ul class="item-submenu" class:open={open === true}>
			{#each item.children as child}
				<a
					href="{item.path}{child.path}"
					class:active={$page.url.pathname === item.path + child.path}
				>
					<div class="item-name">{child.name}</div>
				</a>
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

	.item-submenu {
		display: none;
	}

	.item-submenu a {
		background: var(--gray-70);
		color: var(--gray-50);
		cursor: pointer;
		display: block;
		padding: 11px 12px 11px 51px;
		transition: all 0.4s ease-out;
		font-size: 0.95rem;
		border-bottom: thin solid var(--gray-80);
	}

	a.active {
		font-weight: 600;
		color: var(--main-60);
	}

	.open {
		display: block;
	}
</style>
