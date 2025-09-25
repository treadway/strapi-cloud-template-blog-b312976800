"use strict";

/**
 * transportation-method service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(
	"api::transportation-method.transportation-method"
);
