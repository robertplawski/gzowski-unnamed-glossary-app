export default function getServerUrl() {
	return (
		import.meta.env.VITE_SERVER_URL ||
		`https://${import.meta.env.WORKERS_CI_BRANCH || "main"}.gzowski-unnamed-glossary-app-server.rp8.workers.dev`
	);
}
