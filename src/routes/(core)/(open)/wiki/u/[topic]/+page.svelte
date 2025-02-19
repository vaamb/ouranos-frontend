<script>
	import Form from '$lib/components/Form.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Table from '$lib/components/Table.svelte';

	import { crudRequest, fetchWikiArticles } from '$lib/actions.svelte.js';
	import { capitalize } from '$lib/utils/functions.js';

	let { data } = $props();

	const topic = data['wikiTopic'];
	const topicName = topic['name'];
	let wikiArticles = $state(data.wikiArticles);

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

	let modal = $state({});
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
	data={wikiArticles}
	editable={true}
	on:crud={(event) => {
		crudAction = event['detail']['action'];
		crudIndex = event['detail']['rowIndex'];
	}}
/>

<Modal
	bind:this={modal['create']}
	showModal={crudAction === 'create'}
	on:close={resetModal}
	title="Create a new article"
>
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
		on:confirm={(event) => {
			const payload = event.detail;
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
						wikiArticles = data;
						modal['create'].closeModal();
					});
				});
			});
		}}
		on:cancel={() => modal['create'].closeModal()}
	/>
</Modal>
{#if wikiArticles[crudIndex]}
	<Modal
		bind:this={modal['delete']}
		showModal={crudAction === 'delete'}
		title={`Delete ${wikiArticles[crudIndex]['name']} article`}
		confirmationButtons={true}
		on:close={resetModal}
		on:confirm={() => {
			crudRequest(
				`app/services/wiki/topics/u/${topic['slug']}/u/${wikiArticles[crudIndex]['slug']}`,
				'delete'
			).then(() => {
				fetchWikiArticles(topic['slug']).then((data) => {
					wikiArticles = data;
					modal['delete'].closeModal();
				});
			});
		}}
	>
		<p>Are you sure you want to delete '{wikiArticles[crudIndex]['name']}' article ?</p>
	</Modal>
{/if}
