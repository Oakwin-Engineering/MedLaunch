const fs = require("fs");
const path = require("path");

// Provider names from provider_location_relationship.csv (excluding inactive providers)
const providers = [
  "Smith, John A",
  "Johnson, Mary K",
  "Williams, Robert T",
  "Brown, Jennifer L",
  "Jones, Michael B",
  "Garcia, Sarah M",
  "Miller, David R",
  "Davis, Lisa A",
  "Rodriguez, Carlos J",
  "Martinez, Patricia S",
  "Hernandez, Luis M",
  "Lopez, Maria T",
  "Gonzalez, Francisco R",
  "Wilson, Amanda K",
  "Anderson, Thomas J",
  "Thomas, Nancy L",
  "Taylor, Steven M",
  "Moore, Barbara A",
  "Jackson, Kevin D",
  "Martin, Susan R",
  "Lee, Brian K",
  "Perez, Diego M",
];

// Provider-Location mapping from CSV
const providerLocations = {
  "Smith, John A": "Prince George",
  "Johnson, Mary K": "Ashlake",
  "Williams, Robert T": "Discovery",
  "Brown, Jennifer L": "Discovery",
  "Jones, Michael B": "Ashlake",
  "Garcia, Sarah M": "Ashlake",
  "Miller, David R": "Ashlake",
  "Davis, Lisa A": "Discovery",
  "Rodriguez, Carlos J": "Discovery",
  "Martinez, Patricia S": "Ashlake",
  "Hernandez, Luis M": "Discovery",
  "Lopez, Maria T": "Ashlake",
  "Gonzalez, Francisco R": "Ashlake",
  "Wilson, Amanda K": "Discovery",
  "Anderson, Thomas J": "Discovery",
  "Thomas, Nancy L": "Ashlake",
  "Taylor, Steven M": "Discovery",
  "Moore, Barbara A": "Discovery",
  "Jackson, Kevin D": "Prince George",
  "Martin, Susan R": "Discovery",
  "Lee, Brian K": "Discovery",
  "Perez, Diego M": "Ashlake",
};

// Locations mapped from CSV locations to payroll format
const locationMapping = {
  "Prince George": "VCFP-MAIN-CAMPUS",
  Ashlake: "VCFP-SCRIBES-ASHLAKE",
  Discovery: "VCFP-APC-DISCOVERY",
  Inactive: "INACTIVE",
};

// Generate random number between min and max
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random decimal between min and max
function randomDecimal(min, max, decimals = 2) {
  return (Math.random() * (max - min) + min).toFixed(decimals);
}

// Generate random date in a specific year
function generatePayrollDates(year = 2022) {
  const dates = [];
  const startDate = new Date(`${year}-01-07`);
  const endDate = new Date(`${year}-12-23`);

  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 14); // Bi-weekly
  }

  return dates;
}

// Generate employee ID
function generateEmployeeId() {
  return randomBetween(100, 999999);
}

// Generate check number
function generateCheckNumber(checkDate, sequence) {
  const dateStr = checkDate.toISOString().slice(0, 10).replace(/-/g, "");
  return `${dateStr}${sequence.toString().padStart(2, "0")}`;
}

// Generate payroll row
function generatePayrollRow(
  provider,
  location,
  employeeId,
  checkDate,
  checkNumber,
  sequence
) {
  // Generate much smaller payroll amounts so they're comparable to payment totals
  // Payments aggregate to ~$30k-$100k per provider per month
  // Payroll should be similar range to create red/green profit scenarios
  const regularHours = randomBetween(40, 80); // Bi-weekly hours
  const regularRate = randomDecimal(150, 400); // Hourly rate
  const regularAmount = (regularHours * parseFloat(regularRate)).toFixed(2);

  const otHours = randomBetween(0, 20); // Overtime hours
  const otRate = (parseFloat(regularRate) * 1.5).toFixed(2);
  const otAmount = (otHours * parseFloat(otRate)).toFixed(2);

  const ptoHours = randomBetween(0, 40); // PTO hours
  const ptoAmount = (ptoHours * parseFloat(regularRate)).toFixed(2);

  const holidayHours = randomBetween(0, 16); // Holiday hours
  const holidayAmount = (holidayHours * parseFloat(regularRate)).toFixed(2);

  // Smaller bonus/adjustment amounts
  const bonusAmount =
    Math.random() > 0.7
      ? `-${randomDecimal(500, 2000)}`
      : randomDecimal(500, 3000);
  const floatAmount =
    Math.random() > 0.8
      ? `-${randomDecimal(200, 1000)}`
      : randomDecimal(200, 1500);
  const brvmtAmount =
    Math.random() > 0.9
      ? `-${randomDecimal(100, 800)}`
      : randomDecimal(100, 1000);
  const retroAmount =
    Math.random() > 0.85
      ? `-${randomDecimal(300, 1500)}`
      : randomDecimal(300, 2000);
  const qmoveAmount =
    Math.random() > 0.75
      ? `-${randomDecimal(500, 2000)}`
      : randomDecimal(500, 2500);
  const juryAmount =
    Math.random() > 0.95
      ? `-${randomDecimal(200, 1000)}`
      : randomDecimal(200, 1200);

  const grossPay = (
    parseFloat(regularAmount) +
    parseFloat(otAmount) +
    parseFloat(ptoAmount) +
    parseFloat(holidayAmount) +
    parseFloat(bonusAmount.replace("-", "")) +
    parseFloat(floatAmount.replace("-", "")) +
    parseFloat(brvmtAmount.replace("-", "")) +
    parseFloat(retroAmount.replace("-", "")) +
    parseFloat(qmoveAmount.replace("-", "")) +
    parseFloat(juryAmount.replace("-", ""))
  ).toFixed(2);

  // Taxes
  const fitw = Math.max(
    0,
    (parseFloat(grossPay) * randomBetween(10, 25)) / 100
  ).toFixed(2);
  const med = Math.max(
    0,
    (parseFloat(grossPay) * randomBetween(1, 3)) / 100
  ).toFixed(2);
  const ss = Math.max(
    0,
    (parseFloat(grossPay) * randomBetween(5, 8)) / 100
  ).toFixed(2);
  const medhi = randomDecimal(0, 50);
  const va = randomDecimal(0, 30);
  const nc = randomDecimal(0, 20);

  // Deductions
  const k401 = randomDecimal(0, Math.max(0, parseFloat(grossPay) * 0.1));
  const std = randomDecimal(0, 50);
  const vlife = randomDecimal(0, 30);
  const vison = randomDecimal(0, 20);
  const dntl = randomDecimal(0, 40);
  const mdcl = randomDecimal(0, 60);
  const roth401 = randomDecimal(0, Math.max(0, parseFloat(grossPay) * 0.05));
  const dpptd = randomDecimal(0, 100);
  const dpptv = randomDecimal(0, 50);
  const hsa = randomDecimal(0, Math.max(0, parseFloat(grossPay) * 0.08));

  const totalDeductions = (
    parseFloat(fitw) +
    parseFloat(med) +
    parseFloat(ss) +
    parseFloat(medhi) +
    parseFloat(va) +
    parseFloat(nc) +
    parseFloat(k401) +
    parseFloat(std) +
    parseFloat(vlife) +
    parseFloat(vison) +
    parseFloat(dntl) +
    parseFloat(mdcl) +
    parseFloat(roth401) +
    parseFloat(dpptd) +
    parseFloat(dpptv) +
    parseFloat(hsa)
  ).toFixed(2);

  const netPay = Math.max(
    0,
    parseFloat(grossPay) - parseFloat(totalDeductions)
  ).toFixed(2);

  const formattedDate = checkDate
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "/");

  return `${
    177058 + sequence
  },,${location},,"${provider}",,${employeeId},,${checkNumber},,${formattedDate},,${netPay},,${regularHours},${regularAmount},${otHours},${otAmount},${ptoHours},${ptoAmount},${holidayHours},${holidayAmount},,${bonusAmount},,${floatAmount},,${brvmtAmount},,${retroAmount},,${qmoveAmount},,${juryAmount},,,${fitw},,${med},,${ss},,${medhi},,${va},,${nc},,${k401},,${std},,${vlife},,${vison},,${dntl},,${mdcl},,${roth401},,${dpptd},,${dpptv},,,,,,${hsa},,,,,,,,,,`;
}

// Generate payroll CSV data for a specific year
function generatePayrollCSV(year = 2022) {
  const header =
    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n,,,,,,,,,,,,,,,,Earnings,,,,,,,,,,,,,,,,,,,,,,Taxes,,,,,,,,,,,,Deductions,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n,,,,,,,,,,,,,,,,REG,,OT,,401ER,,PTO,,HOL,,BONUS,,FLOAT,,BRVMT,,RETRO,,QMOVE,,JURY,,FITW,,MED,,SS,,MEDHI,,VA,,NC,,401K,,STD,,VLIFE,,VISON,,DNTL,,MDCL,,4ROTH,,DPPTD,,DPPTV,,401L1,,GARN1,,401L2,,HSA,,CHLD1,,SLEVY,,REIMB\nCo,,Location,,Employee,,ID,,Process,,Chk Date,,Chk/Vchr,,Net,,Hrs,Amount,Hrs,Amount,Hrs,Amount,Hrs,Amount,Hrs,Amount,Hrs,Amount,Hrs,Amount,Hrs,Amount,Hrs,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount,,Amount\n";

  let rows = [];
  const payrollDates = generatePayrollDates(year);
  let sequence = 0;

  // Generate data for each provider
  for (const provider of providers) {
    const csvLocation = providerLocations[provider];

    // Skip inactive providers
    if (csvLocation === "Inactive") {
      continue;
    }

    const location = locationMapping[csvLocation];
    const employeeId = generateEmployeeId();

    // Generate payroll for each date
    for (const checkDate of payrollDates) {
      // Most providers have 1 check per date, some have 2
      const numChecks = randomBetween(1, 2);

      for (let checkSeq = 1; checkSeq <= numChecks; checkSeq++) {
        const checkNumber = generateCheckNumber(checkDate, checkSeq);
        const row = generatePayrollRow(
          provider,
          location,
          employeeId,
          checkDate,
          checkNumber,
          sequence
        );
        rows.push(row);
        sequence++;
      }
    }
  }

  // Sort by provider name, then date
  rows.sort((a, b) => {
    const aProvider = a.match(/"([^"]+)"/)[1];
    const bProvider = b.match(/"([^"]+)"/)[1];

    const providerCompare = aProvider.localeCompare(bProvider);
    if (providerCompare !== 0) return providerCompare;

    const aDate = a.split(",")[11];
    const bDate = b.split(",")[11];

    return aDate.localeCompare(bDate);
  });

  return header + rows.join("\n");
}

// Generate payroll data for all years (2022-2025)
const years = [2022, 2023, 2024, 2025];

// Generate data for each year
years.forEach((year) => {
  console.log(`Generating payroll data for ${year}...`);
  const csvData = generatePayrollCSV(year);
  const outputPath = path.join(
    __dirname,
    "data",
    year.toString(),
    "payroll.csv"
  );

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, csvData, "utf8");
  console.log(
    `✅ Generated ${year} payroll CSV with ${
      csvData.split("\n").length - 4
    } data rows`
  );
});

console.log("🎉 All payroll data generation complete!");
