<script>
	export let title = null;
	export let minWidth = '200px';
	export let maxWidth = 'auto';
	export let direction = 'column';
</script>

<div class="box-item" style="--min-width: {minWidth}; --max-width: {maxWidth}; height=100%">
	<div class="top-fix">
		{#if title}
			<h1>{title}</h1>
		{/if}
	</div>
	<div class="box-item-content {direction}" style="height: 100%; display: flex">
		<slot />
	</div>
</div>

<style>
	h1 {
		font-size: 1rem;
		font-weight: bold;
	}

	.top-fix {
		margin: 10px -5px 4px;
	}

	.box-item {
		flex: 1;
		background: var(--main-95);
		padding-bottom: 5px;
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
