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

				const claimedReward = await strapi.db
					.query("api::claimed-reward.claimed-reward")
					.findOne({
						where: { id },
						populate: ["participant"],
					});

				if (!claimedReward) {
					return ctx.notFound("Claimed reward not found");
				}

				const userPhone = user?.username || user?.phone;
				const participantPhone = claimedReward.participant?.phone;

				if (userPhone !== participantPhone) {
					return ctx.forbidden("You don't have permission to cancel this reward");
				}

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

				// ── AUTH ──
				let user = null;
				if (queryToken) {
					try {
						const decoded = await strapi.plugins[
							"users-permissions"
						].services.jwt.verify(queryToken);
						user = await strapi
							.query("plugin::users-permissions.user")
							.findOne({ where: { id: decoded.id } });
						console.log("👤 Auth from query token:", user?.id);
					} catch (err) {
						console.log("❌ Invalid token:", err.message);
						return ctx.unauthorized("Invalid or expired token");
					}
				} else {
					user = ctx.state.user;
					console.log("👤 Auth from header:", user?.id);
				}

				if (!user) {
					return ctx.unauthorized("Authentication required");
				}

				// ── FETCH DATA ──
				const claimedReward = await strapi.db
					.query("api::claimed-reward.claimed-reward")
					.findOne({
						where: { id },
						populate: ["reward", "business", "participant"],
					});

				if (!claimedReward) {
					return ctx.notFound("Claimed reward not found");
				}

				// ── OWNERSHIP CHECK ──
				const userPhone = user?.username || user?.phone;
				const participantPhone = claimedReward.participant?.phone;

				if (userPhone !== participantPhone) {
					return ctx.forbidden("You don't have permission to access this reward");
				}

				console.log("✅ Authorization verified");

				// ── QR CODE ──
				let qrData = claimedReward.qrCode;
				if (!qrData) {
					qrData = `P4E-${claimedReward.id}-${Date.now()}`;
					await strapi.db.query("api::claimed-reward.claimed-reward").update({
						where: { id: claimedReward.id },
						data: { qrCode: qrData },
					});
				}

				// ── CERTIFICATES ──
				const wwdrCert = Buffer.from(process.env.WWDR_CERT, "base64").toString("utf-8");
				const signerCert = Buffer.from(process.env.SIGNER_CERT, "base64").toString("utf-8");
				const signerKey = Buffer.from(process.env.SIGNER_KEY, "base64").toString("utf-8");

				// ── CREATE PASS ──
				const reward = claimedReward.reward;
				const business = claimedReward.business;
				const hasBusiness = !!(business && business.businessName);

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
						description: reward?.title || "Points4Earth Reward",
					}
				);

				// ── HEADER: Points redeemed (top-right) ──
				pass.headerFields.push({
					key: "points",
					label: "POINTS REDEEMED",
					value: claimedReward.pointsSpent.toString(),
					textAlignment: "PKTextAlignmentRight",
				});

				// ── PRIMARY: Reward title ──
				pass.primaryFields.push({
					key: "reward",
					label: "",
					value: reward?.title || "Points4Earth Reward",
				});

				// ── SECONDARY: Business name (only if business exists) ──
				if (hasBusiness) {
					pass.secondaryFields.push({
						key: "business",
						label: "BUSINESS",
						value: business.businessName,
						textAlignment: "PKTextAlignmentLeft",
					});
				}

				// ── AUXILIARY: Expires ──
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
					textAlignment: "PKTextAlignmentLeft",
				});

				// ── BACK FIELDS ──
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

				if (hasBusiness) {
					const contactParts = [];
					if (business.businessName) contactParts.push(business.businessName);
					if (business.streetAddress) contactParts.push(business.streetAddress);
					const cityLine = [business.city, business.state].filter(Boolean).join(", ");
					if (cityLine) contactParts.push(business.zipCode ? `${cityLine} ${business.zipCode}` : cityLine);
					if (business.contactPhone) contactParts.push(`Phone: ${business.contactPhone}`);
					if (business.contactEmail) contactParts.push(`Email: ${business.contactEmail}`);
					if (business.website) contactParts.push(business.website);

					if (contactParts.length > 0) {
						pass.backFields.push({
							key: "contact",
							label: "Business Info",
							value: contactParts.join("\n"),
						});
					}
				}

				pass.backFields.push({
					key: "about",
					label: "About Points4Earth",
					value: "Earn points for eco-friendly transportation choices and redeem them for rewards from local businesses. Every trip makes a difference!",
				});

				// ── BARCODE ──
				pass.setBarcodes({
					message: qrData,
					format: "PKBarcodeFormatQR",
					messageEncoding: "iso-8859-1",
				});

				// No strip image. No background image. Clean and simple.

				console.log("📊 Pass configured:", {
					hasBusiness,
					title: reward?.title,
					points: claimedReward.pointsSpent,
				});

				// ── GENERATE ──
				const passBuffer = pass.getAsBuffer();
				console.log("✅ Pass generated, size:", passBuffer.length);

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
