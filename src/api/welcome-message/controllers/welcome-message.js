'use strict';
const { createCoreController } = require('@strapi/strapi').factories;
module.exports = createCoreController('api::welcome-message.welcome-message');
