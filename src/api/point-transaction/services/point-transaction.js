"use strict";

/**
 * point-transaction service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService("api::point-transaction.point-transaction");
