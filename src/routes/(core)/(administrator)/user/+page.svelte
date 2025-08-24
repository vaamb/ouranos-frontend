<script>
	import { crudRequest, fetchUsers } from '$lib/actions.svelte.js';
	import { capitalize, formatDateTime, isEmailValid } from '$lib/utils/functions.js';

	import Form from '$lib/components/Form.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Table from '$lib/components/Table.svelte';

	let page = $state(0);

	let modals = $state({});
	let crudAction = $state(null);
	let crudIndex = $state(null);

	const resetModal = function () {
		crudAction = null;
		crudIndex = null;
	};
</script>

{#await fetchUsers(page) then users}
	<Table
		tableID="usersTable"
		columns={[
			{ label: 'Username', key: 'username' },
			{ label: 'Email', key: 'email' },
			{ label: 'Role', key: 'role_name', serializer: capitalize },
			{ label: 'Firstname', key: 'firstname' },
			{ label: 'Lastname', key: 'lastname' },
			{
				label: 'Creation',
				key: 'created_at',
				serializer: (value) => formatDateTime(new Date(value))
			},
			{
				label: 'Confirmation',
				key: 'confirmed_at',
				serializer: (value) => (value ? formatDateTime(new Date(value)) : '')
			},
			{
				label: 'Link',
				key: 'username',
				isLink: true,
				serializer: (value) => `/user/u/${value}/profile`
			}
		]}
		data={users}
		editable={true}
		crudOptions={['create', 'delete']}
		oncrud={(payload) => {
			crudAction = payload['action'];
			crudIndex = payload['rowIndex'];
		}}
	/>
	<Modal
		bind:this={modals['create']}
		showModal={crudAction === 'create'}
		onclose={resetModal}
		title="Invite a new user"
	>
		<Form
			data={[
				{ label: 'Username', key: 'username', required: false },
				{ label: 'Email', key: 'email', validate: isEmailValid },
				{
					label: 'Role',
					key: 'role',
					selectFrom: ['User', 'Operator'],
					value: 'User'
				},
				{ label: 'Firstname', key: 'firstname', required: false },
				{ label: 'Lastname', key: 'lastname', required: false }
			]}
			onconfirm={(payload) => {
				crudRequest(`auth/registration_token?send_email=true`, 'create', payload);
				modals['create'].closeModal();
			}}
			oncancel={() => modals['create'].closeModal()}
		/>
	</Modal>
	<Modal
		bind:this={modals['delete']}
		showModal={crudAction === 'delete'}
		title={users[crudIndex] ? `Delete ${users[crudIndex]['username']}?` : ''}
		onclose={resetModal}
		onconfirm={() => {
			crudRequest(`user/u/${users[crudIndex]['username']}`, 'delete');
			modals['delete'].closeModal();
		}}
	>
		<p>Are you sure you want to delete {users[crudIndex]['username']}?</p>
	</Modal>
{/await}
