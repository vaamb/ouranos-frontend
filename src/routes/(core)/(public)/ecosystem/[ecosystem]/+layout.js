import { error } from '@sveltejs/kit';

import { slugify } from '$lib/utils/functions.js';

export async function load({ params, parent }) {
	const data = await parent();
	const ecosystems = data['ecosystems'];
	const ecosystem = Object.values(ecosystems).find((ecosystem) => {
		return slugify(ecosystem['name']) === params['ecosystem'];
	})
	if (ecosystem === undefined) {
		error(404, 'Not found');
	}
	return {
		ecosystemUID: ecosystem.uid,
		ecosystemName: ecosystem.name
	}
}
