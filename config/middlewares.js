module.exports = [
	"strapi::logger",
	"strapi::errors",
	{
		name: "strapi::security",
		config: {
			contentSecurityPolicy: {
				useDefaults: true,
				directives: {
					"connect-src": ["'self'", "https:", "http://localhost:8081"],
					"img-src": ["'self'", "data:", "blob:", "https:"],
					"media-src": ["'self'", "data:", "blob:", "https:"],
					upgradeInsecureRequests: null,
				},
			},
		},
	},
	{
		name: "strapi::cors",
		config: {
			enabled: true,
			origin: ["*"],
			headers: ["Content-Type", "Authorization", "Origin", "Accept"],
			methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		},
	},
	"strapi::poweredBy",
	"strapi::query",
	"strapi::body",
	"strapi::session",
	"strapi::favicon",
	"strapi::public",
	"global::filterByOwner",
];
