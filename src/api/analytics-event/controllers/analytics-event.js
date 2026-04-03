"use strict";

/**
 * analytics-event controller
 *
 * Standard CRUD + custom batch endpoint for sending
 * multiple events in a single request from the app.
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
	"api::analytics-event.analytics-event",
	({ strapi }) => ({
		/**
		 * POST /api/analytics-events/batch
		 *
		 * Body: { events: [ { action, screen, participantId, version, build, deviceTimestamp, meta? } ] }
		 */
		async batch(ctx) {
			const { events } = ctx.request.body;

			if (!Array.isArray(events) || events.length === 0) {
				return ctx.badRequest("Body must contain a non-empty `events` array");
			}

			if (events.length > 200) {
				return ctx.badRequest("Maximum 200 events per batch");
			}

			// Strapi v5: use strapi.db.query() for direct DB inserts (fastest for batch)
			const results = await Promise.all(
				events.map((evt) =>
					strapi.db.query("api::analytics-event.analytics-event").create({
						data: {
							version: evt.version,
							build: evt.build,
							action: evt.action,
							screen: evt.screen || null,
							participantId: evt.participantId || null,
							deviceTimestamp: evt.deviceTimestamp,
							meta: evt.meta || null,
						},
					})
				)
			);

			ctx.send({ created: results.length });
		},
	})
);
