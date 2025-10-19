import fs from "fs";
import csv from "csv-parser";
import { MONTHS } from "../types/common";

/**
 * Processes financial data from CSV for VitalCare
 */
export async function processFinancialDataVitalCare(
  filePath: string,
  amountIdx: number
): Promise<Record<string, Record<string, number>>> {
  return new Promise((resolve, reject) => {
    const data: Record<string, Record<string, number>> = {};

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: any) => {
        const values = Object.values(row) as string[];
        const providerName = values[0]?.trim();
        const dateStr = values[1];
        const amountStr = values[amountIdx];

        if (!dateStr) return;

        const parts = dateStr.split("_");
        if (parts.length !== 2) return;
        const month = parts[0].toLowerCase();

        const floatAmount = parseFloat(amountStr);
        if (isNaN(floatAmount)) {
          console.log(`Could not parse amount: ${amountStr}`);
          return;
        }
        const amount = Math.floor(floatAmount);

        if (!data[month]) {
          data[month] = {};
        }

        data[month][providerName] = (data[month][providerName] || 0) + amount;
      })
      .on("end", () => resolve(data))
      .on("error", (err) => reject(err));
  });
}

/**
 * Processes financial analysis data for VitalCare
 */
export async function processFinancialAnalysisVitalCare(
  filePath: string,
  amountIdx: number
): Promise<Record<string, Record<string, Record<string, number>>>> {
  return new Promise((resolve, reject) => {
    const data: Record<string, Record<string, Record<string, number>>> = {};

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: any) => {
        const values = Object.values(row) as string[];
        const providerName = values[0]?.trim();
        const monthStr = values[1]?.trim();
        const cptCode = values[2]?.trim();
        const amountStr = values[amountIdx];

        if (!monthStr) return;

        const parts = monthStr.split("_");
        if (parts.length !== 2) return;
        const month = parts[0].toLowerCase();

        const amount = parseFloat(amountStr?.trim());
        if (isNaN(amount)) return;

        if (!data[month]) {
          data[month] = {};
        }
        if (!data[month][cptCode]) {
          data[month][cptCode] = {};
        }

        data[month][cptCode][providerName] =
          (data[month][cptCode][providerName] || 0) + amount;
      })
      .on("end", () => resolve(data))
      .on("error", (err) => reject(err));
  });
}

/**
 * Processes RVU data for VitalCare
 */
export async function processRVUsVitalCare(
  filePath: string
): Promise<Record<string, Record<string, number>>> {
  return processFinancialDataVitalCare(filePath, 7);
}

/**
 * Processes total visits data for VitalCare
 */
export async function processTotalVisitsVitalCare(
  filePath: string
): Promise<Record<string, Record<string, number>>> {
  return processFinancialDataVitalCare(filePath, 6);
}

/**
 * Processes monthly patient count
 */
export async function processMonthlyPatientCount(
  filePath: string
): Promise<Record<string, Record<string, number>>> {
  return processFinancialDataVitalCare(filePath, 16);
}

/**
 * Processes charges data for VitalCare
 */
export async function processChargesVitalCare(
  filePath: string
): Promise<Record<string, Record<string, Record<string, number>>>> {
  return processFinancialAnalysisVitalCare(filePath, 4);
}

/**
 * Processes payments data for VitalCare
 */
export async function processPaymentsVitalCare(
  filePath: string
): Promise<Record<string, Record<string, Record<string, number>>>> {
  return processFinancialAnalysisVitalCare(filePath, 7);
}

/**
 * Processes contractual adjustments for VitalCare
 */
export async function processContractualAdjustmentsVitalCare(
  filePath: string
): Promise<Record<string, Record<string, Record<string, number>>>> {
  return processFinancialAnalysisVitalCare(filePath, 11);
}

/**
 * Processes units data for VitalCare
 */
export async function processUnitsVitalCare(
  filePath: string
): Promise<Record<string, Record<string, Record<string, number>>>> {
  return processFinancialAnalysisVitalCare(filePath, 17);
}

/**
 * Processes payer payment data for VitalCare
 */
export async function processPayerPaymentVitalCare(
  filePath: string
): Promise<Record<string, Record<string, number>>> {
  return processFinancialDataVitalCare(filePath, 9);
}

/**
 * Processes patient payment data for VitalCare
 */
export async function processPatientPaymentVitalCare(
  filePath: string
): Promise<Record<string, Record<string, number>>> {
  return processFinancialDataVitalCare(filePath, 10);
}

/**
 * Processes payroll data for VitalCare
 */
export async function processPayrollVitalCare(filePath: string): Promise<{
  data: Record<string, Record<string, number>>;
  uniqueEmployees: string[];
}> {
  return new Promise((resolve, reject) => {
    const data: Record<string, Record<string, number>> = {};
    const employeeSet = new Set<string>();
    let currentEmployee = "";
    let skipCount = 0;

    fs.createReadStream(filePath)
      .pipe(csv({ headers: false }))
      .on("data", (row: any) => {
        // Skip first 4 header rows
        if (skipCount < 4) {
          skipCount++;
          return;
        }

        const values = Object.values(row) as string[];

        if (values.length < 15) return;

        // Check if this is a new employee row
        if (values[4]?.trim()) {
          currentEmployee = values[4].trim().replace(/"/g, "");
          employeeSet.add(currentEmployee);
        }

        if (!currentEmployee) return;

        const dateStr = values[10]?.trim();
        const netPayStr = values[14]?.trim();

        if (!dateStr || !netPayStr) return;

        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) {
          console.log(`Could not parse date: ${dateStr}`);
          return;
        }
        const month = MONTHS[parsedDate.getMonth()];

        const netPay = parseFloat(netPayStr);
        if (isNaN(netPay)) {
          console.log(`Could not parse net pay: ${netPayStr}`);
          return;
        }

        if (!data[month]) {
          data[month] = {};
        }

        data[month][currentEmployee] =
          (data[month][currentEmployee] || 0) + netPay;
      })
      .on("end", () => {
        const uniqueEmployees = Array.from(employeeSet).map((e) => e.trim());
        resolve({ data, uniqueEmployees });
      })
      .on("error", (err) => reject(err));
  });
}

/**
 * Gets unique CPT codes from financial analysis file
 */
export async function getUniqueCPTCodesVitalCare(
  filePath: string
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const cptCodeSet = new Set<string>();

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: any) => {
        const values = Object.values(row) as string[];
        const cptCode = values[2];
        if (cptCode) {
          cptCodeSet.add(cptCode);
        }
      })
      .on("end", () => resolve(Array.from(cptCodeSet)))
      .on("error", (err) => reject(err));
  });
}

/**
 * Processes provider-location relationships for VitalCare
 */
export async function processProviderLocationRelationshipVitalCare(
  filePath: string
): Promise<{
  locationProviderMap: Record<string, string[]>;
  uniqueProviders: string[];
}> {
  return new Promise((resolve, reject) => {
    const locationProviderRelationships: Record<string, string[]> = {};
    const providerSet = new Set<string>();

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: any) => {
        const providerName = row["Full Name"]?.trim();
        const locationName = row["Location"]?.trim();

        if (!providerName || !locationName) return;

        if (!locationProviderRelationships[locationName]) {
          locationProviderRelationships[locationName] = [];
        }
        locationProviderRelationships[locationName].push(providerName);
        providerSet.add(providerName);
      })
      .on("end", () => {
        const uniqueProviders = Array.from(providerSet).map((p) => p.trim());
        resolve({
          locationProviderMap: locationProviderRelationships,
          uniqueProviders,
        });
      })
      .on("error", (err) => reject(err));
  });
}

/**
 * Processes accounts receivable CSV file
 */
export async function processAccountsReceivable(
  filePath: string
): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    const result: Record<string, any> = {};
    const columnsToKeep = new Set([
      "0-30 Days",
      "31-60 Days",
      "61-90 Days",
      "91-120 Days",
      "121 - 150 Days",
      "151 - 180 Days",
      "> 180 Days",
      "Total Balance",
      "Total Balance %",
    ]);

    let header: string[] = [];
    let columnIndices: Record<string, number> = {};
    const overallSums: Record<string, number> = {};
    let isFirstRow = true;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: any) => {
        if (isFirstRow) {
          header = Object.keys(row);
          header.forEach((col, idx) => {
            const colName = col.trim();
            if (columnsToKeep.has(colName)) {
              columnIndices[colName] = idx;
            }
          });
          isFirstRow = false;
        }

        const balanceType = Object.values(row)[0] as string;
        if (!balanceType?.trim()) return;

        const balanceData: Record<string, string> = {};
        for (const [colName, idx] of Object.entries(columnIndices)) {
          const value = Object.values(row)[idx] as string;
          if (value?.trim()) {
            balanceData[colName] = value.trim();

            // Parse and sum for Overall row (skip percentages)
            if (colName !== "Total Balance %") {
              const cleanValue = value.replace(/,/g, "");
              const floatVal = parseFloat(cleanValue);
              if (!isNaN(floatVal)) {
                overallSums[colName] = (overallSums[colName] || 0) + floatVal;
              }
            }
          }
        }

        result[balanceType.trim()] = balanceData;
      })
      .on("end", () => {
        // Add "Overall - Sum" row
        const overallData: Record<string, string> = {};
        let totalBalance = 0;

        for (const [colName, sum] of Object.entries(overallSums)) {
          if (colName === "Total Balance") {
            totalBalance = sum;
          }
          overallData[colName] = sum.toFixed(2);
        }

        overallData["Total Balance %"] = "100%";
        result["Overall - Sum"] = overallData;

        // Add "% Subtotal" row
        const subtotalData: Record<string, string> = {};
        if (totalBalance > 0) {
          for (const [colName, sum] of Object.entries(overallSums)) {
            if (colName !== "Total Balance") {
              const percentage = (sum / totalBalance) * 100;
              subtotalData[colName] = `${percentage.toFixed(0)}%`;
            }
          }
        }
        subtotalData["Total Balance"] = "";
        subtotalData["Total Balance %"] = "100%";
        result["% Subtotal"] = subtotalData;

        resolve(result);
      })
      .on("error", (err) => reject(err));
  });
}
