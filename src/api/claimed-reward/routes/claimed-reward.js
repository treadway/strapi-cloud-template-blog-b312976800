module.exports = {
	routes: [
		// ✅ Default CRUD routes
		{
			method: "GET",
			path: "/claimed-rewards",
			handler: "claimed-reward.find",
			auth: false,
		},
		{
			method: "GET",
			path: "/claimed-rewards/:id",
			handler: "claimed-reward.findOne",
			auth: false,
		},
		{
			method: "POST",
			path: "/claimed-rewards",
			handler: "claimed-reward.create",
			auth: false,
		},
		{
			method: "PUT",
			path: "/claimed-rewards/:id",
			handler: "claimed-reward.update",
			auth: false,
		},
		{
			method: "DELETE",
			path: "/claimed-rewards/:id",
			handler: "claimed-reward.delete",
			auth: false,
		},

		// ✅ Your custom pass generator
		{
			method: "GET",
			path: "/claimed-rewards/:id/pass",
			handler: "claimed-reward.generatePass",
			auth: false,
		},
	],
};
