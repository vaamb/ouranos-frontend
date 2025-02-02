import { error } from '@sveltejs/kit';

import { slugify } from '$lib/utils/functions.js';

export async function load({ params, parent }) {
	const data = await parent();
	const articles = data['wikiArticles'];
	const article = Object.values(articles).find((article) => {
		return slugify(article['name']) === params['article'];
	});

	if (article === undefined) {
		error(404, 'Not found');
	}

	return {
		article: article,
	};
}
