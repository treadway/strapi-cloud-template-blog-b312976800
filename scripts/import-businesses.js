"use strict";

/**
 * Import businesses from a JSON file.
 *
 * Usage:
 *   node scripts/import-businesses.js                          # uses data/new-businesses.json
 *   node scripts/import-businesses.js path/to/businesses.json  # custom file
 *
 * JSON format: array of business objects matching the Business content type.
 * Hours are auto-populated with 9:00–17:00 Mon–Fri, closed Sat/Sun
 * if no `hours` array is provided on the entry.
 *
 * Set --clear to delete ALL existing businesses first (careful!).
 */

const fs = require("fs-extra");
const path = require("path");

// Strapi v5 time fields require HH:mm:ss.SSS format
function padTime(t) {
	if (!t) return t;
	// "16:00" → "16:00:00.000", "09:00:00" → "09:00:00.000"
	const parts = t.split(":");
	const h = parts[0] || "00";
	const m = parts[1] || "00";
	const s = parts[2] || "00";
	return `${h}:${m}:${s}.000`;
}

function normalizeHours(hours) {
	return hours.map((h) => ({
		...h,
		open: h.open ? padTime(h.open) : undefined,
		close: h.close ? padTime(h.close) : undefined,
	}));
}

const DEFAULT_HOURS = [
	{ day: "Monday", open: "09:00:00.000", close: "17:00:00.000", isClosed: false },
	{ day: "Tuesday", open: "09:00:00.000", close: "17:00:00.000", isClosed: false },
	{ day: "Wednesday", open: "09:00:00.000", close: "17:00:00.000", isClosed: false },
	{ day: "Thursday", open: "09:00:00.000", close: "17:00:00.000", isClosed: false },
	{ day: "Friday", open: "09:00:00.000", close: "17:00:00.000", isClosed: false },
	{ day: "Saturday", isClosed: true },
	{ day: "Sunday", isClosed: true },
];

async function importBusinesses() {
	const { createStrapi, compileStrapi } = require("@strapi/strapi");

	// Resolve JSON path
	const jsonArg = process.argv[2];
	const jsonPath = jsonArg
		? path.resolve(jsonArg)
		: path.resolve(__dirname, "..", "data", "new-businesses.json");

	if (!fs.existsSync(jsonPath)) {
		console.error(`❌ File not found: ${jsonPath}`);
		process.exit(1);
	}

	const businesses = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
	console.log(`📦 Loaded ${businesses.length} businesses from ${jsonPath}`);

	// Boot Strapi
	const appContext = await compileStrapi();
	const app = await createStrapi(appContext).load();
	app.log.level = "error";

	const shouldClear = process.argv.includes("--clear");
	if (shouldClear) {
		console.log("🗑️  Clearing existing businesses...");
		const existing = await strapi.documents("api::business.business").findMany({});
		for (const biz of existing) {
			await strapi.documents("api::business.business").delete({ documentId: biz.documentId });
		}
		console.log(`   Deleted ${existing.length} businesses`);
	}

	let created = 0;
	for (const biz of businesses) {
		try {
			// Auto-fill hours if not provided, normalize time format
			const rawHours = biz.hours && biz.hours.length > 0 ? biz.hours : DEFAULT_HOURS;
			const hours = normalizeHours(rawHours);

			// Strip the logo connect syntax — handle it separately
			const { logo, ...rest } = biz;

			const entry = await strapi.documents("api::business.business").create({
				data: {
					...rest,
					hours,
				},
			});

			// Connect logo media if specified
			if (logo && logo.connect && logo.connect.length > 0) {
				await strapi.db.query("api::business.business").update({
					where: { id: entry.id },
					data: {
						logo: logo.connect[0],
					},
				});
			}

			created++;
			console.log(`✅ ${created}. ${biz.businessName}`);
		} catch (err) {
			console.error(`❌ Failed: ${biz.businessName}`, err.message);
		}
	}

	console.log(`\n🎉 Done — ${created}/${businesses.length} businesses created`);

	await app.destroy();
	process.exit(0);
}

importBusinesses().catch((err) => {
	console.error(err);
	process.exit(1);
});
