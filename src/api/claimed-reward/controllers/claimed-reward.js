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

		async cancelClaim(ctx) {
			try {
				const { id } = ctx.params;
				const queryToken = ctx.query.access_token;

				console.log("🗑️ Cancelling claimed reward:", id);

				// Verify token from query parameter
				let user = null;
				if (queryToken) {
					try {
						const decoded = await strapi.plugins[
							"users-permissions"
						].services.jwt.verify(queryToken);
						user = await strapi
							.query("plugin::users-permissions.user")
							.findOne({ where: { id: decoded.id } });
					} catch (err) {
						return ctx.unauthorized("Invalid or expired token");
					}
				} else {
					user = ctx.state.user;
				}

				if (!user) {
					return ctx.unauthorized("Authentication required");
				}

				// Get claimed reward with participant
				const claimedReward = await strapi.db
					.query("api::claimed-reward.claimed-reward")
					.findOne({
						where: { id },
						populate: ["participant"],
					});

				if (!claimedReward) {
					return ctx.notFound("Claimed reward not found");
				}

				// Verify ownership
				const userPhone = user?.username || user?.phone;
				const participantPhone = claimedReward.participant?.phone;

				if (userPhone !== participantPhone) {
					return ctx.forbidden("You don't have permission to cancel this reward");
				}

				// Delete the claimed reward entirely
				await strapi.db
					.query("api::claimed-reward.claimed-reward")
					.delete({ where: { id } });

				console.log("✅ Claimed reward deleted:", id);
				return { data: { id, deleted: true } };
			} catch (error) {
				console.error("❌ Error cancelling claimed reward:", error);
				return ctx.badRequest("Failed to cancel reward: " + error.message);
			}
		},

		async generatePass(ctx) {
			try {
				const { id } = ctx.params;
				const queryToken = ctx.query.access_token;

				console.log("🎫 Generating pass for claimed reward:", id);

				// ──────────────────────────────────────────────
				// AUTHENTICATION
				// ──────────────────────────────────────────────
				let user = null;
				if (queryToken) {
					try {
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
					user = ctx.state.user;
					console.log("👤 Authenticated user from header:", user?.id);
				}

				if (!user) {
					console.log("❌ No authentication provided");
					return ctx.unauthorized("Authentication required");
				}

				// ──────────────────────────────────────────────
				// FETCH CLAIMED REWARD + RELATIONS
				// ──────────────────────────────────────────────
				const claimedReward = await strapi.db
					.query("api::claimed-reward.claimed-reward")
					.findOne({
						where: { id },
						populate: ["reward", "reward.image", "business", "business.logo", "participant"],
					});

				if (!claimedReward) {
					console.log("❌ Claimed reward not found");
					return ctx.notFound("Claimed reward not found");
				}

				// ──────────────────────────────────────────────
				// SECURITY: Verify ownership
				// ──────────────────────────────────────────────
				const userPhone = user?.username || user?.phone;
				const participantPhone = claimedReward.participant?.phone;

				console.log("🔐 Security check:", {
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

				// ──────────────────────────────────────────────
				// QR CODE
				// ──────────────────────────────────────────────
				let qrData = claimedReward.qrCode;
				if (!qrData) {
					qrData = `P4E-${claimedReward.id}-${Date.now()}`;
					await strapi.db.query("api::claimed-reward.claimed-reward").update({
						where: { id: claimedReward.id },
						data: { qrCode: qrData },
					});
				}

				// ──────────────────────────────────────────────
				// CERTIFICATES
				// ──────────────────────────────────────────────
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

				console.log("🔐 Certificates loaded from environment");

				// ──────────────────────────────────────────────
				// CREATE PASS
				// ──────────────────────────────────────────────
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

				// ──────────────────────────────────────────────
				// DETERMINE WHAT DATA WE HAVE
				// ──────────────────────────────────────────────
				const reward = claimedReward.reward;
				const business = claimedReward.business;
				const hasBusiness = !!(business && business.businessName);
				const hasImage = !!(reward?.image?.url);

				console.log("📋 Pass state:", {
					hasBusiness,
					hasImage,
					businessName: business?.businessName || "none",
					rewardTitle: reward?.title || "none",
				});

				// ──────────────────────────────────────────────
				// HEADER: Points redeemed (top-right of pass)
				// ──────────────────────────────────────────────
				pass.headerFields.push({
					key: "points",
					label: "POINTS REDEEMED",
					value: claimedReward.pointsSpent.toString(),
					textAlignment: "PKTextAlignmentRight",
				});

				// ──────────────────────────────────────────────
				// PRIMARY: Reward title (big text)
				// ──────────────────────────────────────────────
				pass.primaryFields.push({
					key: "reward",
					label: "",
					value: reward?.title || "Points4Earth Reward",
				});

				// ──────────────────────────────────────────────
				// SECONDARY: Subtitle (business name) + description
				// Only show business name as subtitle if we have one
				// ──────────────────────────────────────────────
				if (hasBusiness) {
					pass.secondaryFields.push({
						key: "subtitle",
						label: "",
						value: business.businessName,
					});
				}

				// ──────────────────────────────────────────────
				// AUXILIARY: Bottom row — Business Address + Expires
				// Top-aligned, adapts based on whether business exists
				// ──────────────────────────────────────────────
				if (hasBusiness) {
					// Build address string from available fields
					const addressParts = [];
					if (business.streetAddress) addressParts.push(business.streetAddress);

					const cityStateZip = [];
					if (business.city) cityStateZip.push(business.city);
					if (business.state) cityStateZip.push(business.state);
					if (business.zipCode) cityStateZip.push(business.zipCode);
					if (cityStateZip.length > 0) {
						// Format as "City, ST 80202"
						let formatted = "";
						if (business.city && business.state) {
							formatted = `${business.city}, ${business.state}`;
						} else if (business.city) {
							formatted = business.city;
						} else if (business.state) {
							formatted = business.state;
						}
						if (business.zipCode) {
							formatted = formatted ? `${formatted} ${business.zipCode}` : business.zipCode;
						}
						addressParts.push(formatted);
					}

					const fullAddress = addressParts.length > 0
						? `${business.businessName}\n${addressParts.join("\n")}`
						: business.businessName;

					pass.auxiliaryFields.push({
						key: "businessAddress",
						label: "BUSINESS ADDRESS",
						value: fullAddress,
						textAlignment: "PKTextAlignmentLeft",
					});
				}

				// Expires — always present
				const expiresValue = claimedReward.expiresAt
					? new Date(claimedReward.expiresAt).toLocaleDateString("en-US", {
							month: "short",
							day: "numeric",
							year: "numeric",
						})
					: "No expiration";

				pass.auxiliaryFields.push({
					key: "expires",
					label: "EXPIRES",
					value: expiresValue,
					textAlignment: hasBusiness ? "PKTextAlignmentRight" : "PKTextAlignmentLeft",
				});

				// ──────────────────────────────────────────────
				// BACK FIELDS: Terms, instructions, contact, about
				// ──────────────────────────────────────────────
				if (reward?.description) {
					pass.backFields.push({
						key: "description",
						label: "Description",
						value: reward.description,
					});
				}

				if (reward?.termsConditions) {
					pass.backFields.push({
						key: "terms",
						label: "Terms & Conditions",
						value: reward.termsConditions,
					});
				}

				if (reward?.redemptionInstructions) {
					pass.backFields.push({
						key: "instructions",
						label: "How to Redeem",
						value: reward.redemptionInstructions,
					});
				}

				// Business contact info on back (if business exists)
				if (hasBusiness) {
					const contactParts = [];
					if (business.businessName) contactParts.push(business.businessName);
					if (business.contactPhone) contactParts.push(`Phone: ${business.contactPhone}`);
					if (business.contactEmail) contactParts.push(`Email: ${business.contactEmail}`);
					if (business.website) contactParts.push(business.website);

					if (contactParts.length > 0) {
						pass.backFields.push({
							key: "contact",
							label: "Business Contact",
							value: contactParts.join("\n"),
						});
					}
				}

				// Always include About P4E
				pass.backFields.push({
					key: "about",
					label: "About Points4Earth",
					value: "Earn points for eco-friendly transportation choices and redeem them for rewards from local businesses. Every trip makes a difference!",
				});

				// ──────────────────────────────────────────────
				// BARCODE (QR)
				// ──────────────────────────────────────────────
				pass.setBarcodes({
					message: qrData,
					format: "PKBarcodeFormatQR",
					messageEncoding: "iso-8859-1",
				});

				// ──────────────────────────────────────────────
				// STRIP IMAGE (optional — from reward image)
				// ──────────────────────────────────────────────
				if (hasImage) {
					try {
						const imageUrl = reward.image.url;
						const fullImageUrl = imageUrl.startsWith("http")
							? imageUrl
							: `${process.env.STRAPI_URL || "https://lovely-charity-e91f9ec79a.strapiapp.com"}${imageUrl}`;

						console.log("🖼️ Fetching strip image:", fullImageUrl);

						const fetch = (await import("node-fetch")).default;
						const imageResponse = await fetch(fullImageUrl);

						if (imageResponse.ok) {
							const imageBuffer = await imageResponse.buffer();
							// Strip image: 375x123 @1x, 750x246 @2x, 1125x369 @3x
							// We'll add as both sizes — Apple will pick the right one
							pass.addBuffer("strip.png", imageBuffer);
							pass.addBuffer("strip@2x.png", imageBuffer);
							console.log("✅ Strip image added to pass");
						} else {
							console.log("⚠️ Could not fetch strip image:", imageResponse.status);
						}
					} catch (imgError) {
						console.log("⚠️ Error adding strip image:", imgError.message);
						// Continue without image — don't fail the whole pass
					}
				}

				// ──────────────────────────────────────────────
				// BUSINESS LOGO AS THUMBNAIL (optional)
				// ──────────────────────────────────────────────
				if (hasBusiness && business.logo?.url) {
					try {
						const logoUrl = business.logo.url;
						const fullLogoUrl = logoUrl.startsWith("http")
							? logoUrl
							: `${process.env.STRAPI_URL || "https://lovely-charity-e91f9ec79a.strapiapp.com"}${logoUrl}`;

						console.log("🖼️ Fetching business logo:", fullLogoUrl);

						const fetch = (await import("node-fetch")).default;
						const logoResponse = await fetch(fullLogoUrl);

						if (logoResponse.ok) {
							const logoBuffer = await logoResponse.buffer();
							pass.addBuffer("thumbnail.png", logoBuffer);
							pass.addBuffer("thumbnail@2x.png", logoBuffer);
							console.log("✅ Business logo added as thumbnail");
						} else {
							console.log("⚠️ Could not fetch business logo:", logoResponse.status);
						}
					} catch (logoError) {
						console.log("⚠️ Error adding business logo:", logoError.message);
						// Continue without logo
					}
				}

				console.log("📊 Pass fields configured");

				// ──────────────────────────────────────────────
				// GENERATE & RETURN
				// ──────────────────────────────────────────────
				const passBuffer = pass.getAsBuffer();

				console.log("✅ Pass buffer generated, size:", passBuffer.length);

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
