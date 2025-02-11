<script>
	let {
		title = null,
		minWidth = '200px',
		maxWidth = 'auto',
		direction = 'column',
		href = null,
		children
	} = $props();
</script>

<div class="box-item" style="--min-width: {minWidth}; --max-width: {maxWidth}">
	<div class="top-fix">
		{#if title}
			<h1>{title}</h1>
		{/if}
	</div>
	<div class="box-item-content {direction}" style="height: 100%; display: flex">
		{#if href}
			<a href="{href}">
				{@render children?.()}
			</a>
		{:else}
			{@render children?.()}
		{/if}
	</div>
</div>

<style>
	a {
		height: 100%;
		display: inherit;
		flex-direction: inherit;
		flex-wrap: inherit;
		column-gap: inherit;
		row-gap: inherit;
	}

	h1 {
		font-size: 1rem;
		font-weight: bold;
	}

	.top-fix {
		margin: 10px -5px 4px;
	}

	.box-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: var(--main-95);
		padding-bottom: 15px;
		width: 100%;
	}

	.box-item-content {
		padding: 0 10px;
		text-align: center;
	}

	.column {
		flex-direction: column;
	}

	.row {
		flex-direction: row;
	}

	@media only screen and (min-width: 768px) {
		.box-item {
			min-width: var(--min-width);
			max-width: var(--max-width);
		}
	}
</style>
