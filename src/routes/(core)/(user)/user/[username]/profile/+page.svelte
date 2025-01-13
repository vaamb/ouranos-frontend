<script>
	import { page } from '$app/stores';

	import Fa from 'svelte-fa';
	import { faCircle } from '@fortawesome/free-solid-svg-icons';

	import Form from '$lib/components/Form.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';

	import { crudRequest, fetchUserDescription } from '$lib/actions.svelte.js';
	import { currentUser } from '$lib/store.js';
	import { capitalize, getStatusClass, timeStringToDate } from '$lib/utils/functions.js';

	let username = $derived($page['params']['username']);

	const seenLastly = function (userDescription) {
		if (!userDescription['last_seen']) {
			return false;
		}
		return new Date() - new Date(userDescription['last_seen']) < 1000 * 60 * 2;
	};

	const emptyIfNull = function (maybeStr) {
		return maybeStr ? maybeStr : '';
	};

	// Modal-related variables and functions
	let modals = $state({});
	let crudAction = $state(undefined);

	const setCrudAction = function (action) {
		crudAction = action;
	};

	const resetCrudAction = function () {
		crudAction = undefined;
	};
</script>

<HeaderLine title="{username}'s profile" />
{#await fetchUserDescription(username) then userDescription}
	<table class="table-base table-narrow">
		<tbody>
			<tr>
				<td>Username</td>
				<td>
					{userDescription['username']} &nbsp;
					<Fa icon={faCircle} class={getStatusClass(seenLastly(userDescription))} />
				</td>
			</tr>
			<tr>
				<td>Firstname</td>
				<td>{emptyIfNull(userDescription['firstname'])}</td>
			</tr>
			<tr>
				<td>Lastname</td>
				<td>{emptyIfNull(userDescription['lastname'])}</td>
			</tr>
			<tr>
				<td>Role</td>
				<td>{capitalize(userDescription['role_name'])}</td>
			</tr>
			<tr>
				<td>E-mail</td>
				<td>{userDescription['email']}</td>
			</tr>
			<tr>
				<td>Registration date</td>
				<td>{timeStringToDate(userDescription['registration_datetime'])}</td>
			</tr>
		</tbody>
		<tbody>
			<tr>
				<td colspan="2" style="text-align: center; vertical-align: middle">
					<button
						class="text-button"
						onclick={() => {
							setCrudAction('update');
						}}
					>
						Update profile
					</button>
				</td>
			</tr>
			{#if !userDescription['confirmed']}
				<tr>
					<td colspan="2" style="text-align: center; vertical-align: middle">
						<button
							class="text-button"
							onclick={() => {
								setCrudAction('confirm');
							}}
						>
							Confirm account
						</button>
					</td>
				</tr>
			{/if}
			<tr>
				<td colspan="2" style="text-align: center; vertical-align: middle">
					<button
						class="text-button"
						onclick={() => {
							setCrudAction('delete');
						}}
					>
						Delete account
					</button>
				</td>
			</tr>
		</tbody>
	</table>
	<Modal
		bind:this={modals['update']}
		showModal={crudAction === 'update'}
		on:close={resetCrudAction}
		title="Update {$currentUser['username']}'s user info"
	>
		<Form
			data={[
				{ label: 'Username', key: 'username', value: userDescription['username'], disabled: true },
				{ label: 'Firstname', key: 'firstname', value: userDescription['firstname'] },
				{ label: 'Lastname', key: 'lastname', value: userDescription['lastname'] },
				{ label: 'Role', key: 'role_name', value: userDescription['role_name'], disabled: true },
				{ label: 'E-mail', key: 'email', value: userDescription['email'], disabled: true }
			]}
			on:confirm={(event) => {
				const payload = event.detail;
				crudRequest(`user/u/${$currentUser['username']}`, 'update', payload);
				modals['update'].closeModal();
			}}
			on:cancel={() => modals['update'].closeModal()}
		/>
	</Modal>
	<Modal
		bind:this={modals['confirm']}
		showModal={crudAction === 'confirm'}
		on:close={resetCrudAction}
		title="Confirm {$currentUser['username']}'s account"
		confirmationButtons={true}
		on:confirm={() => {
			crudRequest(`user/u/${$currentUser['username']}/confirm`, 'create');
			modals['confirm'].closeModal();
		}}
	>
		<p>Confirm {$currentUser['username']}'s account ?</p>
	</Modal>
	<Modal
		bind:this={modals['delete']}
		showModal={crudAction === 'delete'}
		on:close={resetCrudAction}
		title="Delete {$currentUser['username']}'s account"
		confirmationButtons={true}
		on:confirm={() => {
			crudRequest(`user/u/${$currentUser['username']}/delete`, 'create');
			modals['delete'].closeModal();
		}}
	>
		<p>Are you sure you want to delete {$currentUser['username']}'s account ?</p>
	</Modal>
{/await}
