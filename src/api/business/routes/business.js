"use strict";

module.exports = {
	routes: [
		// ✅ App participants: read-only, no policy (ownerEmail never returned)
		{
			method: "GET",
			path: "/businesses",
			handler: "business.find",
			config: {
				policies: [],
				auth: false,
			},
		},
		{
			method: "GET",
			path: "/businesses/:id",
			handler: "business.findOne",
			config: {
				policies: [],
				auth: false,
			},
		},
		// 🔒 Business Owner CMS access: policy-guarded
		{
			method: "GET",
			path: "/businesses/owner/list",
			handler: "business.find",
			config: {
				policies: ["global::isBusinessEmailOwner"],
			},
		},
		{
			method: "GET",
			path: "/businesses/owner/:id",
			handler: "business.findOne",
			config: {
				policies: ["global::isBusinessEmailOwner"],
			},
		},
		{
			method: "PUT",
			path: "/businesses/:id",
			handler: "business.update",
			config: {
				policies: ["global::isBusinessEmailOwner"],
			},
		},
		// 🔒 Super Admin only — create new business
		// ⚠️ TEMP: policy disabled for bulk import — RE-ENABLE after import!
		{
			method: "POST",
			path: "/businesses",
			handler: "business.create",
			config: {
				policies: [],
				auth: false,
			},
		},
		// ✅ NO DELETE - business owner can't delete their business
	],
};
