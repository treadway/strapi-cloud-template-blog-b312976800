module.exports = {
	routes: [
		{
			method: "POST",
			path: "/auth/send-code",
			handler: "auth.sendVerificationCode",
			config: {
				auth: false,
				policies: [],
			},
		},
		{
			method: "POST",
			path: "/auth/verify-code",
			handler: "auth.verifyCodeAndAuth",
			config: {
				auth: false,
				policies: [],
			},
		},
	],
};
