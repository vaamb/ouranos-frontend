export function User(userObject = {}, sessionToken = null) {
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
		sessionToken: userObject['sessionToken'] || sessionToken,
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
				avatar: this.avatar,
				sessionToken: this.sessionToken
			};
		}
	};
}

export const Message = function (message, title = undefined, timeOut = undefined) {
	return { message: message, title: title, timeOut: timeOut };
};
