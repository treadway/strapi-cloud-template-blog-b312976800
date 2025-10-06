const twilio = require("twilio");

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const twilioClient = twilio(accountSid, authToken);

module.exports = {
	async sendCode(ctx) {
		try {
			const { phoneNumber } = ctx.request.body;

			if (!phoneNumber) {
				return ctx.badRequest("Phone number is required");
			}

			console.log("Sending verification code to:", phoneNumber);

			// Send verification code via Twilio
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

	async verifyCode(ctx) {
		try {
			const { phoneNumber, code } = ctx.request.body;

			if (!phoneNumber || !code) {
				return ctx.badRequest("Phone number and code are required");
			}

			console.log("Verifying code for:", phoneNumber);

			// Verify code with Twilio
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

			// Find or create participant
			let participant = await strapi.db
				.query("api::participant.participant")
				.findOne({
					where: { phone: phoneNumber },
				});

			if (!participant) {
				// Create new participant
				console.log("Creating new participant");
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
			} else {
				console.log("Found existing participant:", participant.id);
			}

			// Create JWT token
			const jwt = strapi.plugins["users-permissions"].services.jwt.issue({
				id: participant.id,
			});

			return ctx.send({
				jwt,
				participant: {
					id: participant.id,
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
