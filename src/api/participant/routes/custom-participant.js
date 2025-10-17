module.exports = {
	routes: [
		{
			method: "GET",
			path: "/participants/check-phone/:phone",
			handler: "participant.checkPhone",
			config: {
				auth: false, // Public access
			},
		},
	],
};
