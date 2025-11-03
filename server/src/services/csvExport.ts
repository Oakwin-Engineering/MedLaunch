import * as fs from "fs";
import * as path from "path";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Helper function to escape CSV values
 * @param value - The value to escape
 * @returns Escaped CSV value
 */
function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Exports CPT codes data as CSV (similar to financial_analysis.csv)
 * One row per provider per CPT code per month
 */
function exportCPTCodesCSV(nodes: any[]): string {
  const headers = [
    "Provider",
    "Month",
    "CPT Code",
    "Label",
    "Units",
    "Coding %",
    "Location",
    "Type",
  ];

  let csvContent = headers.join(",") + "\n";

  for (const node of nodes) {
    if (node.type !== "provider") continue;

    const providerName = node.label || "";
    const location = node.parentId || "";
    const year = node.year || "";
    const cptCodes = node.data?.cptCodes || [];

    for (const cpt of cptCodes) {
      const values = cpt.values || [];

      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const units = values[monthIndex] || 0;

        // Only include rows with non-zero units
        if (units > 0) {
          const monthName = `${MONTH_NAMES[monthIndex]}_${year}`;

          const row = [
            escapeCsvValue(providerName),
            escapeCsvValue(monthName),
            escapeCsvValue(cpt.code || ""),
            escapeCsvValue(cpt.label || ""),
            escapeCsvValue(units.toString()),
            escapeCsvValue(cpt.coding || ""),
            escapeCsvValue(location),
            escapeCsvValue(node.type || ""),
          ];

          csvContent += row.join(",") + "\n";
        }
      }
    }
  }

  return csvContent;
}

/**
 * Exports financial metrics (charges, payments, adjustments) as CSV
 * One row per provider per month
 */
function exportFinancialMetricsCSV(nodes: any[]): string {
  const headers = [
    "Provider",
    "Month",
    "Charges",
    "Payments",
    "Payer Payment",
    "Patient Payment",
    "Adjustments",
    "Payment % of Charges",
    "Adjustment % of Charges",
    "Average Receipts per Patient",
    "Charge per Patient",
    "Location",
    "Type",
  ];

  let csvContent = headers.join(",") + "\n";

  for (const node of nodes) {
    if (node.type !== "provider") continue;

    const providerName = node.label || "";
    const location = node.parentId || "";
    const year = node.year || "";

    const charges = node.data?.charges?.values || [];
    const payments = node.data?.payments?.values || [];
    const payerPayment = node.data?.payerPayment?.values || [];
    const patientPayment = node.data?.patientPayment?.values || [];
    const adjustments = node.data?.adjustments?.values || [];
    const paymentPercent = node.data?.paymentPercentOfCharges?.values || [];
    const adjustmentPercent =
      node.data?.adjustmentPercentOfCharges?.values || [];
    const avgReceipts = node.data?.averageReceiptsPerPatient?.values || [];
    const chargePerPatient = node.data?.chargePerPatient?.values || [];

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const chargeVal = charges[monthIndex] || 0;
      const paymentVal = payments[monthIndex] || 0;

      // Only include rows with non-zero charges or payments
      if (chargeVal > 0 || paymentVal > 0) {
        const monthName = `${MONTH_NAMES[monthIndex]}_${year}`;

        const row = [
          escapeCsvValue(providerName),
          escapeCsvValue(monthName),
          escapeCsvValue((chargeVal || 0).toString()),
          escapeCsvValue((paymentVal || 0).toString()),
          escapeCsvValue((payerPayment[monthIndex] || 0).toString()),
          escapeCsvValue((patientPayment[monthIndex] || 0).toString()),
          escapeCsvValue((adjustments[monthIndex] || 0).toString()),
          escapeCsvValue((paymentPercent[monthIndex] || 0).toString()),
          escapeCsvValue((adjustmentPercent[monthIndex] || 0).toString()),
          escapeCsvValue((avgReceipts[monthIndex] || 0).toString()),
          escapeCsvValue((chargePerPatient[monthIndex] || 0).toString()),
          escapeCsvValue(location),
          escapeCsvValue(node.type || ""),
        ];

        csvContent += row.join(",") + "\n";
      }
    }
  }

  return csvContent;
}

/**
 * Exports payroll data as CSV
 * One row per provider per month
 */
function exportPayrollCSV(nodes: any[]): string {
  const headers = [
    "Provider",
    "Month",
    "Payroll",
    "Operating Profit",
    "Location",
    "Type",
  ];

  let csvContent = headers.join(",") + "\n";

  for (const node of nodes) {
    if (node.type !== "provider") continue;

    const providerName = node.label || "";
    const location = node.parentId || "";
    const year = node.year || "";

    const payroll = node.data?.payroll?.values || [];
    const operatingProfit = node.data?.operatingProfit?.values || [];

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const payrollVal = payroll[monthIndex] || 0;

      // Only include rows with non-zero payroll
      if (payrollVal > 0) {
        const monthName = `${MONTH_NAMES[monthIndex]}_${year}`;

        const row = [
          escapeCsvValue(providerName),
          escapeCsvValue(monthName),
          escapeCsvValue(payrollVal.toString()),
          escapeCsvValue((operatingProfit[monthIndex] || 0).toString()),
          escapeCsvValue(location),
          escapeCsvValue(node.type || ""),
        ];

        csvContent += row.join(",") + "\n";
      }
    }
  }

  return csvContent;
}

/**
 * Exports RVU data as CSV
 * One row per provider per month
 */
function exportRVUCSV(nodes: any[]): string {
  const headers = [
    "Provider",
    "Month",
    "Work RVU",
    "Total Visits",
    "RVU per Patient",
    "Location",
    "Type",
  ];

  let csvContent = headers.join(",") + "\n";

  for (const node of nodes) {
    if (node.type !== "provider") continue;

    const providerName = node.label || "";
    const location = node.parentId || "";
    const year = node.year || "";

    const rvus = node.data?.rvus?.values || [];
    const totalVisits = node.data?.totalVisits?.values || [];
    const rvuPerPatient = node.data?.rvuPerPatient?.values || [];

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const rvuVal = rvus[monthIndex] || 0;
      const visitsVal = totalVisits[monthIndex] || 0;

      // Only include rows with non-zero RVUs or visits
      if (rvuVal > 0 || visitsVal > 0) {
        const monthName = `${MONTH_NAMES[monthIndex]}_${year}`;

        const row = [
          escapeCsvValue(providerName),
          escapeCsvValue(monthName),
          escapeCsvValue(rvuVal.toString()),
          escapeCsvValue(visitsVal.toString()),
          escapeCsvValue((rvuPerPatient[monthIndex] || 0).toString()),
          escapeCsvValue(location),
          escapeCsvValue(node.type || ""),
        ];

        csvContent += row.join(",") + "\n";
      }
    }
  }

  return csvContent;
}

/**
 * Saves CSV files locally to the server
 * @param customerId - The customer ID
 * @param csvData - Object containing CSV strings
 */
async function saveCSVFilesLocally(
  customerId: string,
  csvData: {
    cptCodes: string;
    financial: string;
    payroll: string;
    rvu: string;
  }
): Promise<void> {
  try {
    const outputDir = path.join(__dirname, "..", "..", "exported_csvs");

    // Delete existing directory and recreate it
    if (fs.existsSync(outputDir)) {
      await fs.promises.rm(outputDir, { recursive: true, force: true });
    }

    // Create fresh output directory
    await fs.promises.mkdir(outputDir, { recursive: true });

    // Save each CSV file
    const files = [
      { name: `${customerId}_cpt_codes.csv`, content: csvData.cptCodes },
      { name: `${customerId}_financial.csv`, content: csvData.financial },
      { name: `${customerId}_payroll.csv`, content: csvData.payroll },
      { name: `${customerId}_rvu.csv`, content: csvData.rvu },
    ];

    for (const file of files) {
      const filePath = path.join(outputDir, file.name);
      await fs.promises.writeFile(filePath, file.content, "utf8");
    }
  } catch (error) {
    // Don't throw error here - API response should still work even if local save fails
  }
}

/**
 * Exports all customer data as multiple CSV files
 * @param customerId - The customer ID
 * @param nodes - Array of node data from Firebase
 * @returns Object with CSV strings for different data types
 */
export async function exportCustomerDataAsCSV(
  customerId: string,
  nodes: any[]
): Promise<{
  cptCodes: string;
  financial: string;
  payroll: string;
  rvu: string;
}> {
  try {
    // Generate separate CSV files
    const csvData = {
      cptCodes: exportCPTCodesCSV(nodes),
      financial: exportFinancialMetricsCSV(nodes),
      payroll: exportPayrollCSV(nodes),
      rvu: exportRVUCSV(nodes),
    };

    // Save CSV files locally
    // await saveCSVFilesLocally(customerId, csvData);

    return csvData;
  } catch (err) {
    throw new Error(`Failed to export customer data as CSV: ${err}`);
  }
}
