import fs from "fs";
import csv from "csv-parser";
import { MONTHS, contains } from "../types/common";

export type LocationMapping = {
  state: string;
  division: string;
};

/**
 * Loads state-division mapping from CSV
 */
export async function loadStateDivisionMapping(
  path: string
): Promise<Record<string, LocationMapping>> {
  return new Promise((resolve, reject) => {
    const mapping: Record<string, LocationMapping> = {};

    fs.createReadStream(path)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim()
      }))
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
  keyHeader: string,
  amountHeader: string
): Promise<Record<string, number>> {
  return new Promise((resolve, reject) => {
    const totals: Record<string, number> = {};

    fs.createReadStream(filePath)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim()
      }))
      .on("data", (row: any) => {
        const key = row[keyHeader]?.trim();
        const amountStr = row[amountHeader]?.trim();

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
  return processCSVUHealth(filePath, "facility_name", "insurance_billed_amount");
}

/**
 * Processes charges by provider for UHealth
 */
export async function processChargesByProviderUHealth(
  filePath: string
): Promise<Record<string, number>> {
  return processCSVUHealth(filePath, "provider_name", "insurance_billed_amount");
}

/**
 * Processes collections by facility for UHealth
 */
export async function processCollectionsByFacilityUHealth(
  filePath: string
): Promise<Record<string, number>> {
  return processCSVUHealth(filePath, "facility_name", "total_payments");
}

/**
 * Processes collections by provider for UHealth
 */
export async function processCollectionsByProviderUHealth(
  filePath: string
): Promise<Record<string, number>> {
  return processCSVUHealth(filePath, "provider_name", "total_payments");
}

/**
 * Processes visits by clinic for UHealth
 */
export async function processVisitsByClinicUHealth(
  filePath: string
): Promise<Record<string, number>> {
  return processCSVUHealth(filePath, "facility_name", "encounters_billed");
}

/**
 * Processes visits by provider for UHealth
 */
export async function processVisitsByProviderUHealth(
  filePath: string
): Promise<Record<string, number>> {
  return processCSVUHealth(filePath, "provider_name", "encounters_billed");
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
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim()
      }))
      .on("data", (row: any) => {
        const code = row["code"]?.trim();
        const provider = row["provider_name"]?.trim();
        const encountersBilledStr = row["encounters_billed"]?.trim();

        if (!code || !provider || !encountersBilledStr) return;

        const encountersBilled = parseInt(encountersBilledStr, 10);
        if (isNaN(encountersBilled)) return;

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
    const facilityProviders: Record<string, Record<string, boolean>> = {};
    const providerFacilities: Record<string, string[]> = {};

    fs.createReadStream(filePath)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim()
      }))
      .on("data", (row: any) => {
        const facility = row["facility_name"]?.trim();
        const provider = row["rendering_provider_name"]?.trim();

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
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim()
      }))
      .on("data", (row: any) => {
        const name = row["NAME"]?.replace(/"/g, "").trim();
        const payDate = row["PAY DATE"];
        let grossPay = row["GROSS PAY"];

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
