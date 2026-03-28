"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::reward.reward", ({ strapi }) => ({
	async create(ctx) {
		ctx.request.body.data.owner = ctx.state.user.id;
		const response = await super.create(ctx);
		return response;
	},

	async find(ctx) {
		// Build filters — business owners only see their own rewards
		const filters = { ...ctx.query?.filters };
		if (ctx.state.user?.role?.name === "Business Owner") {
			filters.owner = ctx.state.user.id;
		}

		const { results, pagination } = await strapi
			.service("api::reward.reward")
			.find({
				...ctx.query,
				filters,
				populate: {
					image: true,
					business: true,
				},
			});

		return { data: results, meta: { pagination } };
	},
}));
