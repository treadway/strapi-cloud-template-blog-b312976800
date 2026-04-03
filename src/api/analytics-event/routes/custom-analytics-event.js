"use strict";

/**
 * Custom analytics-event routes — batch endpoint
 *
 * Strapi v5 loads ALL .js files in the routes/ directory,
 * so this sits alongside the core router automatically.
 */

module.exports = {
	routes: [
		{
			method: "POST",
			path: "/analytics-events/batch",
			handler: "analytics-event.batch",
			config: {
				auth: false,
			},
		},
	],
};
