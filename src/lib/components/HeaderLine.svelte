<script>
	let { title, sideBloc } = $props();
</script>

<svelte:head>
	<title>{title} - GAIA</title>
</svelte:head>

<div class="header-line">
	<h1>{title}</h1>
	{#if sideBloc}
    	{@render sideBloc()}
    {/if}
</div>

<style>
	.header-line {
		display: flex;
		flex-wrap: wrap;
		column-gap: 7px;
		padding-bottom: 0.8em;
		min-height: 35px;
	}
</style>
