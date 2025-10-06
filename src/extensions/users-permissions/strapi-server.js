import controllers from "./server/controllers/index.js";
import routes from "./server/routes/index.js";

export default (plugin) => {
	// Merge custom controllers
	plugin.controllers = {
		...plugin.controllers,
		...controllers,
	};

	// Merge custom routes into content-api
	plugin.routes["content-api"].routes = [
		...plugin.routes["content-api"].routes,
		...routes["content-api"].routes,
	];

	return plugin;
};
