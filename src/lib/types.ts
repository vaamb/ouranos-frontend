export interface User {
	username: string | null;
	firstname: string | null;
	lastname: string | null;
	permissions: number;
	iat: number | null;
	isAuthenticated: boolean;
	isAnonymous: boolean;
	isConfirmed: boolean;
	lastSeen: Date | null;
	avatar: string;
	sessionToken: string | null;
	can: (perm: number) => boolean;
	flatten: () => Omit<User, 'can' | 'flatten'>;
}

export interface FlashMessage {
	level: number;
	title: string;
	description: string;
}
