"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::reward.reward", ({ strapi }) => ({
	async create(ctx) {
		// Auto-set owner to current user
		ctx.request.body.data.owner = ctx.state.user.id;
		const response = await super.create(ctx);
		return response;
	},

	async find(ctx) {
		// Business owners see only their rewards in CMS
		if (ctx.state.user?.role?.name === "Business Owner") {
			ctx.query = {
				...ctx.query,
				filters: {
					...ctx.query?.filters,
					owner: ctx.state.user.id,
				},
			};
		}
		const response = await super.find(ctx);
		return response;
	},
}));
