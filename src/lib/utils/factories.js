export function User(userObject = {}) {
	const username = userObject.username || null;
	const permissions = userObject.permissions || 0;
	let auth = false;
	if (username) {
		auth = true;
	}
	return {
		username: username,
		firstname: userObject.firstname || null,
		lastname: userObject.lastname || null,
		permissions: permissions,
		iat: userObject.iat || null,
		isAuthenticated: auth,
		isAnonymous: !auth,
		isConfirmed: userObject.is_confirmed || null,

		avatar: 'seedling', // TODO: for later
		can: function (perm) {
			if (perm === undefined) {
				return false;
			}
			return (permissions & perm) === perm;
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
				avatar: this.avatar
			};
		}
	};
}

export const Message = function (message, title = undefined, timeOut = undefined) {
	return { message: message, title: title, timeOut: timeOut };
};
