<script>
  export let title;
  export let info = null;
</script>

<svelte:head>
	<title>{title} - GAIA</title>
</svelte:head>

<div class="header-line">
  <h1>{ title }</h1>
  {#if info}
    <div class="info">{ info }</div>
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

  .info {
    margin: auto 0 0 auto;
    font-size: 0.97rem;
  }
</style>
