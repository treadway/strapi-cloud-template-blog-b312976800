module.exports = {
	routes: [
		{
			method: "POST",
			path: "/auth/send-code",
			handler: "twilio-auth.sendCode",
			config: {
				auth: false, // Public endpoint
				policies: [],
				middlewares: [],
			},
		},
		{
			method: "POST",
			path: "/auth/verify-code",
			handler: "twilio-auth.verifyCode",
			config: {
				auth: false, // Public endpoint
				policies: [],
				middlewares: [],
			},
		},
	],
};
