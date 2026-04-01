module.exports = ({ env }) => ({
	"users-permissions": {
		enabled: true,
		config: {
			jwt: {
				expiresIn: "7d",
			},
		},
	},
	"opening-hours": {
		enabled: true,
		resolve: "./node_modules/@opkod-france/strapi-plugin-opening-hours",
	},
});
