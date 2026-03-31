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

			const defaultHours = {
				Monday: { open: "09:00", close: "17:00", closed: false },
				Tuesday: { open: "09:00", close: "17:00", closed: false },
				Wednesday: { open: "09:00", close: "17:00", closed: false },
				Thursday: { open: "09:00", close: "17:00", closed: false },
				Friday: { open: "09:00", close: "17:00", closed: false },
				Saturday: { open: "10:00", close: "16:00", closed: false },
				Sunday: { open: "", close: "", closed: true },
			};

			if (!ctx.request.body.data.hours) {
				ctx.request.body.data.hours = defaultHours;
			}

			ctx.request.body.data.owner = userId;

			return super.create(ctx);
		},
	})
);
