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
				// POPULATE PASS FIELDS WITH REWARD DATA
				// Using proper passkit-generator methods
				// ==================================================

				// HEADER FIELD - Business name (if available)
				const businessName =
					claimedReward.business?.businessName || "Points4Earth";
				pass.addHeaderField({
					key: "business",
					label: "",
					value: businessName,
				});

				// PRIMARY FIELD - The reward title (main focus)
				const rewardTitle = claimedReward.reward?.title || "Reward";
				pass.addPrimaryField({
					key: "reward",
					label: "",
					value: rewardTitle,
				});

				// SECONDARY FIELD - Appreciation message (if business exists)
				if (claimedReward.business || claimedReward.reward?.title) {
					const fromName = claimedReward.business?.businessName || rewardTitle;
					pass.addSecondaryField({
						key: "message",
						label: "FROM",
						value: `${fromName} appreciates your hard work!`,
						textAlignment: "PKTextAlignmentLeft",
					});
				}

				// AUXILIARY FIELDS - Details in two columns
				// Left: Expiration date (if available)
				if (claimedReward.expiresAt) {
					pass.addAuxiliaryField({
						key: "expires",
						label: "EXPIRES",
						value: new Date(claimedReward.expiresAt).toLocaleDateString(
							"en-US",
							{
								month: "short",
								day: "numeric",
								year: "numeric",
							}
						),
						textAlignment: "PKTextAlignmentLeft",
					});
				}

				// Right: Points redeemed (if available)
				if (
					claimedReward.pointsSpent !== undefined &&
					claimedReward.pointsSpent !== null
				) {
					pass.addAuxiliaryField({
						key: "points",
						label: "POINTS REDEEMED",
						value: `${claimedReward.pointsSpent}`,
						textAlignment: "PKTextAlignmentRight",
					});
				}

				// BACK FIELDS - Terms, instructions, about

				// Terms & Conditions (if available)
				if (claimedReward.reward?.termsConditions) {
					pass.addBackField({
						key: "terms",
						label: "Terms & Conditions",
						value: claimedReward.reward.termsConditions,
					});
				}

				// Redemption Instructions (if available)
				if (claimedReward.reward?.redemptionInstructions) {
					pass.addBackField({
						key: "instructions",
						label: "How to Redeem",
						value: claimedReward.reward.redemptionInstructions,
					});
				} else {
					// Default instructions
					pass.addBackField({
						key: "instructions",
						label: "How to Redeem",
						value:
							"Show this pass to staff at checkout. QR code must be scanned to validate.",
					});
				}

				// Business Contact Info (if available)
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

					pass.addBackField({
						key: "contact",
						label: "Business Contact",
						value: contactInfo.join("\n"),
					});
				}

				// About Points4Earth
				pass.addBackField({
					key: "about",
					label: "About Points4Earth",
					value:
						"Rewards for doing good things! Earn points for eco-friendly travel and redeem for great rewards. Learn more at points4earth.com",
				});

				// ==================================================
				// ADD BUSINESS LOGO AS THUMBNAIL (if available)
				// ==================================================

				// Check if business has a logo
				if (claimedReward.business?.logo?.url) {
					try {
						// Fetch the business logo
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
							// Add as thumbnail image to the pass
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
