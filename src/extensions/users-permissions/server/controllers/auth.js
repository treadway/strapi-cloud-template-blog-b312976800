import twilio from "twilio";
import jwt from "jsonwebtoken";

const twilioClient = twilio(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN
);

const auth = {
	async sendVerificationCode(ctx) {
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
			ctx.badRequest(error.message || "Failed to send verification code");
		}
	},

	async verifyCodeAndAuth(ctx) {
		const { phoneNumber, code } = ctx.request.body;

		if (!phoneNumber || !code) {
			return ctx.badRequest("Phone number and code are required");
		}

		try {
			const verificationCheck = await twilioClient.verify.v2
				.services(process.env.TWILIO_VERIFY_SERVICE_SID)
				.verificationChecks.create({
					to: phoneNumber,
					code,
				});

			if (verificationCheck.status !== "approved") {
				return ctx.badRequest("Invalid verification code");
			}

			// Find the user or create a new one if not found
			let participant = await strapi.db
				.query("api::participant.participant")
				.findOne({
					where: { phone: phoneNumber },
				});

			if (!participant) {
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

			// Generate JWT token for the participant
			const token = jwt.sign(
				{ id: participant.id },
				process.env.JWT_SECRET ||
					strapi.config.get("plugin.users-permissions.jwtSecret"),
				{ expiresIn: "7d" }
			);

			ctx.send({
				jwt: token,
				participant,
			});
		} catch (error) {
			console.error("Verification error:", error);
			ctx.badRequest(error.message || "Verification failed");
		}
	},
};

export default auth;
