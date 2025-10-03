// src/extensions/users-permissions/controllers/auth.js
const { sanitize } = require("@strapi/utils");
const twilio = require("twilio");

const twilioClient = twilio(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN
);

module.exports = (plugin) => {
	// Send verification code
	plugin.controllers.auth.sendVerificationCode = async (ctx) => {
		const { phoneNumber } = ctx.request.body;

		if (!phoneNumber) {
			return ctx.badRequest("Phone number is required");
		}

		try {
			const verification = await twilioClient.verify.v2
				.services(process.env.TWILIO_VERIFY_SERVICE_SID)
				.verifications.create({
					to: phoneNumber,
					channel: "sms",
				});

			ctx.send({
				message: "Verification code sent",
				status: verification.status,
			});
		} catch (error) {
			console.error("Twilio verification error:", error);
			ctx.badRequest("Failed to send verification code");
		}
	};

	// Verify code and authenticate
	plugin.controllers.auth.verifyCodeAndAuth = async (ctx) => {
		const { phoneNumber, code } = ctx.request.body;

		if (!phoneNumber || !code) {
			return ctx.badRequest("Phone number and code are required");
		}

		try {
			// Verify code with Twilio
			const verificationCheck = await twilioClient.verify.v2
				.services(process.env.TWILIO_VERIFY_SERVICE_SID)
				.verificationChecks.create({
					to: phoneNumber,
					code: code,
				});

			if (verificationCheck.status !== "approved") {
				return ctx.badRequest("Invalid verification code");
			}

			// Find or create participant
			let participant = await strapi.db
				.query("api::participant.participant")
				.findOne({
					where: { phone: phoneNumber },
				});

			if (!participant) {
				// Create new participant
				participant = await strapi.db
					.query("api::participant.participant")
					.create({
						data: {
							phone: phoneNumber,
							name: "New Participant",
							totalPoints: 0,
							availablePoints: 0,
							level: 1,
						},
					});
			}

			// Generate JWT token
			const jwt = strapi.plugins["users-permissions"].services.jwt.issue({
				id: participant.id,
			});

			ctx.send({
				jwt,
				participant: await sanitize.contentAPI.output(
					participant,
					strapi.getModel("api::participant.participant")
				),
			});
		} catch (error) {
			console.error("Verification error:", error);
			ctx.badRequest("Verification failed");
		}
	};

	return plugin;
};
