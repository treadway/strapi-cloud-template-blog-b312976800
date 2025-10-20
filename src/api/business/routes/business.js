"use strict";

module.exports = {
	routes: [
		{
			method: "GET",
			path: "/businesses",
			handler: "business.find",
			config: {
				policies: ["global::isBusinessOwner"],
			},
		},
		{
			method: "GET",
			path: "/businesses/:id",
			handler: "business.findOne",
			config: {
				policies: ["global::isBusinessOwner"],
			},
		},
		{
			method: "POST",
			path: "/businesses",
			handler: "business.create",
			config: {
				policies: ["global::isBusinessOwner"],
			},
		},
		{
			method: "PUT",
			path: "/businesses/:id",
			handler: "business.update",
			config: {
				policies: ["global::isBusinessOwner"],
			},
		},
		{
			method: "DELETE",
			path: "/businesses/:id",
			handler: "business.delete",
			config: {
				policies: ["global::isBusinessOwner"],
			},
		},
	],
};
