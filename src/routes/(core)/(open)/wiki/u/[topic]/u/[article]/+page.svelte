<script>
	import { onMount } from 'svelte';

	import Fa from 'svelte-fa';
	import { faPenNib } from '@fortawesome/free-solid-svg-icons';

	import axios from 'axios';
	import { marked } from 'marked';

	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';

	import { crudRequest, fetchWikiPictures } from '$lib/actions.svelte.js';
	import { currentUser } from '$lib/store.svelte.js';
	import { permissions, STATIC_URL } from '$lib/utils/consts.js';
	import { capitalize } from '$lib/utils/functions.js';

	let { data } = $props();

	let article = data['article'];
	let pictures = $state(undefined);
	let content = $state();

	// Inject picture URL during parsing
	const regexPicture = /!picture:[a-zA-Z0-9_.]*!/;
	const renderer = {
		image({ href, title, text }) {
			const styling = href.split('&');
			href = styling.shift();
			if (regexPicture.test(href)) {
				const value = href.replace('!picture:', '').replace('!', '');
				let picture = Object.values(pictures).find((picture) => {
					return picture['name'] === value;
				});
				if (picture === undefined) {
					// TODO: use a not def symbol
				} else {
					href = `${STATIC_URL}/${picture['path']}`;
				}
			}
			let out = '<img src="' + href + '" alt="' + text + '"';

			if (title) {
				out += ' title="' + title + '"';
			}

			if (styling) {
				out += ' style="';
				for (const [index, style] of styling.entries()) {
					const [option, param] = style.split('=');
					out += option + ': ' + param;
					if (index < styling.length - 1) {
						out += '; ';
					}
				}
				out += '"';
			}

			out += this.options.xhtml ? '/>' : '>';
			return out;
		}
	};
	marked.use({ renderer });

	// Update text
	let modal = $state();

	let updatingContent = $state(null);
	let parsedUpdatingContent = $derived.by(() => {
		if (updatingContent) return marked(updatingContent);
	});

	// Mount
	onMount(async () => {
		pictures = await fetchWikiPictures(article['topic_slug'], article['slug']);
		content = await axios.get(`${STATIC_URL}/${article['path']}?${new Date().getTime()}`).then((response) => {
			return response.data;
		});
	});
</script>

{#snippet update()}
	{#if $currentUser.can(permissions.OPERATE)}
		<button
			class="reset-button"
			style="margin-left: 20px; cursor: pointer"
			onclick={() => {
				updatingContent = content;
			}}
		>
			<Fa icon={faPenNib} />
		</button>
	{/if}
{/snippet}

<HeaderLine title={capitalize(article.name)} sideBloc={update} />

<div class="text">
	{#if content && pictures !== undefined}
		{@html marked(content)}
	{/if}
</div>

<Modal
	bind:this={modal}
	showModal={updatingContent !== null}
	on:close={() => {
		updatingContent = null;
	}}
>
	<div class="editor">
		<textarea class="text-box" bind:value={updatingContent} style="width: 100%; resize: none"></textarea>
		<div class="text-box rendered">
			{@html parsedUpdatingContent}
		</div>
		<div class="center-content" style="grid-column: 1/3; grid-row: 2/3">
			<button
				class="text-button"
				onclick={() => {
					crudRequest(
						`app/services/wiki/topics/u/${article['topic_slug']}/u/${article['slug']}`,
						'update',
						{ "content": updatingContent }
					);
					content = updatingContent;
					modal.closeModal();
				}}
			>
				Save
			</button>
		</div>
	</div>
</Modal>

<style>
	.rendered :global(ul) {
		padding-left: 40px;
	}

	.rendered :global(ol) {
		padding-left: 40px;
	}

	.rendered :global(img) {
		float: left;
		object-fit: cover;
	}

	.text-box {
		padding: 5px;
	}

	.rendered {
		border: thin solid var(--main-50-shadow);
	}

	@media only screen and (max-width: 992px) {
		.editor {
			width: 80vw;
			height: 70vh;
			display: grid;
			grid-template-rows: 1fr 1fr 1em 1em;
			grid-gap: 1em;
		}
	}

	@media only screen and (min-width: 992px) {
		.editor {
			width: 1200px;
			height: 70vh;
			display: grid;
			grid-template:
				'a b' 1fr
				'c c' 1em / 1fr 1fr;
			grid-template-rows: 1fr 1em;
			grid-gap: 2em;
		}
	}
</style>
