<script>
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { navigating, page } from '$app/state';

	import { jwtDecode } from 'jwt-decode';

	import AuthSheet from '$lib/components/AuthSheet.svelte';
	import Form from '$lib/components/Form.svelte';

	import { checkJWT, formatDate, formatTimeShort } from '$lib/utils/functions.js';

	let {
		sub, // The expected JWT subject: 'registration' | 'confirmation' | 'reset_password'
		path, // Where to land once the token is accepted
		heading,
		hint,
		deadEnd, // What to do when the token in the URL is refused
		/* snippet, rendered with the accepted token and its decoded claims */
		children
	} = $props();

	let token = $state(page.url.searchParams.get('token'));

	let tokenIsValid = $derived.by(() => {
		try {
			checkJWT(token, { sub: sub });
			return true;
		} catch (error) {
			return false;
		}
	});

	// The claims the token carries. Every one of them is optional: the backend
	// strips any claim it was not given, so `tokenData` is the token's own
	// account of what it grants, never a fixed shape.
	let tokenData = $derived.by(() => {
		try {
			checkJWT(token, { sub: sub });
			return jwtDecode(token);
		} catch (error) {
			return {};
		}
	});

	// What the user is typing into the gate, checked as they go
	let candidate = $state(null);

	let candidateError = $derived.by(() => {
		try {
			checkJWT(candidate, { sub: sub });
			return null;
		} catch (error) {
			return error.message;
		}
	});

	// `checkJWT` tells expired apart from malformed; so should the page, because
	// the two need different things from the reader.
	let verdict = $derived.by(() => {
		if (!candidate) {
			return null;
		}
		if (candidateError === null) {
			const expiry = new Date(jwtDecode(candidate)['exp'] * 1000);
			return {
				tone: '--good-green',
				text: `Accepted. This token is valid until ${formatDate(expiry)}, ${formatTimeShort(expiry)}.`
			};
		}
		if (candidateError === 'Expired token') {
			return {
				tone: '--critical-red',
				text: 'This token has expired. Ask an administrator for a new one.'
			};
		}
		return {
			tone: '--critical-red',
			text: `This is not a valid ${sub.replace('_', ' ')} token. Check that you copied all of it.`
		};
	});

	// One state drives the kicker and the rail together, so the sheet never says
	// "required" while wearing the colour of an accepted token.
	const GATE = {
		required: { kicker: 'Token required', tone: undefined },
		refused: { kicker: 'Token refused', tone: '--critical-red' },
		accepted: { kicker: 'Token accepted', tone: '--good-green' }
	};

	let gate = $derived.by(() => {
		if (verdict) {
			return verdict['tone'] === '--good-green' ? GATE['accepted'] : GATE['refused'];
		}
		// A token came in the URL and did not survive `checkJWT`
		return token === null ? GATE['required'] : GATE['refused'];
	});

	const submitToken = function (payload) {
		token = payload['token'];
		goto(`${resolve(path)}?token=${token}`);
	};

	// Update token on self page navigation
	$effect(() => {
		if (navigating.from && navigating.to) {
			// Coming from a page with a token, to a page without -> the token was invalid, clear it
			if (
				navigating.from.url.searchParams.get('token') &&
				!navigating.to.url.searchParams.get('token')
			) {
				token = null;
				candidate = null;
			}
		}
	});
</script>

{#if token !== null && tokenIsValid}
	{@render children?.(token, tokenData)}
{:else}
	<AuthSheet intent={gate['tone']}>
		{#snippet kicker()}{gate['kicker']}{/snippet}
		{#snippet title()}{heading}{/snippet}

		{#if token !== null}
			<p class="dead-end">{deadEnd}</p>
		{/if}

		<Form
			data={[
				{
					label: 'Token',
					key: 'token',
					type: 'textarea',
					rows: 3,
					spellcheck: 'false',
					autocapitalize: 'off',
					autocorrect: 'off',
					// The instruction until you type; after that, the verdict on
					// what you typed — feedback belongs under the field it is about.
					hint: verdict ? verdict['text'] : hint,
					hintTone: verdict ? verdict['tone'] : undefined,
					validate: (value) => {
						try {
							checkJWT(value, { sub: sub });
							return true;
						} catch (error) {
							return false;
						}
					}
				}
			]}
			confirmLabel="Check token"
			showCancel={false}
			onchange={(values) => (candidate = values['token'] || null)}
			onconfirm={submitToken}
		/>
	</AuthSheet>
{/if}

<style>
	.dead-end {
		margin: 0 0 13px;
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--text-dim-solid);
	}
</style>
