import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// Vite blocks requests whose `Host` header is neither an IP address nor
// "localhost". A reverse proxy that rewrites `Host` (such as nginx) therefore
// gets a 403.
const allowedHostsEnv = process.env['OURANOS_FRONTEND_ALLOWED_HOSTS'] || '';
const allowedHosts = allowedHostsEnv.trim() === '*'
	? true
	: allowedHostsEnv.split(',').map((host) => host.trim()).filter(Boolean);

export default defineConfig({
	plugins: [
		enhancedImages(),
		sveltekit()
	],
	server: {
		allowedHosts: allowedHosts
	},
	preview: {
		allowedHosts: allowedHosts
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
