"use strict";

/**
 * participant controller
 */
const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
	"api::participant.participant",
	({ strapi }) => ({
		// Custom method to check if phone exists (public access)
		async checkPhone(ctx) {
			const { phone } = ctx.params;

			try {
				// Only return whether participant exists, not the data
				const participants = await strapi.entityService.findMany(
					"api::participant.participant",
					{
						filters: { phone },
						fields: ["id", "name"], // Only need to know if exists and has name
						publicationState: "live", // Only published
					}
				);

				const exists = participants.length > 0 && participants[0].name !== "";

				return {
					exists,
				};
			} catch (error) {
				ctx.throw(500, "Failed to check phone");
			}
		},
	})
);
