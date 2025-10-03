module.exports = [
	"strapi::logger",
	"strapi::errors",
	{
		name: "strapi::security",
		config: {
			contentSecurityPolicy: {
				useDefaults: true,
				directives: {
					"connect-src": ["'self'", "https:"],
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
			origin: ["*"], // For testing - restrict this later
		},
	},
	"strapi::security",
	"strapi::cors",
	"strapi::poweredBy",
	"strapi::query",
	"strapi::body",
	"strapi::session",
	"strapi::favicon",
	"strapi::public",
];
