"use strict";

module.exports = async (policyContext, config, { strapi }) => {
	const { user } = policyContext.state;
	const { id } = policyContext.params;

	if (!user) return false;

	// Super Admin can do everything
	if (user.role.type === "super_admin") return true;

	// Business Owner - filter by ownerEmail
	if (user.role.name === "Business Owner") {
		// GET /businesses - filter to their email
		if (!id && policyContext.request.method === "GET") {
			policyContext.query = {
				...policyContext.query,
				filters: {
					...policyContext.query?.filters,
					ownerEmail: user.email,
				},
			};
			return true;
		}

		// GET/PUT specific business - check ownerEmail matches
		if (id) {
			const business = await strapi.entityService.findOne(
				"api::business.business",
				id,
				{ fields: ["ownerEmail"] }
			);
			return business?.ownerEmail === user.email;
		}
	}

	return false;
};
