"use strict";

/**
 * transportation-method router
 */

const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = createCoreRouter(
	"api::transportation-method.transportation-method"
);
