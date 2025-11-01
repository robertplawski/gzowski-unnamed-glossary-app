export default function getServerUrl() {
	return import.meta.env.WORKERS_CI_BRANCH &&
		import.meta.env.MODE !== "production"
		? `https://${import.meta.env.WORKERS_CI_BRANCH}-gzowski-unnamed-glossary-app-server.rp8.workers.dev`
		: import.meta.env.VITE_SERVER_URL;
}
