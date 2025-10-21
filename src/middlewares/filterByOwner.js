"use strict";

module.exports = (config, { strapi }) => {
	return async (ctx, next) => {
		await next();

		const user = ctx.state.user;

		// Skip if no user or user doesn't have role
		if (!user || !user.role) {
			return;
		}

		// Super admin sees everything
		if (user.role.type === "super_admin") {
			return;
		}

		// Business Owner filtering
		if (user.role.name === "Business Owner") {
			// Filter businesses by ownerEmail
			if (
				ctx.request.url.includes(
					"/content-manager/collection-types/api::business.business"
				)
			) {
				if (ctx.response.body?.results) {
					ctx.response.body.results = ctx.response.body.results.filter(
						(business) => business.ownerEmail === user.email
					);
					ctx.response.body.pagination.total = ctx.response.body.results.length;
				}
			}

			// Filter rewards by owner
			if (
				ctx.request.url.includes(
					"/content-manager/collection-types/api::reward.reward"
				)
			) {
				if (ctx.response.body?.results) {
					ctx.response.body.results = ctx.response.body.results.filter(
						(reward) => reward.owner?.id === user.id
					);
					ctx.response.body.pagination.total = ctx.response.body.results.length;
				}
			}
		}
	};
};
