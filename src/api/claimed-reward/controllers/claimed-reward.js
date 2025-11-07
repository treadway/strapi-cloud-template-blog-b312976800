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
						description: claimedReward.reward?.title || "Points4Earth Reward",
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
				// UPDATE PASS FIELDS WITH REWARD DATA
				// Fields are pre-defined in pass.json, we just update values
				// ==================================================

				// Get business and reward info with fallbacks
				const businessName =
					claimedReward.business?.businessName || "Points4Earth";
				const rewardTitle = claimedReward.reward?.title || "Reward";
				const fromName = claimedReward.business?.businessName || rewardTitle;

				// Header: Business name
				pass.headerFields[0].value = businessName;

				// Primary: Reward title
				pass.primaryFields[0].value = rewardTitle;

				// Secondary: Appreciation message
				pass.secondaryFields[0].value = `${fromName} appreciates your hard work!`;

				// Auxiliary Left: Expiration date
				if (claimedReward.expiresAt) {
					pass.auxiliaryFields[0].value = new Date(
						claimedReward.expiresAt
					).toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
						year: "numeric",
					});
				} else {
					pass.auxiliaryFields[0].value = "No expiration";
				}

				// Auxiliary Right: Points redeemed
				if (
					claimedReward.pointsSpent !== undefined &&
					claimedReward.pointsSpent !== null
				) {
					pass.auxiliaryFields[1].value = `${claimedReward.pointsSpent}`;
				} else {
					pass.auxiliaryFields[1].value = "0";
				}

				// Back Fields
				// Terms & Conditions
				if (claimedReward.reward?.termsConditions) {
					pass.backFields[0].value = claimedReward.reward.termsConditions;
				} else {
					pass.backFields[0].value = "Standard terms and conditions apply.";
				}

				// Redemption Instructions
				if (claimedReward.reward?.redemptionInstructions) {
					pass.backFields[1].value =
						claimedReward.reward.redemptionInstructions;
				} else {
					pass.backFields[1].value =
						"Show this pass to staff at checkout. QR code must be scanned to validate.";
				}

				// Business Contact Info
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
					pass.backFields[2].value = contactInfo.join("\n");
				} else {
					pass.backFields[2].value = "Contact information not available.";
				}

				// About Points4Earth (already set in template)
				// pass.backFields[3] already has the correct value

				console.log("📊 Pass fields updated");

				// ==================================================
				// ADD BUSINESS LOGO AS THUMBNAIL (if available)
				// ==================================================

				if (claimedReward.business?.logo?.url) {
					try {
						const logoUrl = claimedReward.business.logo.url;
						const fullLogoUrl = logoUrl.startsWith("http")
							? logoUrl
							: `${
									process.env.STRAPI_URL ||
									"https://lovely-charity-e91f9ec79a.strapiapp.com"
							  }${logoUrl}`;

						console.log("🖼️ Fetching business logo:", fullLogoUrl);

						const fetch = (await import("node-fetch")).default;
						const logoResponse = await fetch(fullLogoUrl);

						if (logoResponse.ok) {
							const logoBuffer = await logoResponse.buffer();
							pass.addBuffer("thumbnail.png", logoBuffer);
							pass.addBuffer("thumbnail@2x.png", logoBuffer);
							console.log("✅ Business logo added to pass");
						} else {
							console.log(
								"⚠️ Could not fetch business logo:",
								logoResponse.status
							);
						}
					} catch (logoError) {
						console.log("⚠️ Error adding business logo:", logoError.message);
						// Continue without logo - don't fail the whole pass generation
					}
				}

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
