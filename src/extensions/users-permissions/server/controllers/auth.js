const twilio = require("twilio");

const twilioClient = twilio(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN
);

module.exports = {
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
					code: code,
				});

			if (verificationCheck.status !== "approved") {
				return ctx.badRequest("Invalid verification code");
			}

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

			const getService = (name) => {
				return strapi.plugin("users-permissions").service(name);
			};

			const jwt = getService("jwt").sign({
				id: participant.id,
			});

			ctx.send({
				jwt,
				participant,
			});
		} catch (error) {
			console.error("Verification error:", error);
			ctx.badRequest(error.message || "Verification failed");
		}
	},
};
