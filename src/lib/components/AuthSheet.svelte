<script>
	import { resolve } from '$app/paths';

	let {
		intent = undefined, // A custom property name (eg. '--good-green'), painted as the left rail
		/* snippets */
		kicker,
		title,
		children,
		footer
	} = $props();

	let style = $derived(intent ? `--intent: var(${intent})` : undefined);
</script>

<div class="auth">
	<a class="brand" href={resolve('/')}>
		Ouranos<small>Gaia&nbsp;control</small>
	</a>

	<section class="sheet" {style}>
		<div class="head">
			{#if kicker}
				<div class="kicker">{@render kicker()}</div>
			{/if}
			{#if title}
				<h1 class="title">{@render title()}</h1>
			{/if}
		</div>
		<div class="body">
			{@render children?.()}
		</div>
	</section>

	{#if footer}
		<p class="foot">{@render footer()}</p>
	{/if}
</div>

<style>
	.auth {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 18px;
		min-height: 100vh;
		padding: clamp(32px, 13vh, 128px) 14px 44px;
		box-sizing: border-box;
		background: var(--bg);
	}

	/* Matches `Header`'s brand: the door belongs to the same building. */
	.brand {
		display: flex;
		align-items: baseline;
		gap: 10px;
		font-family: 'Garamond', Georgia, serif;
		font-size: 27px;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--text);
		text-decoration: none;
	}

	.brand small {
		font-family: 'Raleway', sans-serif;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--text-faint);
	}

	/* The same material as every other surface, lifted like a sheet. The rail is
	   absent unless the page carries something semantic. */
	.sheet {
		width: min(430px, 100%);
		box-sizing: border-box;
		background: var(--surface);
		border: 1px solid var(--border);
		border-left: 3px solid var(--intent, var(--border-strong));
		border-radius: var(--radius);
		box-shadow: var(--sheet-shadow);
		overflow: hidden;
	}

	.head {
		padding: 15px 16px 13px;
		border-bottom: 1px solid var(--border);
	}

	.kicker {
		font-size: 0.6rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--intent, var(--text-faint));
	}

	.title {
		font-family: 'Garamond', Georgia, serif;
		font-size: 1.375rem;
		font-weight: 600;
		line-height: 1.15;
		margin: 4px 0 0;
		color: var(--text);
		text-wrap: balance;
	}

	.body {
		/* Read by `ConfirmButtons`, which bleeds out of it into its own bar */
		--sheet-padding: 16px;
		padding: var(--sheet-padding);
	}

	.foot {
		max-width: min(430px, 100%);
		margin: 0;
		font-size: 0.76rem;
		line-height: 1.6;
		text-align: center;
		color: var(--text-faint);
	}

	.foot :global(a) {
		color: var(--text-dim-solid);
		border-bottom: 1px solid var(--border-strong);
	}

	.foot :global(a:hover) {
		color: var(--text);
	}

	/* The sheet fills the width it is given rather than floating in a margin */
	@media (max-width: 460px) {
		.auth {
			padding-top: 26px;
		}

		.sheet {
			width: 100%;
		}
	}
</style>
