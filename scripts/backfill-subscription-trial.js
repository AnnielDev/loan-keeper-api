// One-off backfill for users created before the subscription system existed:
// those documents have no trialEndsAt (now a required field), so without
// this they'd read back with subscriptionStatus defaulting to "trialing"
// but no trialEndsAt — which the subscription guard treats as expired,
// locking every existing user out immediately on deploy.
//
// Grants existing users a fresh 15-day trial starting from when this script
// runs (not their original signup date), so nobody is locked out without
// warning. Re-run is safe: only touches users still missing trialEndsAt.
//
// Usage:
//   node scripts/backfill-subscription-trial.js         (dry run, prints what would change)
//   node scripts/backfill-subscription-trial.js --apply  (actually write the changes)

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  }
}
loadEnvFile(path.join(__dirname, "..", ".env"));

const MONGO_URL = process.env.MONGO_URL_CONNECTION;
const TRIAL_DURATION_MS = 15 * 24 * 60 * 60 * 1000;
const args = process.argv.slice(2);
const apply = args.includes("--apply");

async function main() {
  if (!MONGO_URL) {
    throw new Error("MONGO_URL_CONNECTION is not set (expected in .env)");
  }

  await mongoose.connect(MONGO_URL);
  const users = mongoose.connection.db.collection("users");

  const affected = await users
    .find({ trialEndsAt: { $exists: false } })
    .toArray();

  if (affected.length === 0) {
    console.log("No matching users found.");
    await mongoose.disconnect();
    return;
  }

  const trialEndsAt = new Date(Date.now() + TRIAL_DURATION_MS);

  for (const user of affected) {
    console.log(`\nUser ${user.email} (${user._id}): trialEndsAt -> ${trialEndsAt.toISOString()}`);

    if (apply) {
      await users.updateOne(
        { _id: user._id },
        { $set: { trialEndsAt, subscriptionStatus: "trialing" } },
      );
      console.log("  applied.");
    }
  }

  if (!apply) {
    console.log("\nDry run only — re-run with --apply to write these changes.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
