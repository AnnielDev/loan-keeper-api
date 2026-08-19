// One-off correction for loans created before the timezone fix to
// startDate/paymentDate handling: their startDate and unpaid installments'
// dueDate were anchored one calendar day later than intended (e.g. a loan
// started "today" showing its first due date shifted forward by a day).
//
// Usage:
//   node scripts/fix-shifted-loan-dates.js               (dry run, prints what would change)
//   node scripts/fix-shifted-loan-dates.js --loanCode LP-0001   (limit to one loan)
//   node scripts/fix-shifted-loan-dates.js --apply        (actually write the changes)
//
// Shifts startDate and every installment's dueDate back by exactly one day
// (UTC), leaving paid installments' paidAt/paidAmount untouched. Run this
// once per affected loan, then verify in the app before moving on.

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
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

function shiftBackOneDay(date) {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() - 1);
  return shifted;
}

async function main() {
  if (!MONGO_URL) {
    throw new Error("MONGO_URL_CONNECTION is not set (expected in .env)");
  }

  await mongoose.connect(MONGO_URL);
  const loans = mongoose.connection.db.collection("loans");

  const filter = onlyLoanCode ? { code: onlyLoanCode } : {};
  const affected = await loans.find(filter).toArray();

  if (affected.length === 0) {
    console.log("No matching loans found.");
    await mongoose.disconnect();
    return;
  }

  for (const loan of affected) {
    const newStartDate = shiftBackOneDay(loan.startDate);
    const newInstallments = loan.installments.map((installment) => ({
      ...installment,
      dueDate: shiftBackOneDay(installment.dueDate),
    }));

    console.log(`\nLoan ${loan.code} (${loan._id})`);
    console.log(`  startDate: ${loan.startDate.toISOString()} -> ${newStartDate.toISOString()}`);
    for (let i = 0; i < loan.installments.length; i++) {
      console.log(
        `  installment ${i + 1}: ${loan.installments[i].dueDate.toISOString()} -> ${newInstallments[i].dueDate.toISOString()}`,
      );
    }

    if (apply) {
      await loans.updateOne(
        { _id: loan._id },
        { $set: { startDate: newStartDate, installments: newInstallments } },
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
