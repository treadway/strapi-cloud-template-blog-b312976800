module.exports = async (policyContext, config, { strapi }) => {
	const { user } = policyContext.state;
	const { id } = policyContext.params;

	if (!user) return false;

	// Super Admin sees everything
	if (user.role.type === "super_admin") return true;

	// Business Owner - filter by owner relation
	if (user.role.name === "Business Owner") {
		// For GET /businesses - filter to only show their businesses
		if (!id && policyContext.request.method === "GET") {
			policyContext.query = {
				...policyContext.query,
				filters: {
					...policyContext.query?.filters,
					owner: { id: user.id },
				},
			};
			return true;
		}

		// For POST /businesses - will set owner in controller (see next step)
		if (policyContext.request.method === "POST") {
			return true;
		}

		// For GET/PUT/DELETE specific business - check they own it
		if (id) {
			const business = await strapi.entityService.findOne(
				"api::business.business",
				id,
				{
					populate: { owner: { fields: ["id"] } },
				}
			);

			return business?.owner?.id === user.id;
		}
	}

	return false;
};
