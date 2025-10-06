export default [
	{
		method: "POST",
		path: "/send-code",
		handler: "auth.sendVerificationCode", // Calls sendVerificationCode in controller
		config: {
			auth: false, // No authentication needed for this route
		},
	},
	{
		method: "POST",
		path: "/verify-code",
		handler: "auth.verifyCodeAndAuth", // Calls verifyCodeAndAuth in controller
		config: {
			auth: false, // No authentication needed for this route
		},
	},
];
