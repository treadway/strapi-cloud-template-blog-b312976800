"use strict";
const { createCoreController } = require("@strapi/strapi").factories;
const PKPass = require("passkit-generator").PKPass; // CHANGED
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

				console.log("🎫 Generating pass for claimed reward:", id);

				// Get claimed reward with all relations
				const claimedReward = await strapi.db
					.query("api::claimed-reward.claimed-reward")
					.findOne({
						where: { id },
						populate: ["reward", "business", "participant"],
					});

				if (!claimedReward) {
					return ctx.notFound("Claimed reward not found");
				}

				console.log("📦 Claimed reward data:", {
					id: claimedReward.id,
					reward: claimedReward.reward?.title,
					business: claimedReward.business?.businessName,
					participant: claimedReward.participant?.name,
				});

				// Generate unique QR code if not exists
				let qrData = claimedReward.qrCode;
				if (!qrData) {
					qrData = `P4E-${claimedReward.id}-${Date.now()}`;
					await strapi.db.query("api::claimed-reward.claimed-reward").update({
						where: { id: claimedReward.id },
						data: { qrCode: qrData },
					});
				}

				console.log("🔑 QR Code:", qrData);

				// Create pass
				const pass = await PKPass.from(
					{
						model: path.resolve(__dirname, "../../../passkit"),
						certificates: {
							wwdr: fs.readFileSync(
								path.resolve(__dirname, "../../../certs/WWDR.pem")
							),
							signerCert: fs.readFileSync(
								path.resolve(__dirname, "../../../certs/signerCert.pem")
							),
							signerKey: fs.readFileSync(
								path.resolve(__dirname, "../../../certs/signerKey.pem")
							),
							signerKeyPassphrase: process.env.PASS_SIGNER_PASSPHRASE,
						},
					},
					{
						serialNumber: `P4E-${claimedReward.id}`,
						description: claimedReward.reward.title,
					}
				);

				console.log("✅ Pass created");

				// Add pass data
				pass.headerFields.push({
					key: "business",
					label: "BUSINESS",
					value: claimedReward.business?.businessName || "Points4Earth",
				});

				pass.primaryFields.push({
					key: "reward",
					label: claimedReward.reward.title,
					value: claimedReward.reward.subtitle || "",
				});

				pass.secondaryFields.push({
					key: "expires",
					label: "EXPIRES",
					value: new Date(claimedReward.expiresAt).toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
						year: "numeric",
					}),
					textAlignment: "PKTextAlignmentLeft",
				});

				pass.secondaryFields.push({
					key: "points",
					label: "POINTS REDEEMED",
					value: claimedReward.pointsSpent.toString(),
					textAlignment: "PKTextAlignmentRight",
				});

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

				// Add QR code as barcode
				pass.setBarcodes({
					message: qrData,
					format: "PKBarcodeFormatQR",
					messageEncoding: "iso-8859-1",
				});

				console.log("📊 Pass fields configured");

				// Generate the pass buffer
				const passBuffer = pass.getAsBuffer();

				console.log("✅ Pass buffer generated, size:", passBuffer.length);

				// Set response headers for download
				ctx.set("Content-Type", "application/vnd.apple.pkpass");
				ctx.set(
					"Content-Disposition",
					`attachment; filename="reward-${claimedReward.id}.pkpass"`
				);

				return passBuffer;
			} catch (error) {
				console.error("❌ Error generating pass:", error);
				return ctx.badRequest("Failed to generate pass: " + error.message);
			}
		},
	})
);
