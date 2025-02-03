<script>
	import { onMount } from 'svelte';

	import Fa from 'svelte-fa';
	import { faNotdef } from '@fortawesome/free-solid-svg-icons';

	import axios from 'axios';
	import { marked } from 'marked';

	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';

	import { fetchWikiPictures } from "$lib/actions.svelte.js";
	import { STATIC_URL } from '$lib/utils/consts.js';
	import { capitalize } from '$lib/utils/functions.js';

	let { data } = $props();

	let article = data.article;
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

	let modal = $state()

	let updatingContent = $state(null);
	let parsedUpdatingContent = $derived.by(() => {
		if (updatingContent) return marked(updatingContent);
	});

	onMount(async () => {
		pictures = await fetchWikiPictures(article["topic"], article["name"])
		content = await axios.get(`${STATIC_URL}/${article['path']}`).then((response) => {
			return response.data;
		});
	});
</script>

<HeaderLine title={capitalize(article.name)} />
<button onclick={() => updatingContent = content}>Update</button>
<div class="text">
	{#if content && pictures !== undefined}
		{@html marked(content)}
	{/if}
</div>

<Modal
	bind:this={modal}
	onclose={() => updatingContent = null}
>
	<textarea bind:value={updatingContent}></textarea>
	{@html marked(content)}
</Modal>

<style>
	.img {
		float: left;
		object-fit: cover;
	}
</style>
