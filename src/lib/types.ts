// App state
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

// Gaia state
export interface Ecosystem {
	uid: string;
	engine_uid: string;
	name: string;
	registration_date: Date;
	in_config: boolean;
	management_value: number;
}

export interface EcosystemState {
	status: boolean;
	last_seen: Date;
	connected: boolean;
}

export interface EcosystemActuatorState {
	type: number;
	active: boolean;
	mode: 'manual' | 'automatic';
	status: boolean;
	level: number;
}

export interface EcosystemManagement {
	uid: string;
	name: string;
	actuators: boolean;
	ecosystem_data: boolean;
	environment_data: boolean;
	plants_data: boolean;
	recent_picture: boolean;
	sensors: boolean;
	light: boolean;
	camera: boolean;
	database: boolean;
	weather: boolean;
	alarms: boolean;
	climate: boolean;
	watering: boolean;
	health: boolean;
	pictures: boolean;
}

interface EcosystemIDs {
	uid: string;
	name: string;
}

export interface Engine {
	uid: string;
	sid: string; // a stringified uuid
	registration_date: Date;
	address: string;
	ecosystems: Array<EcosystemIDs>;
}

export interface EngineState {
	last_seen: Date;
	connected: boolean;
}
