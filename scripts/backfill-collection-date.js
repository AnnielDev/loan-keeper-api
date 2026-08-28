// One-off backfill for loans created before the "collectionDate" field
// existed: those documents have no collectionDate, so we default it to
// their existing startDate (installments already have their real dueDate
// stored, so this only fills the display/reference field going forward).
//
// Usage:
//   node scripts/backfill-collection-date.js               (dry run, prints what would change)
//   node scripts/backfill-collection-date.js --loanCode LP-0001   (limit to one loan)
//   node scripts/backfill-collection-date.js --apply        (actually write the changes)

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
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const loanCodeIndex = args.indexOf("--loanCode");
const onlyLoanCode = loanCodeIndex >= 0 ? args[loanCodeIndex + 1] : null;

async function main() {
  if (!MONGO_URL) {
    throw new Error("MONGO_URL_CONNECTION is not set (expected in .env)");
  }

  await mongoose.connect(MONGO_URL);
  const loans = mongoose.connection.db.collection("loans");

  const filter = {
    collectionDate: { $exists: false },
    ...(onlyLoanCode ? { code: onlyLoanCode } : {}),
  };
  const affected = await loans.find(filter).toArray();

  if (affected.length === 0) {
    console.log("No matching loans found.");
    await mongoose.disconnect();
    return;
  }

  for (const loan of affected) {
    console.log(
      `\nLoan ${loan.code} (${loan._id}): collectionDate -> ${loan.startDate.toISOString()}`,
    );

    if (apply) {
      await loans.updateOne(
        { _id: loan._id },
        { $set: { collectionDate: loan.startDate } },
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
