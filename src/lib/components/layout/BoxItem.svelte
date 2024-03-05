<script>
	export let title = null;
	export let maxWidth = 'auto';
	export let direction = 'column';
</script>

<div class="box-item" style="--max-width:{maxWidth}; height=100%">
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
		padding-bottom: 17px;
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
			min-width: 200px;
			max-width: var(--max-width);
		}
	}
</style>
