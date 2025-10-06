const routes = [
	{
		method: "POST",
		path: "/auth/send-code",
		handler: "auth.sendVerificationCode",
		config: {
			auth: false,
			prefix: "",
		},
	},
	{
		method: "POST",
		path: "/auth/verify-code",
		handler: "auth.verifyCodeAndAuth",
		config: {
			auth: false,
			prefix: "",
		},
	},
];

export default routes;
