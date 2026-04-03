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
		 *
		 * Creates all events in a single request so the app can
		 * queue events locally and flush them periodically rather
		 * than firing one HTTP request per interaction.
		 */
		async batch(ctx) {
			const { events } = ctx.request.body;

			if (!Array.isArray(events) || events.length === 0) {
				return ctx.badRequest("Body must contain a non-empty `events` array");
			}

			// Cap batch size to prevent abuse
			if (events.length > 200) {
				return ctx.badRequest("Maximum 200 events per batch");
			}

			const results = await Promise.all(
				events.map((evt) =>
					strapi.entityService.create(
						"api::analytics-event.analytics-event",
						{
							data: {
								version: evt.version,
								build: evt.build,
								action: evt.action,
								screen: evt.screen || null,
								participantId: evt.participantId || null,
								deviceTimestamp: evt.deviceTimestamp,
								meta: evt.meta || null,
							},
						}
					)
				)
			);

			ctx.send({ created: results.length });
		},
	})
);
