"use strict";

/**
 * reward router with business owner policy
 */

module.exports = {
	routes: [
		{
			method: "GET",
			path: "/rewards",
			handler: "reward.find",
			config: {
				// ✅ NO POLICY - anyone can view rewards
				auth: false,
			},
		},
		{
			method: "GET",
			path: "/rewards/:id",
			handler: "reward.findOne",
			config: {
				// ✅ NO POLICY - anyone can view a single reward
				auth: false,
			},
		},
		{
			method: "POST",
			path: "/rewards",
			handler: "reward.create",
			config: {
				policies: ["global::isBusinessOwner"], // ✅ KEEP POLICY for create
			},
		},
		{
			method: "PUT",
			path: "/rewards/:id",
			handler: "reward.update",
			config: {
				policies: ["global::isBusinessOwner"], // ✅ KEEP POLICY for update
			},
		},
		{
			method: "DELETE",
			path: "/rewards/:id",
			handler: "reward.delete",
			config: {
				policies: ["global::isBusinessOwner"], // ✅ KEEP POLICY for delete
			},
		},
	],
};
