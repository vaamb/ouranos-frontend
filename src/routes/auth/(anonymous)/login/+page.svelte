<script>
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { navigating } from '$app/state';

	import AuthSheet from '$lib/components/AuthSheet.svelte';
	import Form from '$lib/components/Form.svelte';

	import { logIn } from '$lib/actions.svelte.js';

	// Need to store the previous page as it is set to null when using `logIn`
	const previousPage = navigating.from ? navigating.from.url.pathname : '/';

	let serverError = $state(null);

	const formData = [
		{ label: 'Username', key: 'username', autocomplete: 'username' },
		{ label: 'Password', key: 'password', type: 'password', autocomplete: 'current-password' },
		{ label: 'Keep me signed in', key: 'remember', type: 'checkbox', required: false }
	];

	const signIn = async function (payload) {
		const logResponse = await logIn(
			payload['username'],
			payload['password'],
			payload['remember'] ?? false
		);
		if (logResponse.success) {
			goto(previousPage);
		} else {
			serverError = logResponse.msg;
		}
	};
</script>

<AuthSheet intent={serverError ? '--critical-red' : undefined}>
	{#snippet kicker()}Sign in{/snippet}
	{#snippet title()}Welcome back{/snippet}

	{#if serverError}
		<p class="server-error">{serverError}</p>
	{/if}

	<Form data={formData} confirmLabel="Sign in" showCancel={false} onconfirm={signIn} />

	{#snippet footer()}
		Been invited? <a href={resolve('/auth/register')}>Register with your token</a>.
	{/snippet}
</AuthSheet>

<style>
	.server-error {
		margin: 0 0 13px;
		padding: 9px 11px;
		font-size: 0.78rem;
		line-height: 1.4;
		color: var(--critical-red);
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-left: 3px solid var(--critical-red);
		border-radius: var(--radius);
	}
</style>
