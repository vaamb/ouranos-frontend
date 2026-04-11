<script>
	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';
	import Form from '$lib/components/Form.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Table from '$lib/components/Table.svelte';

	import { crudRequest, fetchWikiTopics } from '$lib/actions.svelte.js';
	import { servicesState } from '$lib/store.svelte.js';
	import { capitalize, joinTags, splitTags } from '$lib/utils/functions.js';

	const refreshTopics = function () {
		fetchWikiTopics().then((data) => {
			servicesState.wikiTopics = data;
		});
	};

	let crudAction = $state(null);
	let crudIndex = $state(null);

	const resetModal = function () {
		crudAction = null;
		crudIndex = null;
	};
</script>

<HeaderLine title="Topics index" />

<Table
	tableID="wikiTopicsTable"
	columns={[
		{ label: 'Name', key: 'name', serializer: capitalize },
		{ label: 'Description', key: 'description', serializer: capitalize },
		{ label: 'Tags', key: 'tags', serializer: joinTags },
		{ label: 'Link', key: 'slug', isLink: true, serializer: (value) => `/wiki/u/${value}` }
	]}
	data={servicesState.wikiTopics}
	editable={true}
	oncrud={(payload) => {
		crudAction = payload['action'];
		crudIndex = payload['rowIndex'];
	}}
/>

<Modal
	showModal={crudAction === 'create'}
	onclose={resetModal}
>
	{#snippet title()}{"Create a new topic"}{/snippet}
	{#snippet children(closeModal)}
		<Form
			data={[
				{ label: 'Name', key: 'name' },
				{ label: 'Description', key: 'description', required: false },
				{
					label: 'Tags',
					key: 'tags',
					hint: 'Comma separated tags',
					required: false,
					deserializer: splitTags
				}
			]}
			onconfirm={(payload) => {
				crudRequest(`app/services/wiki/topics/u`, 'create', payload).then(() => refreshTopics());
				closeModal();
			}}
			oncancel={() => closeModal()}
		/>
	{/snippet}
</Modal>
{#if servicesState.wikiTopics[crudIndex]}
	<Modal
		showModal={crudAction === 'update'}
		onclose={resetModal}
	>
		{#snippet title()}{`Update ${servicesState.wikiTopics[crudIndex]['name']} topic`}{/snippet}
		{#snippet children(closeModal)}
			<Form
				data={[
					{ label: 'Name', key: 'name', value: servicesState.wikiTopics[crudIndex]['name'], type: 'text' },
					{
						label: 'Description',
						key: 'description',
						value: servicesState.wikiTopics[crudIndex]['description'],
						required: false
					},
					{
						label: 'Tags',
						key: 'tags',
						value: servicesState.wikiTopics[crudIndex]['tags'],
						hint: 'Comma separated tags',
						required: false,
						serializer: joinTags,
						deserializer: splitTags
					}
				]}
				onconfirm={(payload) => {
					crudRequest(
						`app/services/wiki/topics/u/${servicesState.wikiTopics[crudIndex]['name']}`,
						'update',
						payload
					).then(() => refreshTopics());
					closeModal();
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
	<Modal
		showModal={crudAction === 'delete'}
		onclose={resetModal}
	>
		{#snippet title()}{`Delete ${servicesState.wikiTopics[crudIndex]['name']} topic`}{/snippet}
		{#snippet children(closeModal)}
			<p>Are you sure you want to delete '{servicesState.wikiTopics[crudIndex]['name']}' topic ?</p>
			<ConfirmButtons
				onconfirm={() => {
					crudRequest(`app/services/wiki/topics/u/${servicesState.wikiTopics[crudIndex]['name']}`, 'delete')
					.then(
						() => refreshTopics()
					);
					closeModal();
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
{/if}
