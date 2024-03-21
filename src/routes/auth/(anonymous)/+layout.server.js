import { redirect } from '@sveltejs/kit';

import { User } from "$lib/utils/factories.js";

export async function load({ parent }) {
    const data = await parent();
    const currentUser = User(data.userData)

    if (! currentUser.isAnonymous) {
        throw redirect(307, '/')
    }
}
