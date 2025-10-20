"use strict";

module.exports = {
	routes: [
		{
			method: "GET",
			path: "/rewards",
			handler: "reward.find",
			config: {
				auth: false, // ✅ PUBLIC - app can read
			},
		},
		{
			method: "GET",
			path: "/rewards/:id",
			handler: "reward.findOne",
			config: {
				auth: false, // ✅ PUBLIC - app can read
			},
		},
		{
			method: "POST",
			path: "/rewards",
			handler: "reward.create",
			config: {
				policies: ["global::isRewardOwner"],
			},
		},
		{
			method: "PUT",
			path: "/rewards/:id",
			handler: "reward.update",
			config: {
				policies: ["global::isRewardOwner"],
			},
		},
		{
			method: "DELETE",
			path: "/rewards/:id",
			handler: "reward.delete",
			config: {
				policies: ["global::isRewardOwner"],
			},
		},
	],
};
