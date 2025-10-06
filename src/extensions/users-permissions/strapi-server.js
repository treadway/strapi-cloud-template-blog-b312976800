export default (plugin) => {
	// --- keep or merge your custom routes/controllers ---
	const customControllers = require("./server/controllers");
	const customRoutes = require("./server/routes");

	// Merge controllers
	plugin.controllers = {
		...plugin.controllers,
		...customControllers,
	};

	// Merge content-api routes
	plugin.routes["content-api"].routes = [
		...plugin.routes["content-api"].routes,
		...customRoutes["content-api"].routes,
	];

	return plugin;
};
