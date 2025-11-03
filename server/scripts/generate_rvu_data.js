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

// Practice names mapped from CSV locations to RVU format
const locationMapping = {
  "Prince George": "VCFP-MAIN-CAMPUS",
  Ashlake: "VCFP-SCRIBES-ASHLAKE",
  Discovery: "VCFP-APC-DISCOVERY",
  Inactive: "INACTIVE",
};

// Months of a specific year
function getMonths(year = 2022) {
  return [
    `January_${year}`,
    `February_${year}`,
    `March_${year}`,
    `April_${year}`,
    `May_${year}`,
    `June_${year}`,
    `July_${year}`,
    `August_${year}`,
    `September_${year}`,
    `October_${year}`,
    `November_${year}`,
    `December_${year}`,
  ];
}

// Generate random number between min and max
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random decimal between min and max
function randomDecimal(min, max, decimals = 2) {
  return (Math.random() * (max - min) + min).toFixed(decimals);
}

// Format number with commas
function formatNumber(num) {
  return parseFloat(num).toLocaleString();
}

// Generate RVU row
function generateRVURow(provider, month, practice, isLastRow = false) {
  const units = randomBetween(500, 3500);
  const billedCharge = randomDecimal(50000, 150000);
  const workRVU = randomDecimal(200, 1000);
  const totalRVU = randomDecimal(300, 1500);

  const formattedBilledCharge = formatNumber(billedCharge);
  const formattedUnits = formatNumber(units);
  const formattedWorkRVU = formatNumber(workRVU);
  const formattedTotalRVU = formatNumber(totalRVU);

  if (isLastRow) {
    // Last row includes cumulative totals in the last columns
    const cumulativeBilledCharge = randomDecimal(800000, 1200000);
    const cumulativeUnits = randomBetween(20000, 40000);
    const cumulativeWorkRVU = randomDecimal(5000, 10000);
    const cumulativeTotalRVU = randomDecimal(8000, 15000);

    return `"${provider}",${month},None,None,${practice},"${formattedBilledCharge}","${formattedUnits}",${formattedWorkRVU},${formattedTotalRVU},"${formattedBilledCharge}","${formattedUnits}",${formattedWorkRVU},${formattedTotalRVU},"${formattedBilledCharge}","${formattedUnits}",${formattedWorkRVU},${formattedTotalRVU},"${formatNumber(
      cumulativeBilledCharge
    )}","${formatNumber(cumulativeUnits)}","${formatNumber(
      cumulativeWorkRVU
    )}","${formatNumber(cumulativeTotalRVU)}",,,,,,,,`;
  } else {
    // Regular rows
    return `"${provider}",${month},None,None,${practice},"${formattedBilledCharge}","${formattedUnits}",${formattedWorkRVU},${formattedTotalRVU},"${formattedBilledCharge}","${formattedUnits}",${formattedWorkRVU},${formattedTotalRVU},"${formattedBilledCharge}","${formattedUnits}",${formattedWorkRVU},${formattedTotalRVU},,,,,,,,`;
  }
}

// Generate RVU CSV data for a specific year
function generateRVUCSV(year = 2022) {
  const months = getMonths(year);
  const header =
    "Appointment / Servicing Provider,Month,None,None,Practice Name,Billed Charge,Units,Work RVU * Units,Transitioned Facility,Total(Billed Charge),Total(Units),Total(Work RVU),Total(Total RVU),Total(Billed Charge),Total(Units),Total(Work RVU),Total(Total RVU),Total(Billed Charge),Total(Units),Total(Work RVU),Total(Total RVU),Total(Billed Charge),Total(Units),Total(Work RVU),Total(Total RVU)\n";

  let rows = [];

  // Generate data for each provider
  for (const provider of providers) {
    const csvLocation = providerLocations[provider];

    // Skip inactive providers
    if (csvLocation === "Inactive") {
      continue;
    }

    const practice = locationMapping[csvLocation];

    // Generate data for each month
    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      const isLastRow = i === months.length - 1; // Last month gets cumulative totals
      rows.push(generateRVURow(provider, month, practice, isLastRow));
    }
  }

  // Sort by provider name, then month
  rows.sort((a, b) => {
    const aProvider = a.match(/"([^"]+)"/)[1];
    const bProvider = b.match(/"([^"]+)"/)[1];

    const providerCompare = aProvider.localeCompare(bProvider);
    if (providerCompare !== 0) return providerCompare;

    const aMonth = a.split(",")[1];
    const bMonth = b.split(",")[1];

    return aMonth.localeCompare(bMonth);
  });

  return header + rows.join("\n");
}

// Generate RVU data for all years (2022-2025)
const years = [2022, 2023, 2024, 2025];

// Generate data for each year
years.forEach((year) => {
  console.log(`Generating RVU data for ${year}...`);
  const csvData = generateRVUCSV(year);
  const outputPath = path.join(__dirname, "data", year.toString(), "rvu.csv");

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, csvData, "utf8");
  console.log(
    `✅ Generated ${year} RVU CSV with ${csvData.split("\n").length - 1} rows`
  );
});

console.log("🎉 All RVU data generation complete!");
