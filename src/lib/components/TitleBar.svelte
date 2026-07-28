<script>
	// `sideBloc` is a quiet note continuing the title ("· 28 July 2026").
	// `action` is the page's own control (a button, a link) and sits at the far
	// right instead, without the separating dot — an act is not an aside.
	let { title, sideBloc, action } = $props();
</script>

<svelte:head>
	<title>{title} - GAIA</title>
</svelte:head>

<div class="header-line">
	<h1>{title}</h1>
	{#if sideBloc}
		<div class="side-bloc">
			{@render sideBloc()}
		</div>
	{/if}
	{#if action}
		<div class="action">
			{@render action()}
		</div>
	{/if}
</div>

<style>
	.header-line {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		column-gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	h1 {
		font-family: 'Garamond', Georgia, serif;
		font-size: clamp(1.6rem, 4vw, 2.15rem);
		font-weight: 500;
		line-height: 1.1;
		color: var(--text);
	}

	.side-bloc {
		color: var(--text-dim-solid);
	}

	.side-bloc::before {
		content: '·';
		margin-right: 0.45rem;
	}

	.action {
		margin-left: auto;
	}
</style>
