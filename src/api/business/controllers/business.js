"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
	"api::business.business",
	({ strapi }) => ({
		async find(ctx) {
			const { results, pagination } = await strapi
				.service("api::business.business")
				.find({
					...ctx.query,
					populate: {
						logo: true,
						photo: true,
						rewards: {
							populate: { image: true },
						},
					},
				});

			return { data: results, meta: { pagination } };
		},

		async findOne(ctx) {
			const { id } = ctx.params;
			const result = await strapi
				.service("api::business.business")
				.findOne(id, {
					populate: {
						logo: true,
						photo: true,
						rewards: {
							populate: { image: true },
						},
					},
				});

			return { data: result };
		},

		async create(ctx) {
			ctx.request.body.data.owner = ctx.state.user.id;
			return super.create(ctx);
		},
	})
);
