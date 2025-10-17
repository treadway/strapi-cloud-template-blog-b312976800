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
				policies: ["global::isBusinessOwner"],
			},
		},
		{
			method: "GET",
			path: "/rewards/:id",
			handler: "reward.findOne",
			config: {
				policies: ["global::isBusinessOwner"],
			},
		},
		{
			method: "POST",
			path: "/rewards",
			handler: "reward.create",
			config: {
				policies: ["global::isBusinessOwner"],
			},
		},
		{
			method: "PUT",
			path: "/rewards/:id",
			handler: "reward.update",
			config: {
				policies: ["global::isBusinessOwner"],
			},
		},
		{
			method: "DELETE",
			path: "/rewards/:id",
			handler: "reward.delete",
			config: {
				policies: ["global::isBusinessOwner"],
			},
		},
	],
};
