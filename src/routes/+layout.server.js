import {error} from "@sveltejs/kit";

import { APP_MODE, AppMode } from "../conf.js";
import { fetchCurrentUserData, fetchServerInfo } from "$lib/actions.js";

export async function load({ cookies }) {
  const cookie = "session=" + cookies.get("session")
  const rv = {
    development: APP_MODE === AppMode.development,
  }
  const {appVersion, serverStatus} = await fetchServerInfo();
  rv.appVersion = appVersion;
  rv.serverStatus = serverStatus;

  const { currentUserData } = await fetchCurrentUserData(cookie)
  rv.userData = currentUserData

  switch (APP_MODE) {
  case AppMode.development:
  case AppMode.testing:
  case AppMode.production:
    rv.maintenance = false;
    return rv;
  case AppMode.maintenance:
    rv.maintenance = true;
    return rv;
  default:
    throw error(
      500,
      "We are experiencing an unexpected issue, come back later"
    );
  }
}