module.exports = async (policyContext, config, { strapi }) => {
	const { user } = policyContext.state;

	if (!user) {
		return false;
	}

	// Admin can see everything
	if (user.role.type === "authenticated") {
		return true;
	}

	// Business owner - find business by their email
	if (user.role.name === "Business Owner") {
		const businesses = await strapi.entityService.findMany(
			"api::business.business",
			{
				filters: { ownerEmail: user.email },
				fields: ["id"],
			}
		);

		if (businesses.length === 0) {
			return false; // No business found for this user
		}

		// Filter to only show rewards from their business
		const businessId = businesses[0].id;
		policyContext.query = {
			...policyContext.query,
			filters: {
				...policyContext.query.filters,
				business: businessId,
			},
		};
		return true;
	}

	return false;
};
