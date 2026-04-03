"use strict";

/**
 * analytics-event core routes (standard CRUD)
 */

const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = createCoreRouter("api::analytics-event.analytics-event");
