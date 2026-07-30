<script>
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	import AuthSheet from '$lib/components/AuthSheet.svelte';
	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';
	import TokenGate from '$lib/components/TokenGate.svelte';

	import { crudRequest } from '$lib/actions.svelte.js';

	const confirmAccount = function (token) {
		crudRequest(`auth/confirm_account?token=${token}`, 'create').then(() => {
			goto(resolve('/'));
		});
	};
</script>

<TokenGate
	sub="confirmation"
	path="/auth/confirm"
	heading="Confirm your account"
	hint="Paste the token from the confirmation e-mail you were sent."
	deadEnd="The token in this link is expired or does not confirm an account. Paste the one you were sent, or ask for a new confirmation e-mail."
>
	{#snippet children(token)}
		<AuthSheet intent="--good-green">
			{#snippet kicker()}Token accepted{/snippet}
			{#snippet title()}Confirm your account{/snippet}

			<p class="lede">
				This is the last step. Confirming activates your account and takes you to Ouranos.
			</p>

			<ConfirmButtons
				confirmLabel="Confirm account"
				showCancel={false}
				onconfirm={() => confirmAccount(token)}
			/>
		</AuthSheet>
	{/snippet}
</TokenGate>

<style>
	.lede {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.55;
		color: var(--text-dim-solid);
	}
</style>
