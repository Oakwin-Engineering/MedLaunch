import fs from "fs";
import csv from "csv-parser";
import { MONTHS, contains } from "../types/common";

export interface LocationMapping {
  state: string;
  division: string;
}

/**
 * Loads state-division mapping from CSV
 */
export async function loadStateDivisionMapping(
  path: string
): Promise<Record<string, LocationMapping>> {
  return new Promise((resolve, reject) => {
    const mapping: Record<string, LocationMapping> = {};

    fs.createReadStream(path)
      .pipe(csv())
      .on("data", (row: any) => {
        const state = row["State"] || row["state"];
        const division = row["Division"] || row["division"];
        const location = row["Location"] || row["location"];

        if (state && division && location) {
          mapping[location.trim()] = {
            state: state.trim(),
            division: division.trim(),
          };
        }
      })
      .on("end", () => resolve(mapping))
      .on("error", (err) => reject(err));
  });
}

/**
 * Generic CSV processing function for UHealth data
 */
async function processCSVUHealth(
  filePath: string,
  keyIdx: number,
  amountIdx: number
): Promise<Record<string, number>> {
  return new Promise((resolve, reject) => {
    const totals: Record<string, number> = {};

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: any) => {
        const values = Object.values(row) as string[];
        const key = values[keyIdx]?.trim();
        const amountStr = values[amountIdx]?.trim();

        if (!key || !amountStr) return;

        const amount = parseFloat(amountStr);
        if (isNaN(amount)) return;

        totals[key] = (totals[key] || 0) + amount;
      })
      .on("end", () => resolve(totals))
      .on("error", (err) => reject(err));
  });
}

/**
 * Processes charges by clinic for UHealth
 */
export async function processChargesByClinicUHealth(
  filePath: string
): Promise<Record<string, number>> {
  return processCSVUHealth(filePath, 0, 2); // facility_name at index 0, insurance_billed_amount at index 2
}

/**
 * Processes charges by provider for UHealth
 */
export async function processChargesByProviderUHealth(
  filePath: string
): Promise<Record<string, number>> {
  return processCSVUHealth(filePath, 0, 4); // provider_name at index 0, insurance_billed_amount at index 4
}

/**
 * Processes collections by facility for UHealth
 */
export async function processCollectionsByFacilityUHealth(
  filePath: string
): Promise<Record<string, number>> {
  return processCSVUHealth(filePath, 0, 3); // facility_name at index 0, total_payments at index 3
}

/**
 * Processes collections by provider for UHealth
 */
export async function processCollectionsByProviderUHealth(
  filePath: string
): Promise<Record<string, number>> {
  return processCSVUHealth(filePath, 0, 3); // provider_name at index 0, total_payments at index 3
}

/**
 * Processes visits by clinic for UHealth
 */
export async function processVisitsByClinicUHealth(
  filePath: string
): Promise<Record<string, number>> {
  return processCSVUHealth(filePath, 0, 3); // facility_name at index 0, encounters_billed at index 3
}

/**
 * Processes visits by provider for UHealth
 */
export async function processVisitsByProviderUHealth(
  filePath: string
): Promise<Record<string, number>> {
  return processCSVUHealth(filePath, 0, 1); // provider_name at index 0, encounters_billed at index 1
}

/**
 * Processes provider-code relationships for UHealth
 */
export async function processProviderCodeRelationshipsUHealth(
  filePath: string
): Promise<Record<string, Record<string, number>>> {
  return new Promise((resolve, reject) => {
    const providerCodes: Record<string, Record<string, number>> = {};

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: any) => {
        const values = Object.values(row) as string[];
        const code = values[0]?.trim();
        const provider = values[1]?.trim();
        const encountersBilled = parseInt(values[2]?.trim(), 10);

        if (!code || !provider || isNaN(encountersBilled)) return;

        if (!providerCodes[provider]) {
          providerCodes[provider] = {};
        }

        providerCodes[provider][code] = encountersBilled;
      })
      .on("end", () => resolve(providerCodes))
      .on("error", (err) => reject(err));
  });
}

/**
 * Processes provider-facility relationships for UHealth
 */
export function processProviderFacilityRelationshipsUHealth(
  filePath: string
): Promise<{
  facilityProviders: Record<string, Record<string, boolean>>;
  providerFacilities: Record<string, string[]>;
}> {
  return new Promise((resolve, reject) => {
    const facilityIndex = 7;
    const providerIndex = 5;

    const facilityProviders: Record<string, Record<string, boolean>> = {};
    const providerFacilities: Record<string, string[]> = {};

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: any) => {
        const values = Object.values(row) as string[];
        const facility = values[facilityIndex]?.trim();
        const provider = values[providerIndex]?.trim();

        if (!facility || !provider) return;

        if (!facilityProviders[facility]) {
          facilityProviders[facility] = {};
        }
        facilityProviders[facility][provider] = true;

        if (!providerFacilities[provider]) {
          providerFacilities[provider] = [];
        }
        if (!contains(providerFacilities[provider], facility)) {
          providerFacilities[provider].push(facility);
        }
      })
      .on("end", () => resolve({ facilityProviders, providerFacilities }))
      .on("error", (err) => reject(err));
  });
}

/**
 * Processes ADP payroll data for UHealth
 */
export async function processADPProviderPayrollMonthlyUHealth(
  filePath: string
): Promise<{
  data: Record<string, Record<string, number>>;
  uniqueProviders: string[];
}> {
  return new Promise((resolve, reject) => {
    const monthlyData: Record<string, Record<string, number>> = {};
    const providerSet = new Set<string>();

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: any) => {
        const values = Object.values(row) as string[];
        const name = values[0]?.replace(/"/g, "").trim();
        const payDate = values[5];
        let grossPay = values[6];

        if (!name || !payDate || !grossPay) return;

        const date = new Date(payDate);
        if (isNaN(date.getTime())) return;

        const month = MONTHS[date.getMonth()];

        grossPay = grossPay.replace(/"/g, "").replace(/,/g, "");
        const payAmount = parseFloat(grossPay);
        if (isNaN(payAmount)) return;

        if (!monthlyData[month]) {
          monthlyData[month] = {};
        }

        monthlyData[month][name] = (monthlyData[month][name] || 0) + payAmount;
        providerSet.add(name);
      })
      .on("end", () => {
        const uniqueProviders = Array.from(providerSet).map((p) => p.trim());
        resolve({ data: monthlyData, uniqueProviders });
      })
      .on("error", (err) => reject(err));
  });
}
