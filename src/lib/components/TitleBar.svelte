<script>
	// `sideBloc` is a quiet note continuing the title ("· 28 July 2026").
	// `action` is the page's own control (a button, a link) and sits at the far
	// right instead, without the separating dot — an act is not an aside.
	// `docTitle` is the browser tab's title when it has to say more than the
	// heading does: the nav line's scope chip names the ecosystem on screen, but
	// a tab reading "Actuators" for every chamber is not a tab you can find.
	let { title, sideBloc, action, docTitle } = $props();
</script>

<svelte:head>
	<title>{docTitle || title} - GAIA</title>
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
		font-family: 'EB Garamond', Garamond, Georgia, serif;
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

	.side-bloc:empty {
		display: none;
	}

	.action {
		margin-left: auto;
	}
</style>
