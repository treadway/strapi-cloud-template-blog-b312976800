"use strict";

module.exports = async (policyContext, config, { strapi }) => {
	const { user } = policyContext.state;
	const { id } = policyContext.params;

	if (!user) return false;

	// Super Admin can do everything
	if (user.role.type === "super_admin") return true;

	// Business Owner
	if (user.role.name === "Business Owner") {
		// POST - creating reward (owner will be set in controller)
		if (policyContext.request.method === "POST") {
			return true;
		}

		// PUT/DELETE - check they own this reward
		if (id) {
			const reward = await strapi.entityService.findOne(
				"api::reward.reward",
				id,
				{ populate: { owner: true } }
			);
			return reward?.owner?.id === user.id;
		}
	}

	return false;
};
