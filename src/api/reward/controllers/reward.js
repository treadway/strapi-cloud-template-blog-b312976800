"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::reward.reward", ({ strapi }) => ({
	async create(ctx) {
		ctx.request.body.data.owner = ctx.state.user.id;
		const response = await super.create(ctx);
		return response;
	},
}));
