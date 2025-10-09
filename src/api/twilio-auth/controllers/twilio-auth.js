"use strict";

const twilio = require("twilio");

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const twilioClient = twilio(accountSid, authToken);

module.exports = {
	sendCode: async (ctx) => {
		try {
			const { phoneNumber } = ctx.request.body;

			if (!phoneNumber) {
				return ctx.badRequest("Phone number is required");
			}

			console.log("Sending verification code to:", phoneNumber);

			const verification = await twilioClient.verify.v2
				.services(verifyServiceSid)
				.verifications.create({
					to: phoneNumber,
					channel: "sms",
				});

			console.log("Verification sent:", verification.status);

			return ctx.send({
				message: "Verification code sent",
				status: verification.status,
			});
		} catch (error) {
			console.error("Error sending verification code:", error);
			return ctx.badRequest(error.message);
		}
	},

	verifyCode: async (ctx) => {
		try {
			const { phoneNumber, code } = ctx.request.body;

			if (!phoneNumber || !code) {
				return ctx.badRequest("Phone number and code are required");
			}

			console.log("Verifying code for:", phoneNumber);

			const verificationCheck = await twilioClient.verify.v2
				.services(verifyServiceSid)
				.verificationChecks.create({
					to: phoneNumber,
					code: code,
				});

			if (verificationCheck.status !== "approved") {
				return ctx.badRequest("Invalid verification code");
			}

			console.log("Code verified successfully");

			// CHANGED: Only FIND participant, don't create yet
			let participant = await strapi.db
				.query("api::participant.participant")
				.findOne({
					where: { phone: phoneNumber },
				});

			// If no participant exists, return minimal data with blank name
			if (!participant) {
				console.log("No participant found - new user");
				participant = {
					id: null, // Indicate this is not saved yet
					phone: phoneNumber,
					name: "", // Blank for new users
					totalPoints: 0,
					availablePoints: 0,
					level: 1,
				};
			} else {
				console.log("Found existing participant:", participant.id);
			}

			// Create/find Users & Permissions user
			const pluginStore = await strapi.store({
				type: "plugin",
				name: "users-permissions",
			});
			const settings = await pluginStore.get({ key: "advanced" });
			const defaultRole = await strapi.db
				.query("plugin::users-permissions.role")
				.findOne({
					where: { type: settings.default_role },
				});

			let user = await strapi.db
				.query("plugin::users-permissions.user")
				.findOne({
					where: { username: phoneNumber },
				});

			if (!user) {
				console.log("Creating new Users & Permissions user");
				user = await strapi.db.query("plugin::users-permissions.user").create({
					data: {
						username: phoneNumber,
						email: `${phoneNumber.replace(/\+/g, "")}@placeholder.com`,
						phone: phoneNumber,
						confirmed: true,
						blocked: false,
						role: defaultRole.id,
					},
				});
			} else {
				console.log("Found existing user:", user.id);
			}

			const jwt = strapi.plugins["users-permissions"].services.jwt.issue({
				id: user.id,
			});

			return ctx.send({
				jwt,
				participant: {
					id: participant.id, // Will be null for new participants
					phone: participant.phone,
					name: participant.name,
					totalPoints: participant.totalPoints,
					availablePoints: participant.availablePoints,
					level: participant.level,
				},
			});
		} catch (error) {
			console.error("Error verifying code:", error);
			return ctx.badRequest(error.message);
		}
	},
};
