<svelte:head>
	<link rel="stylesheet" href="/css/auth.css" />
</svelte:head>

<div class="center-content">
	<div style="max-width: 80%">
		<slot />
	</div>
</div>

<style>
	.center-content {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
	}
</style>
