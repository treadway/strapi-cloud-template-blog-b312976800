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
					return ctx.forbidden(
						"You don't have permission to cancel this reward"
					);
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
						populate: {
							reward: {
								populate: ["image", "business"],
							},
							business: true,
							participant: true,
						},
					});

				if (!claimedReward) {
					return ctx.notFound("Claimed reward not found");
				}

				// ── OWNERSHIP CHECK ──
				const userPhone = user?.username || user?.phone;
				const participantPhone = claimedReward.participant?.phone;

				if (userPhone !== participantPhone) {
					return ctx.forbidden(
						"You don't have permission to access this reward"
					);
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

				// ── RESOLVE DATA ──
				const reward = claimedReward.reward;
				// Business can come from claimed-reward directly OR through reward.business
				const business = claimedReward.business || reward?.business || null;
				const hasBusiness = !!(business && business.businessName);
				const hasImage = !!reward?.image?.url;

				console.log("📋 Pass data:", {
					hasBusiness,
					hasImage,
					businessName: business?.businessName || "none",
					title: reward?.title || "none",
					subtitle: reward?.subtitle || "none",
					description: reward?.description || "none",
				});

				// ── CREATE PASS ──
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
						// logoText renders next to the logo image in the header
						// Shows business name if available, empty if not
						logoText: hasBusiness ? business.businessName : "",
					}
				);

				// ══════════════════════════════════════════
				// LAYOUT (Apple generic pass):
				//
				// ┌──────────────────────────────────────┐
				// │ [Logo] logoText     Redeem At        │ ← logo + logoText + headerFields
				// │                     businessName     │
				// ├──────────────────────────────────────┤
				// │ title              [THUMBNAIL]       │ ← primaryFields + thumbnail.png
				// │ subtitle           [  IMAGE  ]       │
				// │ description        [         ]       │
				// ├──────────────────────────────────────┤
				// │ EXPIRES            POINTS SPENT      │ ← auxiliaryFields
				// │ Apr 20, 2026       300               │
				// ├──────────────────────────────────────┤
				// │            [QR CODE]                 │ ← barcode
				// └──────────────────────────────────────┘
				// ══════════════════════════════════════════

				// ── HEADER FIELD: "Redeem At" + business name (top-right) ──
				if (hasBusiness) {
					pass.headerFields.push({
						key: "redeemAt",
						label: "Redeem At",
						value: business.businessName,
					});
				}

				// ── PRIMARY FIELD: Title + subtitle combined ──
				const titleParts = [reward?.title || "Points4Earth Reward"];
				// if (reward?.subtitle) titleParts.push(reward.subtitle);

				pass.primaryFields.push({
					key: "reward",
					label: "",
					value: titleParts.join(" "),
				});

				// ── SECONDARY FIELD: Description ──
				if (reward?.description) {
					pass.secondaryFields.push({
						key: "description",
						label: "",
						value: reward.description,
						textAlignment: "PKTextAlignmentLeft",
					});
				}

				// ── AUXILIARY FIELDS: Expires (left) + Points Spent (right) ──
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

				pass.auxiliaryFields.push({
					key: "points",
					label: "POINTS SPENT",
					value: claimedReward.pointsSpent.toString(),
					textAlignment: "PKTextAlignmentRight",
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
					const cityLine = [business.city, business.state]
						.filter(Boolean)
						.join(", ");
					if (cityLine)
						contactParts.push(
							business.zipCode ? `${cityLine} ${business.zipCode}` : cityLine
						);
					if (business.contactPhone)
						contactParts.push(`Phone: ${business.contactPhone}`);
					if (business.contactEmail)
						contactParts.push(`Email: ${business.contactEmail}`);
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
					value:
						"Earn points for eco-friendly transportation choices and redeem them for rewards from local businesses. Every trip makes a difference!",
				});

				// ── BARCODE ──
				pass.setBarcodes({
					message: qrData,
					format: "PKBarcodeFormatQR",
					messageEncoding: "iso-8859-1",
				});

				// ── THUMBNAIL IMAGE (reward image — sits next to primary field) ──
				if (hasImage) {
					try {
						const imageUrl = reward.image.url;
						const fullImageUrl = imageUrl.startsWith("http")
							? imageUrl
							: `${
									process.env.STRAPI_URL ||
									"https://lovely-charity-e91f9ec79a.strapiapp.com"
							  }${imageUrl}`;

						console.log("🖼️ Fetching thumbnail image:", fullImageUrl);

						const fetch = (await import("node-fetch")).default;
						const imageResponse = await fetch(fullImageUrl);

						if (imageResponse.ok) {
							const imageBuffer = await imageResponse.buffer();
							pass.addBuffer("thumbnail.png", imageBuffer);
							pass.addBuffer("thumbnail@2x.png", imageBuffer);
							console.log("✅ Thumbnail image added");
						} else {
							console.log(
								"⚠️ Could not fetch thumbnail:",
								imageResponse.status
							);
						}
					} catch (imgError) {
						console.log("⚠️ Error adding thumbnail:", imgError.message);
					}
				}

				console.log("📊 Pass fields configured");

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
