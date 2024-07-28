import {
	faCloudArrowDown,
	faDatabase,
	faDizzy,
	faFire,
	faHeartbeat,
	faLeaf,
	faLightbulb,
	faMemory,
	faMicrochip,
	faSprayCan,
	faTint,
	faWind
} from '@fortawesome/free-solid-svg-icons';

export let colors = {
	red: '#f0341f',
	orange: '#Ed7c24',
	yellow: '#e9c429',
	green: '#88ae60',
	blue: '#226ba3'
};

export const graphs = {
	environment: {
		colors: {
			default: colors.blue,
			temperature: colors.red,
			humidity: colors.blue,
			absolute_humidity: colors.blue,
			dew_point: colors.red,
			light: colors.yellow
			// AQI: ,
			// eCO2: ,
			// TVOC:
		},
		icons: {
			temperature: faFire,
			humidity: faTint,
			absolute_humidity: faTint,
			dew_point: faFire,
			light: faLightbulb,
			AQI: faWind,
			eCO2: faCloudArrowDown,
			TVOC: faSprayCan
		},
		units: {
			temperature: '°C',
			humidity: ' %',
			absolute_humidity: ' g.m-3',
			dew_point: '°C',
			light: ' lux',
			AQI: '',
			eCO2: ' ppm',
			TVOC: ' ppm'
		},
		min_values: {
			temperature: 15,
			humidity: 0,
			absolute_humidity: 0,
			dew_point: 5,
			light: 0,
			AQI: 0,
			eCO2: 0,
			TVOC: 0
		},
		max_values: {
			temperature: 30,
			humidity: 100,
			absolute_humidity: 15,
			dew_point: 30,
			light: 10000,
			AQI: 5,
			eCO2: 1000,
			TVOC: 1500
		}
	},
	plants: {
		colors: {
			moisture: colors.blue,
			temperature: colors.red
		},
		icons: {
			moisture: faTint,
			temperature: faFire
		},
		units: {
			moisture: ' % RWC',
			temperature: '°C'
		},
		min_values: {
			moisture: 0,
			temperature: 20
		},
		max_values: {
			moisture: 100,
			temperature: 35
		}
	},
	plants_health: {
		measures: {
			green: 'Number of green pixels',
			necrosis: 'Necrosis percentage',
			index: 'Plants health index'
		},
		colors: {
			green: '#307a41',
			necrosis: '#913639',
			index: '#e9c429'
		},
		icons: {
			green: faLeaf,
			necrosis: faDizzy,
			index: faHeartbeat
		},
		list_index: {
			green: 2,
			necrosis: 3,
			index: 1
		},
		max_values: {
			green: 1000,
			necrosis: 100,
			index: 100
		}
	},
	server: {
		labels: {
			CPU_used: 'CPU load',
			CPU_temp: 'CPU temperature',
			RAM_process: 'Process RAM usage',
			RAM_used: 'Total RAM usage',
			DISK_used: 'Disk space used'
		},
		colors: {
			CPU_used: colors.blue,
			CPU_temp: colors.red,
			RAM_process: colors.blue,
			RAM_used: colors.blue,
			DISK_used: colors.blue
		},
		icons: {
			CPU_used: faMicrochip,
			CPU_temp: faFire,
			RAM_process: faMemory,
			RAM_used: faMemory,
			DISK_used: faDatabase
		},
		units: {
			CPU_used: '%',
			CPU_temp: '°C',
			RAM_process: 'GB',
			RAM_used: 'GB',
			DISK_used: 'GB'
		}
	}
};
