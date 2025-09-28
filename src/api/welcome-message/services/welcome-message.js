'use strict';
const { createCoreService } = require('@strapi/strapi').factories;
module.exports = createCoreService('api::welcome-message.welcome-message');
