<script>
	import Fa from 'svelte-fa';
	import { faCircle } from '@fortawesome/free-solid-svg-icons';

	import Form from '$lib/components/Form.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';

	import { crudRequest, fetchUserDescription } from '$lib/actions.js';
	import { currentUser } from '$lib/store.js';
	import { capitalize, getStatusClass, timeStringToDate } from '$lib/utils/functions.js';

	// Modal-related variables and functions
	let closeModals = {};
	let crudAction = undefined;

	const setCrudAction = function (action) {
		crudAction = action;
	};

	const resetCrudAction = function () {
		crudAction = undefined;
	};
</script>

<HeaderLine title="{$currentUser['username']}'s profile" />
{#await fetchUserDescription($currentUser['username']) then userDescription}
	<table class="table-base table-narrow">
		<tbody>
			<tr>
				<td>Username</td>
				<td>
					{userDescription['username']} &nbsp;
					<Fa icon={faCircle} class={getStatusClass(userDescription['confirmed'])} />
				</td>
			</tr>
			<tr>
				<td>Firstname</td>
				<td>{userDescription['firstname']}</td>
			</tr>
			<tr>
				<td>Lastname</td>
				<td>{userDescription['lastname']}</td>
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
						on:click={() => {
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
							on:click={() => {
								setCrudAction('confirm');
							}}
						>
							Confirm profile
						</button>
					</td>
				</tr>
			{/if}
			<tr>
				<td colspan="2" style="text-align: center; vertical-align: middle">
					<button
						class="text-button"
						on:click={() => {
							setCrudAction('delete');
						}}
					>
						Delete profile
					</button>
				</td>
			</tr>
		</tbody>
	</table>
	<Modal
		bind:closeModal={closeModals['update']}
		showModal={crudAction === 'update'}
		on:close={resetCrudAction}
		title="Update {$currentUser['username']}'s info"
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
				closeModals['update']();
			}}
			on:cancel={closeModals['update']}
		/>
	</Modal>
	<Modal
		bind:closeModal={closeModals['confirm']}
		showModal={crudAction === 'confirm'}
		on:close={resetCrudAction}
		title="Confirm {$currentUser['username']}'s profile"
		confirmationButtons={true}
		on:confirm={() => {
			crudRequest(`user/u/${$currentUser['username']}/confirm`, 'create');
			closeModals['update']();
		}}
	>
		<p>Send an e-mail to confirm {$currentUser['username']}'s account ?</p>
	</Modal>
		<Modal
		bind:closeModal={closeModals['delete']}
		showModal={crudAction === 'delete'}
		on:close={resetCrudAction}
		title="Confirm {$currentUser['username']}'s profile"
		confirmationButtons={true}
		on:confirm={() => {
			crudRequest(`user/u/${$currentUser['username']}/delete`, 'create');
			closeModals['delete']();
		}}
	>
		<p>Send an e-mail to request the deletion of {$currentUser['username']}'s account ?</p>
	</Modal>
{/await}
