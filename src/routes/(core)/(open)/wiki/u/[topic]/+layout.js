import { error } from '@sveltejs/kit';

import { slugify } from '$lib/utils/functions.js';
import { fetchWikiArticles } from '$lib/actions.svelte.js';

export async function load({ params, parent }) {
	const data = await parent();
	const topics = data['wikiTopics'];
	const topic = Object.values(topics).find((topic) => {
		return slugify(topic['name']) === params['topic'];
	});

	if (topic === undefined) {
		error(404, 'Not found');
	}

	const articles = await fetchWikiArticles(topic.name);

	return {
		topicName: topic.name,
		wikiArticles: articles
	};
}
