module.exports = {
	routes: [
		{
			method: "POST",
			path: "/auth/send-code",
			handler: "auth.sendVerificationCode",
			config: {
				policies: [],
				middlewares: [],
			},
		},
		{
			method: "POST",
			path: "/auth/verify-code",
			handler: "auth.verifyCodeAndAuth",
			config: {
				policies: [],
				middlewares: [],
			},
		},
	],
};
