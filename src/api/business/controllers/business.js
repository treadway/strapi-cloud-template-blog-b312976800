"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
	"api::business.business",
	({ strapi }) => ({
		async find(ctx) {
			return await strapi.service("api::business.business").find({
				...ctx.query,
				populate: {
					logo: true,
					photo: true,
					rewards: {
						populate: { image: true },
					},
				},
			});
		},

		async findOne(ctx) {
			const { id } = ctx.params;

			return await strapi.service("api::business.business").findOne(id, {
				populate: {
					logo: true,
					photo: true,
					rewards: {
						populate: { image: true },
					},
				},
			});
		},

		async create(ctx) {
			ctx.request.body.data.owner = ctx.state.user.id;
			return super.create(ctx);
		},
	})
);
