"use strict";
const { createCoreController } = require("@strapi/strapi").factories;
const PKPass = require("passkit-generator").PKPass;
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

module.exports = createCoreController(
	"api::claimed-reward.claimed-reward",
	({ strapi }) => ({
		async findOne(ctx) {
			return super.findOne(ctx);
		},

		async generatePass(ctx) {
			try {
				const { id } = ctx.params;
				const queryToken = ctx.query.access_token;

				console.log("🎫 Generating pass for claimed reward:", id);

				// Verify token from query parameter
				let user = null;
				if (queryToken) {
					try {
						// Decode and verify JWT token
						const decoded = await strapi.plugins[
							"users-permissions"
						].services.jwt.verify(queryToken);
						user = await strapi
							.query("plugin::users-permissions.user")
							.findOne({
								where: { id: decoded.id },
							});
						console.log("👤 Authenticated user from query token:", user?.id);
					} catch (err) {
						console.log("❌ Invalid token:", err.message);
						return ctx.unauthorized("Invalid or expired token");
					}
				} else {
					// Try standard authentication
					user = ctx.state.user;
					console.log("👤 Authenticated user from header:", user?.id);
				}

				if (!user) {
					console.log("❌ No authentication provided");
					return ctx.unauthorized("Authentication required");
				}

				// Get claimed reward with all relations
				const claimedReward = await strapi.db
					.query("api::claimed-reward.claimed-reward")
					.findOne({
						where: { id },
						populate: ["reward", "business", "participant"],
					});

				if (!claimedReward) {
					console.log("❌ Claimed reward not found");
					return ctx.notFound("Claimed reward not found");
				}

				// SECURITY: Verify user owns this claimed reward
				// Match user ID with participant phone
				const userPhone = user?.username || user?.phone;
				const participantPhone = claimedReward.participant?.phone;

				console.log("🔒 Security check:", {
					userPhone,
					participantPhone,
					match: userPhone === participantPhone,
				});

				if (userPhone !== participantPhone) {
					console.log("❌ Unauthorized access attempt");
					return ctx.forbidden(
						"You don't have permission to access this reward"
					);
				}

				console.log("✅ Authorization verified");

				// Generate QR code if needed
				let qrData = claimedReward.qrCode;
				if (!qrData) {
					qrData = `P4E-${claimedReward.id}-${Date.now()}`;
					await strapi.db.query("api::claimed-reward.claimed-reward").update({
						where: { id: claimedReward.id },
						data: { qrCode: qrData },
					});
				}

				// Decode certificates from environment variables
				const wwdrCert = Buffer.from(process.env.WWDR_CERT, "base64").toString(
					"utf-8"
				);
				const signerCert = Buffer.from(
					process.env.SIGNER_CERT,
					"base64"
				).toString("utf-8");
				const signerKey = Buffer.from(
					process.env.SIGNER_KEY,
					"base64"
				).toString("utf-8");

				console.log("🔑 Certificates loaded from environment");

				// Create pass
				const pass = await PKPass.from(
					{
						model: path.resolve(__dirname, "../../../passkit.pass"),
						certificates: {
							wwdr: wwdrCert,
							signerCert: signerCert,
							signerKey: signerKey,
							signerKeyPassphrase: process.env.PASS_SIGNER_PASSPHRASE,
						},
					},
					{
						serialNumber: `P4E-${claimedReward.id}`,
						description: claimedReward.reward.title,
					}
				);
				console.log("✅ Pass created");

				// Add QR code as barcode
				pass.setBarcodes({
					message: qrData,
					format: "PKBarcodeFormatQR",
					messageEncoding: "iso-8859-1",
				});

				// ==================================================
				// POPULATE PASS FIELDS WITH REWARD DATA
				// ==================================================

				// HEADER FIELD - Business name
				pass.headerFields.push({
					key: "business",
					label: "", // No label for cleaner header
					value: claimedReward.business?.businessName || "Points4Earth Partner",
				});

				// PRIMARY FIELD - The reward title (main focus)
				pass.primaryFields.push({
					key: "reward",
					label: "", // No label - let the title be prominent
					value: claimedReward.reward.title || "Reward",
				});

				// SECONDARY FIELDS - Appreciation message and context
				const businessName =
					claimedReward.business?.businessName || claimedReward.reward.title;
				pass.secondaryFields.push({
					key: "message",
					label: "FROM",
					value: `${businessName} appreciates your hard work!`,
					textAlignment: "PKTextAlignmentLeft",
				});

				// AUXILIARY FIELDS - Important details in two columns
				// Left: Expiration date
				pass.auxiliaryFields.push({
					key: "expires",
					label: "EXPIRES",
					value: new Date(claimedReward.expiresAt).toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
						year: "numeric",
					}),
					textAlignment: "PKTextAlignmentLeft",
				});

				// Right: Points redeemed
				pass.auxiliaryFields.push({
					key: "points",
					label: "POINTS REDEEMED",
					value: `${claimedReward.pointsSpent}`,
					textAlignment: "PKTextAlignmentRight",
				});

				// BACK FIELDS - Terms, instructions, about
				if (claimedReward.reward.termsConditions) {
					pass.backFields.push({
						key: "terms",
						label: "Terms & Conditions",
						value: claimedReward.reward.termsConditions,
					});
				}

				if (claimedReward.reward.redemptionInstructions) {
					pass.backFields.push({
						key: "instructions",
						label: "How to Redeem",
						value: claimedReward.reward.redemptionInstructions,
					});
				}

				// Add business contact info if available
				if (
					claimedReward.business?.contactEmail ||
					claimedReward.business?.contactPhone
				) {
					const contactInfo = [];
					if (claimedReward.business.contactPhone) {
						contactInfo.push(`Phone: ${claimedReward.business.contactPhone}`);
					}
					if (claimedReward.business.contactEmail) {
						contactInfo.push(`Email: ${claimedReward.business.contactEmail}`);
					}

					pass.backFields.push({
						key: "contact",
						label: "Business Contact",
						value: contactInfo.join("\n"),
					});
				}

				// About Points4Earth
				pass.backFields.push({
					key: "about",
					label: "About Points4Earth",
					value:
						"Rewards for doing good things! Earn points for eco-friendly travel and redeem for great rewards. Learn more at points4earth.com",
				});

				console.log("📊 Pass fields configured");

				// Generate the pass buffer
				const passBuffer = pass.getAsBuffer();

				console.log("✅ Pass buffer generated, size:", passBuffer.length);

				// Set response headers for download
				ctx.set("Content-Type", "application/vnd.apple.pkpass");
				ctx.set("Content-Disposition", "inline; filename=reward.pkpass");

				return passBuffer;
			} catch (error) {
				console.error("❌ Error generating pass:", error);
				return ctx.badRequest("Failed to generate pass: " + error.message);
			}
		},
	})
);
