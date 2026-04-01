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
	},
});
