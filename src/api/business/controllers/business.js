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
						hours: true,
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
						hours: true,
						rewards: {
							populate: { image: true },
						},
					},
				});

			return { data: result };
		},

		async create(ctx) {
			const userId = ctx.state.user.id;

			const defaultHours = [
				"Monday",
				"Tuesday",
				"Wednesday",
				"Thursday",
				"Friday",
				"Saturday",
				"Sunday",
			].map((day) => ({
				day,
				isClosed: false,
				open: "09:00:00",
				close: "17:00:00",
			}));

			if (
				!ctx.request.body.data.hours ||
				ctx.request.body.data.hours.length === 0
			) {
				ctx.request.body.data.hours = defaultHours;
			}

			ctx.request.body.data.owner = userId;

			return super.create(ctx);
		},
	})
);
