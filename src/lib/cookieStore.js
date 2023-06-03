// Modified from https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/Svelte_stores

import { writable } from "svelte/store";
import { browser } from "$app/environment";

import { setCookie } from "$lib/utils/functions.js";

export const cookieStore = (key, initial) => {
  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    set: (value) => {
      if (browser) {
        setCookie(key, JSON.stringify(value))
      }
      return set(value);
    },
    update
  }
}
