module.exports = {
	routes: [
		// ✅ Default CRUD routes - require authentication
		{
			method: "GET",
			path: "/claimed-rewards",
			handler: "claimed-reward.find",
			config: {
				policies: [],
			},
		},
		{
			method: "GET",
			path: "/claimed-rewards/:id",
			handler: "claimed-reward.findOne",
			config: {
				policies: [],
			},
		},
		{
			method: "POST",
			path: "/claimed-rewards",
			handler: "claimed-reward.create",
			config: {
				policies: [],
			},
		},
		{
			method: "PUT",
			path: "/claimed-rewards/:id",
			handler: "claimed-reward.update",
			config: {
				policies: [],
			},
		},
		{
			method: "DELETE",
			path: "/claimed-rewards/:id",
			handler: "claimed-reward.delete",
			config: {
				policies: [],
			},
		},

		// ✅ Custom pass generator - AUTHENTICATED
		{
			method: "GET",
			path: "/claimed-rewards/:id/pass",
			handler: "claimed-reward.generatePass",
			config: {
				policies: [],
				// This will use default authentication
				// User must be logged in to generate pass
			},
		},
	],
};
