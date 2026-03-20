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

		// ✅ Custom pass generator - PUBLIC but with ownership check in controller
		{
			method: "GET",
			path: "/claimed-rewards/:id/pass",
			handler: "claimed-reward.generatePass",
			config: {
				auth: false, // Public route
				policies: [],
			},
		},

		// ✅ Cancel a claimed reward - sets status to "cancelled"
		// Uses token from query param (same pattern as generatePass)
		{
			method: "PUT",
			path: "/claimed-rewards/:id/cancel",
			handler: "claimed-reward.cancelClaim",
			config: {
				auth: false, // Public route with manual auth in controller
				policies: [],
			},
		},
	],
};
