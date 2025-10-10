const { PassGenerator } = require("passkit-generator");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

module.exports = {
	async generatePass(ctx) {
		try {
			const { claimedRewardId } = ctx.request.body;

			// Get claimed reward with all relations
			const claimedReward = await strapi.db
				.query("api::claimed-reward.claimed-reward")
				.findOne({
					where: { id: claimedRewardId },
					populate: ["reward", "business", "participant"],
				});

			if (!claimedReward) {
				return ctx.badRequest("Claimed reward not found");
			}

			// Generate unique QR code
			const qrData = `P4E-${claimedReward.id}-${Date.now()}`;
			const qrCodeDataURL = await QRCode.toDataURL(qrData);

			// Create pass
			const pass = await PassGenerator.from(
				{
					model: path.resolve(__dirname, "../../../passkit"), // Your pass template folder
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
					organizationName: "Points4Earth",
					passTypeIdentifier: process.env.PASS_TYPE_IDENTIFIER,
					teamIdentifier: process.env.APPLE_TEAM_ID,
				}
			);

			// Add pass data
			pass.headerFields.push({
				key: "business",
				label: "Business",
				value: claimedReward.business.businessName,
			});

			pass.primaryFields.push({
				key: "reward",
				label: claimedReward.reward.title,
				value: claimedReward.reward.subtitle,
			});

			pass.secondaryFields.push({
				key: "expires",
				label: "Expires",
				value: new Date(claimedReward.expiresAt).toLocaleDateString(),
			});

			pass.auxiliaryFields.push({
				key: "points",
				label: "Points Redeemed",
				value: claimedReward.pointsSpent,
			});

			pass.backFields.push({
				key: "terms",
				label: "Terms & Conditions",
				value:
					claimedReward.reward.termsConditions || "See business for details",
			});

			// Add QR code as barcode
			pass.setBarcodes({
				message: qrData,
				format: "PKBarcodeFormatQR",
				messageEncoding: "iso-8859-1",
			});

			// Generate the pass buffer
			const passBuffer = pass.getAsBuffer();

			// Save pass file (you'd want to upload to cloud storage in production)
			const passFilename = `pass-${claimedReward.id}.pkpass`;
			const passPath = path.resolve(
				__dirname,
				`../../../../public/passes/${passFilename}`
			);
			fs.writeFileSync(passPath, passBuffer);

			// Update claimed reward with pass URL and QR code
			await strapi.db.query("api::claimed-reward.claimed-reward").update({
				where: { id: claimedReward.id },
				data: {
					qrCode: qrData,
					passUrl: `/passes/${passFilename}`,
				},
			});

			return ctx.send({
				passUrl: `/passes/${passFilename}`,
				qrCode: qrData,
			});
		} catch (error) {
			console.error("Error generating pass:", error);
			return ctx.badRequest("Failed to generate pass");
		}
	},
};
