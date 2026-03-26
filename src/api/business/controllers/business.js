"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
	"api::business.business",
	({ strapi }) => ({
		async find(ctx) {
			// Always populate logo, photo, and linked rewards with their image
			ctx.query = {
				...ctx.query,
				populate: {
					logo: true,
					photo: true,
					rewards: {
						populate: { image: true },
					},
				},
			};
			return super.find(ctx);
		},

		async findOne(ctx) {
			// Same populate for single business lookup
			ctx.query = {
				...ctx.query,
				populate: {
					logo: true,
					photo: true,
					rewards: {
						populate: { image: true },
					},
				},
			};
			return super.findOne(ctx);
		},

		async create(ctx) {
			// Set owner to current user
			ctx.request.body.data.owner = ctx.state.user.id;
			return super.create(ctx);
		},
	})
);
