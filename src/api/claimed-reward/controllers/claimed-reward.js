"use strict";
const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
	"api::claimed-reward.claimed-reward",
	({ strapi }) => ({
		// We'll add the generatePass method later after installing packages
		async find(ctx) {
			// Add any custom find logic here if needed
			return super.find(ctx);
		},

		async findOne(ctx) {
			// Add any custom findOne logic here if needed
			return super.findOne(ctx);
		},
	})
);
