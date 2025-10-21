module.exports = [
	"strapi::logger",
	"strapi::errors",
	{
		name: "strapi::cors",
		config: {
			enabled: true,
			origin: ["http://localhost:8081", "exp://", "*"],
			credentials: true,
		},
	},
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
	"strapi::poweredBy",
	"strapi::query",
	"strapi::body",
	"strapi::session",
	"strapi::favicon",
	"strapi::public",
	"global::filterByOwner",
];
