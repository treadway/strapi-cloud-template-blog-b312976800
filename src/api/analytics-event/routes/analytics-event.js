"use strict";

/**
 * analytics-event routes
 *
 * Core CRUD routes + custom batch endpoint.
 */

const { createCoreRouter } = require("@strapi/strapi").factories;

// Standard CRUD
const coreRoutes = createCoreRouter("api::analytics-event.analytics-event");

// Custom batch route
module.exports = {
	routes: [
		// Batch must come BEFORE the core wildcard routes
		{
			method: "POST",
			path: "/analytics-events/batch",
			handler: "analytics-event.batch",
			config: {
				policies: [],
				middlewares: [],
			},
		},
		// Spread core routes after
		...coreRoutes.routes,
	],
};
