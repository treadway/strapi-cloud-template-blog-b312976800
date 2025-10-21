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
			console.log("🔍 Controller received phone:", phone);

			try {
				const participants = await strapi.entityService.findMany(
					"api::participant.participant",
					{
						filters: { phone },
						fields: ["id", "name"],
						publicationState: "live",
					}
				);

				console.log(
					"📊 Found participants:",
					participants.length,
					participants
				);

				// ✅ JUST CHECK IF THEY EXIST - don't check name
				const exists = participants.length > 0;

				console.log("✅ Returning exists:", exists);

				return { exists };
			} catch (error) {
				console.error("❌ Error in checkPhone:", error);
				ctx.throw(500, "Failed to check phone");
			}
		},
	})
);
