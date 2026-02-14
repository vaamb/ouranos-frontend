<script>
	import Form from '$lib/components/Form.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Table from '$lib/components/Table.svelte';

	import { crudRequest, fetchWikiArticles } from '$lib/actions.svelte.js';
	import { capitalize } from '$lib/utils/functions.js';
	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';

	let { data } = $props();

	const topic = $derived(data['topic']);
	const topicName = $derived(topic['name']);
	let articles = $state(data['articles']);

	const joinTags = function (tags) {
		return tags.join(', ');
	};

	const splitTags = function (tags) {
		if (tags === '') return '';
		tags = tags.split(',');
		tags.forEach((tag) => {
			tag = tag.trim();
		});
		return tags;
	};

	let crudAction = $state(null);
	let crudIndex = $state(null);

	const resetModal = function () {
		crudAction = null;
		crudIndex = null;
	};
</script>

<HeaderLine title="{capitalize(topicName)} articles index" />
<Table
	tableID="wikiArticlesTable"
	columns={[
		{ label: 'Name', key: 'name', serializer: capitalize },
		{ label: 'Description', key: 'description', serializer: capitalize },
		{ label: 'Tags', key: 'tags', serializer: joinTags },
		{
			label: 'Link',
			key: 'slug',
			isLink: true,
			serializer: (value) => `/wiki/u/${topic['slug']}/u/${value}`
		}
	]}
	data={articles}
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
	{#snippet title()}{"Create a new article"}{/snippet}
	{#snippet children(closeModal)}
		<Form
			data={[
				{ label: 'Name', key: 'name' },
				{ label: 'Description', key: 'description', required: false },
				{
					label: 'Content',
					key: 'content',
					required: false,
					type: 'file',
					accept: '.md',
					hint: 'A markdown file'
				},
				{
					label: 'Tags',
					key: 'tags',
					required: false,
					deserializer: splitTags,
					hint: 'Comma separated tags'
				}
			]}
			onconfirm={(payload) => {
				let promise;
				if (payload.content !== undefined) {
					// Got a file
					promise = payload.content[0].text();
				} else {
					// Got nothing, create a promise providing an empty text
					promise = new Promise((resolve) => resolve(''));
				}
				promise.then((contentText) => {
					payload.content = contentText;
					crudRequest(`app/services/wiki/topics/u/${topic['slug']}/u`, 'create', payload)
					.then(() => {
						fetchWikiArticles(topic['slug'])
						.then((data) => {
							articles = data;
							closeModal();
						});
					});
				});
			}}
			oncancel={() => closeModal()}
		/>
	{/snippet}
</Modal>
{#if articles[crudIndex]}
	<Modal
		showModal={crudAction === 'delete'}
		onclose={resetModal}
	>
		{#snippet title()}{`Delete ${articles[crudIndex]['name']} article`}{/snippet}
		{#snippet children(closeModal)}
			<p>Are you sure you want to delete '{articles[crudIndex]['name']}' article ?</p>
			<ConfirmButtons
				onconfirm={() => {
					crudRequest(
						`app/services/wiki/topics/u/${topic['slug']}/u/${articles[crudIndex]['slug']}`,
						'delete'
					).then(() => {
						fetchWikiArticles(topic['slug']).then((data) => {
							articles = data;
							closeModal();
						});
					});
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
{/if}
