export function createUser(userObject = {}) {
	const username = userObject['username'] || null;
	const isAuthenticated = userObject['isAuthenticated'] || userObject['is_authenticated'] || false;
	const lastSeen = userObject['lastSeen'] || userObject['last_seen'] || null;
	return {
		username: username,
		firstname: userObject['firstname'] || null,
		lastname: userObject['lastname'] || null,
		permissions: userObject['permissions'] || 0,
		iat: userObject.iat || null,
		isAuthenticated: isAuthenticated,
		isAnonymous: !isAuthenticated,
		isConfirmed: userObject['isConfirmed'] || userObject['is_confirmed'] || false,
		lastSeen: lastSeen ? new Date(lastSeen) : null,
		avatar: userObject['avatar'] || 'seedling', // TODO: for later
		can: function (perm) {
			if (perm === undefined) {
				return false;
			}
			return (this.permissions & perm) === perm;
		},
		flatten: function () {
			return {
				username: this.username,
				firstname: this.firstname,
				lastname: this.lastname,
				permissions: this.permissions,
				iat: this.iat,
				isAuthenticated: this.isAuthenticated,
				isAnonymous: this.isAnonymous,
				isConfirmed: this.isConfirmed,
				lastSeen: this.lastSeen,
				avatar: this.avatar
			};
		}
	};
}

// The `id` is what `Toasts.svelte` keys its stack and its timers on: several
// toasts can be on screen at once, each with its own clock, so they cannot be
// addressed by their position in `appState.flashMessages`.
let flashMessageId = 0;

// `tone` is what the toast draws: a 'good' message is a receipt and leaves on
// its own, a 'bad' one carries a `--critical-red` rail and stays until it is
// dismissed.
export const createFlashMessage = function (
	message,
	title = undefined,
	timeOut = undefined,
	tone = 'good'
) {
	flashMessageId += 1;
	return { id: flashMessageId, message: message, title: title, timeOut: timeOut, tone: tone };
};
