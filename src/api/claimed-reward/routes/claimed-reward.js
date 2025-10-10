module.exports = {
	routes: [
		{
			method: "GET",
			path: "/claimed-rewards/:id/pass",
			handler: "claimed-reward.generatePass",
			config: {
				auth: false, // Set to true if you want authentication
			},
		},
	],
};
