<script>
	import { logIn } from '$lib/actions.js';

	let errors = {};
	const resetErrors = function () {
		errors.username = null;
		errors.password = null;
		errors.server = null;
	};
	resetErrors();

	let username;
	let password;
	let remember;

	const validate = async function () {
		resetErrors();
		if (!username) {
			errors.username = 'Username required';
		}
		if (!password) {
			errors.password = 'Password required';
		}
		if (!errors.username && !errors.password) {
			errors.server = await logIn(username, password, remember);
		}
	};
</script>

<h1>Sign In</h1>
<form on:submit={validate}>
	<input id="csrf_token" type="hidden" value="text" />
	{#if errors.server}
		<div class="input-group">
			<div class="error">{errors.server}</div>
		</div>
	{/if}
	<div class="input-group">
		<label for="username">Username</label> <br />
		<input id="username" size="32" type="text" bind:value={username} />
		{#if errors.username}
			<br />
			<div class="error">{errors.username}</div>
		{/if}
	</div>
	<div class="input-group">
		<label for="password">Password</label> <br />
		<input id="password" size="32" type="password" bind:value={password} />
		{#if errors.password}
			<br />
			<div class="error">{errors.password}</div>
		{/if}
	</div>
	<div class="input-group">
		<input id="remember" type="checkbox" bind:checked={remember} /> &nbsp;
		<label for="remember">Remember me</label>
	</div>
	<div class="input-group">
		<input id="submit" type="submit" class="submit-button" value="Sign in" style="height: 2rem" />
	</div>
</form>

<p>
	New User?
	<a href="/auth/invitation"> Click here to register! </a>
</p>
