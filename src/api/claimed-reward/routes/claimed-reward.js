module.exports = {
	routes: [
		// ✅ Default CRUD routes
		{
			method: "GET",
			path: "/claimed-rewards",
			handler: "claimed-reward.find",
			config: { auth: true },
		},
		{
			method: "GET",
			path: "/claimed-rewards/:id",
			handler: "claimed-reward.findOne",
			config: { auth: true },
		},
		{
			method: "POST",
			path: "/claimed-rewards",
			handler: "claimed-reward.create",
			config: { auth: true },
		},
		{
			method: "PUT",
			path: "/claimed-rewards/:id",
			handler: "claimed-reward.update",
			config: { auth: true },
		},
		{
			method: "DELETE",
			path: "/claimed-rewards/:id",
			handler: "claimed-reward.delete",
			config: { auth: true },
		},

		// ✅ Your custom pass generator
		{
			method: "GET",
			path: "/claimed-rewards/:id/pass",
			handler: "claimed-reward.generatePass",
			config: { auth: false },
		},
	],
};
