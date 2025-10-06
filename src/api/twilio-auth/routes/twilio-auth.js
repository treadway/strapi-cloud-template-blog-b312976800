module.exports = {
	routes: [
		{
			method: "POST",
			path: "/twilio-auth/send-code",
			handler: "twilio-auth.sendCode",
			config: {
				auth: false,
			},
		},
		{
			method: "POST",
			path: "/twilio-auth/verify-code",
			handler: "twilio-auth.verifyCode",
			config: {
				auth: false,
			},
		},
	],
};
