"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
	"api::business.business",
	({ strapi }) => ({
		async create(ctx) {
			// Set owner to current user
			ctx.request.body.data.owner = ctx.state.user.id;

			// Call default create
			const response = await super.create(ctx);
			return response;
		},
	})
);
