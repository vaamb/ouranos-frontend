<script>
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	import axios from 'axios';

	import AuthSheet from '$lib/components/AuthSheet.svelte';
	import Form from '$lib/components/Form.svelte';
	import TokenGate from '$lib/components/TokenGate.svelte';

	import { appState } from '$lib/store.svelte.ts';
	import { API_URL } from '$lib/utils/consts.js';
	import { createFlashMessage, createUser } from '$lib/utils/factories.js';
	import { isEmailValid, isPasswordValid, isUsernameValid } from '$lib/utils/functions.js';

	let serverError = $state(null);

	// The invitation carries whichever fields the administrator filled in, and
	// only those: the backend strips every claim it was not given, then
	// overrides username, email and role with the token's own values. So the
	// rule is one line: if the token holds it, the token is the source of
	// truth, and the field is not yours to fill.
	const fromToken = function (tokenData, key) {
		return tokenData[key] !== undefined;
	};

	const buildFormData = function (tokenData) {
		return [
			{
				label: 'Username',
				key: 'username',
				value: tokenData['username'],
				disabled: fromToken(tokenData, 'username'),
				note: fromToken(tokenData, 'username') ? 'Set by your invitation' : undefined,
				autocomplete: 'username',
				hint: fromToken(tokenData, 'username')
					? undefined
					: '3 to 32 characters. Letters, digits, and . _ ! only. No spaces.',
				validate: (value) => isUsernameValid(value || '')
			},
			{
				label: 'First name',
				key: 'firstname',
				value: tokenData['firstname'],
				disabled: fromToken(tokenData, 'firstname'),
				note: fromToken(tokenData, 'firstname') ? 'Set by your invitation' : undefined,
				autocomplete: 'given-name',
				required: false
			},
			{
				label: 'Last name',
				key: 'lastname',
				value: tokenData['lastname'],
				disabled: fromToken(tokenData, 'lastname'),
				note: fromToken(tokenData, 'lastname') ? 'Set by your invitation' : undefined,
				autocomplete: 'family-name',
				required: false
			},
			{
				label: 'E-mail',
				key: 'email',
				type: 'email',
				value: tokenData['email'],
				disabled: fromToken(tokenData, 'email'),
				note: fromToken(tokenData, 'email') ? 'Set by your invitation' : undefined,
				autocomplete: 'email',
				validate: (value) => isEmailValid(value || '')
			},
			{
				// Absent from the token means the default role, never a role you pick
				label: 'Role',
				key: 'role',
				value: tokenData['role'] || 'User',
				disabled: true,
				note: fromToken(tokenData, 'role') ? 'Set by your invitation' : 'The default role'
			},
			{
				label: 'Password',
				key: 'password',
				type: 'password',
				autocomplete: 'new-password',
				hint: '8 to 32 characters, with at least one lower case letter, one capital, one digit and one of - + _ ! $ & ? . ,',
				validate: (value) => isPasswordValid(value || '')
			},
			{
				label: 'Repeat password',
				key: 'passwordRepeat',
				type: 'password',
				autocomplete: 'new-password',
				validate: (value, values) => !!value && value === values['password']
			}
		];
	};

	const register = function (token, tokenData, payload) {
		axios(`${API_URL}/auth/register?invitation_token=${token}&send_email=true`, {
			method: 'post',
			withCredentials: true,
			data: {
				// A field the token holds is disabled, so it never reaches the
				// payload — read it back off the token.
				username: tokenData['username'] ?? payload['username'],
				email: tokenData['email'] ?? payload['email'],
				firstname: tokenData['firstname'] ?? payload['firstname'],
				lastname: tokenData['lastname'] ?? payload['lastname'],
				password: payload['password']
			}
		})
			.then((response) => {
				serverError = null;
				const user = createUser(response.data.user);
				appState.currentUser = user;
				appState.flashMessages.push(
					createFlashMessage('Hello ' + user['username'] + ', welcome to Ouranos')
				);
				goto(resolve('/'));
			})
			.catch((error) => {
				if (error.response) {
					if (error.response.data.detail) {
						serverError = error.response.data.detail;
					} else {
						serverError =
							'We encountered an error. Please contact the administrator and come back later.';
					}
				}
			});
	};
</script>

<TokenGate
	sub="registration"
	path="/auth/register"
	heading="Enter your invitation"
	hint="Paste the token from the invitation you were sent."
	deadEnd="The token in this link is expired or does not open a registration. Paste the one you were sent, or ask an administrator for a new invitation."
>
	{#snippet children(token, tokenData)}
		<AuthSheet intent={serverError ? '--critical-red' : '--good-green'}>
			{#snippet kicker()}Invitation accepted{/snippet}
			{#snippet title()}Create your account{/snippet}

			{#if serverError}
				<p class="server-error">{serverError}</p>
			{/if}

			<Form
				data={buildFormData(tokenData)}
				confirmLabel="Create account"
				showCancel={false}
				onconfirm={(payload) => register(token, tokenData, payload)}
			/>

			{#snippet footer()}
				Already registered? <a href={resolve('/auth/login')}>Sign in</a>.
			{/snippet}
		</AuthSheet>
	{/snippet}
</TokenGate>

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
