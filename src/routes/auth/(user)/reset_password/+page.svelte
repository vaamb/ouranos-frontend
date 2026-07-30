<script>
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	import AuthSheet from '$lib/components/AuthSheet.svelte';
	import Form from '$lib/components/Form.svelte';
	import TokenGate from '$lib/components/TokenGate.svelte';

	import { crudRequest } from '$lib/actions.svelte.js';
	import { isPasswordValid } from '$lib/utils/functions.js';

	const formData = [
		{
			label: 'New password',
			key: 'password',
			type: 'password',
			autocomplete: 'new-password',
			hint: '8 to 32 characters, with at least one lower case letter, one capital, one digit and one of - + _ ! $ & ? . ,',
			validate: (value) => isPasswordValid(value || '')
		},
		{
			label: 'Repeat new password',
			key: 'passwordRepeat',
			type: 'password',
			autocomplete: 'new-password',
			validate: (value, values) => !!value && value === values['password']
		}
	];

	const setPassword = function (token, payload) {
		crudRequest(`auth/reset_password?token=${token}`, 'create', {
			password: payload['password']
		}).then(() => {
			goto(resolve('/auth/login'));
		});
	};
</script>

<TokenGate
	sub="reset_password"
	path="/auth/reset_password"
	heading="Reset your password"
	hint="Paste the token from the password reset e-mail you were sent."
	deadEnd="The token in this link is expired or does not reset a password. Paste the one you were sent, or ask an administrator for a new reset link."
>
	{#snippet children(token)}
		<AuthSheet intent="--good-green">
			{#snippet kicker()}Token accepted{/snippet}
			{#snippet title()}Choose a new password{/snippet}

			<Form
				data={formData}
				confirmLabel="Set new password"
				showCancel={false}
				onconfirm={(payload) => setPassword(token, payload)}
			/>

			{#snippet footer()}
				Remembered it after all? <a href={resolve('/auth/login')}>Sign in</a>.
			{/snippet}
		</AuthSheet>
	{/snippet}
</TokenGate>
