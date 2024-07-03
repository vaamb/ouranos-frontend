<script>
	import Fa from 'svelte-fa';
	import { faCircle } from '@fortawesome/free-solid-svg-icons';

	export let title;
	export let icon = null;
	export let status = null;
	export let align = 'left';
	export let direction = 'column';
	export let minHeight = null;
	export let maxHeight = null;
	export let minWidth = null;
	export let maxWidth = null;
</script>

<div class="box" style="min-height: {minHeight}; max-height: {maxHeight}; min-width: {minWidth}; max-width: {maxWidth};">
	<h1 class={align}>
		{#if status}
			{title} &nbsp;
			<Fa icon={faCircle} class={status} />
		{:else}
			{#if icon}
				<Fa {icon} />
			{/if}
			{title}
		{/if}
	</h1>
	<div class="box-content {direction}">
		<slot />
	</div>
</div>

<style>
	h1 {
		font-size: 1.15rem;
		font-weight: bold;
		padding: 8px 5px;
		border-bottom: 2px solid var(--main-80);
		margin-bottom: 10px;
		text-align: left;
	}

	.left {
		text-align: left;
	}

	.center {
		text-align: center;
	}

	.right {
		text-align: right;
	}

	.box {
		background-color: var(--main-95);
		padding: 10px 17px 17px 17px;
		margin-bottom: 6px;
		border: thin solid var(--main-80);
		flex: 1;
		box-shadow: 0 0 20px var(--main-50-shadow);
	}

	.box-content {
		display: flex;
		flex-wrap: wrap;
		column-gap: 1px;
		row-gap: 1px;
		text-align: center;
		flex-direction: column;
		background: var(--main-80);
		margin: 0 10px 0;
	}

	.row {
		flex-direction: column;
	}

	.column {
		flex-direction: column;
	}

	@media only screen and (min-width: 300px) {
		.box {
			min-width: 225px;
		}
	}

	@media only screen and (min-width: 768px) {
		.row {
			flex-direction: row;
		}
	}
</style>
