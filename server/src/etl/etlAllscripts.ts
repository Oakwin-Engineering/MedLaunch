import fs from "fs";
import csv from "csv-parser";

/**
 * Revenue record structure from AllScripts CSV
 */
export interface RevenueRecord {
  chargeid: string;
  rendfirst: string;
  rendlast: string;
  locationname: string;
  basefee: number;
  createdate: string; // YYYYMMDD format
  procid: string; // CPT code
  PatEncounterNumber: string;
  workrvu: number;
}

/**
 * Payment record structure from AllScripts CSV
 */
export interface PaymentRecord {
  chargeid: string;
  amount: number;
  createdate: string; // YYYYMMDD format
}

/**
 * Parses date from YYYYMMDD format to month index (0-11)
 */
export function parseDateToMonthIndex(dateStr: string): number | null {
  if (!dateStr || dateStr.length !== 8) return null;
  
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10);
  const day = parseInt(dateStr.substring(6, 8), 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (month < 1 || month > 12) return null;
  
  return month - 1; // Convert to 0-indexed
}

/**
 * Extracts year from YYYYMMDD format
 */
export function parseDateToYear(dateStr: string): string | null {
  if (!dateStr || dateStr.length !== 8) return null;
  
  const year = dateStr.substring(0, 4);
  
  // Validate that it's a reasonable year
  const yearNum = parseInt(year, 10);
  if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2030) return null;
  
  return year;
}

/**
 * Gets unique years from revenue records
 */
export function extractYearsFromRevenue(records: RevenueRecord[]): string[] {
  const years = new Set<string>();
  
  for (const record of records) {
    const year = parseDateToYear(record.createdate);
    if (year) {
      years.add(year);
    }
  }
  
  return Array.from(years).sort();
}

/**
 * Processes AllScripts revenue CSV file
 */
export async function processAllScriptsRevenue(
  filePath: string
): Promise<RevenueRecord[]> {
  return new Promise((resolve, reject) => {
    const records: RevenueRecord[] = [];

    fs.createReadStream(filePath)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim()
      }))
      .on("data", (row: any) => {
        const chargeid = row["chargeid"]?.trim();
        const rendfirst = row["rendfirst"]?.trim();
        const rendlast = row["rendlast"]?.trim();
        const locationname = row["locationname"]?.trim();
        const basefeeStr = row["basefee"]?.trim();
        const createdate = row["createdate"]?.trim();
        const procid = row["procid"]?.trim();
        const PatEncounterNumber = row["PatEncounterNumber"]?.trim();
        const workrvuStr = row["workrvu"]?.trim();

        if (!chargeid || !rendfirst || !rendlast || !locationname || !basefeeStr || !createdate) {
          return;
        }

        const basefee = parseFloat(basefeeStr);
        if (isNaN(basefee)) return;

        const workrvu = workrvuStr ? parseFloat(workrvuStr) : 0;

        records.push({
          chargeid,
          rendfirst,
          rendlast,
          locationname,
          basefee,
          createdate,
          procid: procid || "",
          PatEncounterNumber: PatEncounterNumber || "",
          workrvu: isNaN(workrvu) ? 0 : workrvu,
        });
      })
      .on("end", () => resolve(records))
      .on("error", (err) => reject(err));
  });
}

/**
 * Processes AllScripts payments CSV file
 */
export async function processAllScriptsPayments(
  filePath: string
): Promise<Map<string, number>> {
  return new Promise((resolve, reject) => {
    const payments = new Map<string, number>();

    fs.createReadStream(filePath)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim()
      }))
      .on("data", (row: any) => {
        const chargeid = row["chargeid"]?.trim();
        const amountStr = row["amount"]?.trim();

        if (!chargeid || !amountStr) return;

        const amount = parseFloat(amountStr);
        if (isNaN(amount)) return;

        // Aggregate payments by chargeid (in case there are multiple payments per charge)
        const currentAmount = payments.get(chargeid) || 0;
        payments.set(chargeid, currentAmount + amount);
      })
      .on("end", () => resolve(payments))
      .on("error", (err) => reject(err));
  });
}

/**
 * Aggregated data structure for AllScripts processing
 */
export interface AllScriptsAggregatedData {
  // Monthly aggregations by location and provider
  locationChargesByMonth: Record<string, number[]>; // location -> [12 months]
  locationPaymentsByMonth: Record<string, number[]>;
  locationVisitsByMonth: Record<string, number[]>;
  locationRvusByMonth: Record<string, number[]>;
  
  providerChargesByMonth: Record<string, number[]>; // provider -> [12 months]
  providerPaymentsByMonth: Record<string, number[]>;
  providerVisitsByMonth: Record<string, number[]>;
  providerRvusByMonth: Record<string, number[]>;
  providerCptCodesByMonth: Record<string, Record<string, number[]>>; // provider -> cptCode -> [12 months]
  
  // Relationships
  locationProviders: Record<string, Set<string>>; // location -> Set of providers
  providerLocations: Record<string, string[]>; // provider -> locations
}

/**
 * Processes both AllScripts CSV files and creates aggregated data structure
 */
export async function processAllScriptsData(
  revenuePath: string,
  paymentsPath: string,
  year?: string
): Promise<AllScriptsAggregatedData> {
  console.log("Loading AllScripts revenue data...");
  const allRevenueRecords = await processAllScriptsRevenue(revenuePath);
  
  console.log("Loading AllScripts payments data...");
  const paymentsMap = await processAllScriptsPayments(paymentsPath);
  
  // Filter revenue records by year if specified
  let revenueRecords = allRevenueRecords;
  if (year) {
    revenueRecords = allRevenueRecords.filter(record => {
      const recordYear = parseDateToYear(record.createdate);
      return recordYear === year;
    });
    console.log(`Filtered to ${revenueRecords.length} revenue records for year ${year}`);
  } else {
    const availableYears = extractYearsFromRevenue(allRevenueRecords);
    console.log(`Available years: ${availableYears.join(', ')}`);
  }
  
  console.log(`Processed ${revenueRecords.length} revenue records and ${paymentsMap.size} payment records`);

  const data: AllScriptsAggregatedData = {
    locationChargesByMonth: {},
    locationPaymentsByMonth: {},
    locationVisitsByMonth: {},
    locationRvusByMonth: {},
    providerChargesByMonth: {},
    providerPaymentsByMonth: {},
    providerVisitsByMonth: {},
    providerRvusByMonth: {},
    providerCptCodesByMonth: {},
    locationProviders: {},
    providerLocations: {},
  };

  // Track unique encounters per provider/location per month for visit counting
  const providerEncountersByMonth: Record<string, Record<number, Set<string>>> = {};
  const locationEncountersByMonth: Record<string, Record<number, Set<string>>> = {};

  for (const record of revenueRecords) {
    const provider = `${record.rendfirst} ${record.rendlast}`;
    const location = record.locationname;
    const monthIndex = parseDateToMonthIndex(record.createdate);

    if (monthIndex === null) continue;

    // Initialize arrays if needed
    if (!data.locationChargesByMonth[location]) {
      data.locationChargesByMonth[location] = new Array(12).fill(0);
      data.locationPaymentsByMonth[location] = new Array(12).fill(0);
      data.locationVisitsByMonth[location] = new Array(12).fill(0);
      data.locationRvusByMonth[location] = new Array(12).fill(0);
      data.locationProviders[location] = new Set();
    }

    if (!data.providerChargesByMonth[provider]) {
      data.providerChargesByMonth[provider] = new Array(12).fill(0);
      data.providerPaymentsByMonth[provider] = new Array(12).fill(0);
      data.providerVisitsByMonth[provider] = new Array(12).fill(0);
      data.providerRvusByMonth[provider] = new Array(12).fill(0);
      data.providerCptCodesByMonth[provider] = {};
      data.providerLocations[provider] = [];
    }

    // Initialize encounter tracking
    if (!providerEncountersByMonth[provider]) {
      providerEncountersByMonth[provider] = {};
    }
    if (!providerEncountersByMonth[provider][monthIndex]) {
      providerEncountersByMonth[provider][monthIndex] = new Set();
    }

    if (!locationEncountersByMonth[location]) {
      locationEncountersByMonth[location] = {};
    }
    if (!locationEncountersByMonth[location][monthIndex]) {
      locationEncountersByMonth[location][monthIndex] = new Set();
    }

    // Track relationships
    data.locationProviders[location].add(provider);
    if (!data.providerLocations[provider].includes(location)) {
      data.providerLocations[provider].push(location);
    }

    // Aggregate charges
    data.locationChargesByMonth[location][monthIndex] += record.basefee;
    data.providerChargesByMonth[provider][monthIndex] += record.basefee;

    // Aggregate payments (join with payments data)
    const payment = paymentsMap.get(record.chargeid) || 0;
    data.locationPaymentsByMonth[location][monthIndex] += payment;
    data.providerPaymentsByMonth[provider][monthIndex] += payment;

    // Aggregate RVUs
    data.locationRvusByMonth[location][monthIndex] += record.workrvu;
    data.providerRvusByMonth[provider][monthIndex] += record.workrvu;

    // Track unique encounters for visit counting
    if (record.PatEncounterNumber) {
      providerEncountersByMonth[provider][monthIndex].add(record.PatEncounterNumber);
      locationEncountersByMonth[location][monthIndex].add(record.PatEncounterNumber);
    }

    // Aggregate CPT codes
    if (record.procid) {
      if (!data.providerCptCodesByMonth[provider][record.procid]) {
        data.providerCptCodesByMonth[provider][record.procid] = new Array(12).fill(0);
      }
      data.providerCptCodesByMonth[provider][record.procid][monthIndex] += 1;
    }
  }

  // Convert encounter sets to visit counts
  for (const [provider, monthMap] of Object.entries(providerEncountersByMonth)) {
    for (const [monthIndex, encounters] of Object.entries(monthMap)) {
      data.providerVisitsByMonth[provider][parseInt(monthIndex)] = encounters.size;
    }
  }

  for (const [location, monthMap] of Object.entries(locationEncountersByMonth)) {
    for (const [monthIndex, encounters] of Object.entries(monthMap)) {
      data.locationVisitsByMonth[location][parseInt(monthIndex)] = encounters.size;
    }
  }

  console.log(`Aggregated data for ${Object.keys(data.locationProviders).length} locations and ${Object.keys(data.providerChargesByMonth).length} providers`);

  return data;
}
