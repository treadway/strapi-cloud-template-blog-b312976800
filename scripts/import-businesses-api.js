"use strict";

/**
 * Import businesses via the Strapi REST API (works with Cloud).
 *
 * Usage:
 *   node scripts/import-businesses-api.js path/to/businesses.json
 *   node scripts/import-businesses-api.js                          # uses data/new-businesses.json
 *
 * Requires a valid API token set in STRAPI_API_TOKEN env var,
 * or you can paste it directly below.
 */

const fs = require("fs-extra");
const path = require("path");

// ── Config ───────────────────────────────────────────────────
const STRAPI_URL =
	process.env.STRAPI_URL ||
	"https://lovely-charity-e91f9ec79a.strapiapp.com/api";

// Create a full-access API token in Strapi admin:
// Settings → API Tokens → Create new → Full access
const API_TOKEN = process.env.STRAPI_API_TOKEN || "";

// ── Time format helper ───────────────────────────────────────
function padTime(t) {
	if (!t) return t;
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

// ── Main ─────────────────────────────────────────────────────
async function main() {
	if (!API_TOKEN) {
		console.error(
			"❌ No API token. Set STRAPI_API_TOKEN env var or paste it in the script.\n" +
			"   Create one in Strapi admin → Settings → API Tokens → Full access"
		);
		process.exit(1);
	}

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
	console.log(`🌐 Target: ${STRAPI_URL}\n`);

	let created = 0;
	for (const biz of businesses) {
		try {
			const rawHours = biz.hours && biz.hours.length > 0 ? biz.hours : DEFAULT_HOURS;
			const hours = normalizeHours(rawHours);

			// Build the payload — Strapi REST API expects { data: { ... } }
			const { logo, owner, ...rest } = biz;
			const payload = {
				data: {
					...rest,
					hours,
				},
			};

			const res = await fetch(`${STRAPI_URL}/businesses`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${API_TOKEN}`,
				},
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(
					`${res.status} — ${err?.error?.message || JSON.stringify(err)}`
				);
			}

			created++;
			console.log(`✅ ${created}. ${biz.businessName}`);
		} catch (err) {
			console.error(`❌ Failed: ${biz.businessName}`, err.message);
		}
	}

	console.log(`\n🎉 Done — ${created}/${businesses.length} businesses created`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
