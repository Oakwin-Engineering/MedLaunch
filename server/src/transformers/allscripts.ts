import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import csv from "csv-parser";
import {
  Node,
  NodeData,
  Metric,
  CptCodeMetric,
  slugify,
  createMetric,
  sum,
  divideArrays,
  percentageArrays,
  percentageValue,
  sumOrAverage,
  formatPercentage,
} from "../types/common";
import {
  processAllScriptsData,
  AllScriptsAggregatedData,
  extractYearsFromRevenue,
  processAllScriptsRevenue,
} from "../etl/etlAllscripts";
import { storeAllScriptsDashboardData } from "../services/firebase";

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

interface LocationMapping {
  Location: string;
  State: string;
}

// Same CPT code mapping as uHealth
const CPT_CODE_MAPPING_ALLSCRIPTS: Record<string, string> = {
  "99304": "Initial Visits",
  "99305": "Initial Visits",
  "99306": "Initial Visits",
  "99307": "Subsequent Visits",
  "99308": "Subsequent Visits",
  "99309": "Subsequent Visits",
  "99310": "Subsequent Visits",
  "99315": "Discharge",
  "99316": "Discharge",
};

const CPT_CATEGORIES_ALLSCRIPTS: Record<string, string> = {
  "Initial Visits": "InitialVisitsTotal",
  "Subsequent Visits": "SubsequentVisitsTotal",
  Discharge: "DischargeTotal",
  "CPT Coding": "CPTCodingTotal",
};

class AllScriptsMetricBuilder {
  charges: number[] = new Array(12).fill(0);
  payments: number[] = new Array(12).fill(0);
  visits: number[] = new Array(12).fill(0);
  rvus: number[] = new Array(12).fill(0);
  codes: Record<string, number[]> = {};

  aggregate(other: AllScriptsMetricBuilder): void {
    for (let i = 0; i < 12; i++) {
      this.charges[i] += other.charges[i];
      this.payments[i] += other.payments[i];
      this.visits[i] += other.visits[i];
      this.rvus[i] += other.rvus[i];
    }

    for (const [code, values] of Object.entries(other.codes)) {
      if (!this.codes[code]) {
        this.codes[code] = new Array(12).fill(0);
      }
      for (let i = 0; i < 12; i++) {
        this.codes[code][i] += values[i];
      }
    }
  }

  buildNodeData(): NodeData {
    const chargesTotal = sum(this.charges);
    const paymentsTotal = sum(this.payments);
    const rvusTotal = sum(this.rvus);

    const { cptMetrics, categoryTotals, totalVisits } = this.buildCPTMetrics();
    const visitsTotal = sum(totalVisits);

    const chargePerPatient = divideArrays(this.charges, totalVisits);
    const paymentPercentOfCharges = percentageArrays(
      this.payments,
      this.charges
    );
    const averageReceiptsPerPatient = divideArrays(this.payments, totalVisits);
    const rvuPerPatient = divideArrays(this.rvus, totalVisits);

    return {
      cptCodes: cptMetrics,
      cptCodingTotal: categoryTotals.CPTCodingTotal,
      initialVisitsTotal: categoryTotals.InitialVisitsTotal,
      subsequentVisitsTotal: categoryTotals.SubsequentVisitsTotal,
      dischargeTotal: categoryTotals.DischargeTotal,
      totalVisits: createMetric("Total Visits", totalVisits, visitsTotal),
      charges: createMetric("Charges", this.charges, chargesTotal),
      payments: createMetric("Payments", this.payments, paymentsTotal),
      payroll: createMetric("Payroll", [], 0), // Not available for AllScripts
      operatingProfit: createMetric("Operating Profit", [], 0), // Not available
      chargePerPatient: createMetric(
        "Charges per Patient",
        chargePerPatient,
        sumOrAverage(visitsTotal, chargesTotal)
      ),
      paymentPercentOfCharges: createMetric(
        "Payment % of Charges",
        paymentPercentOfCharges,
        percentageValue(paymentsTotal, chargesTotal)
      ),
      averageReceiptsPerPatient: createMetric(
        "Average Receipts per Patient",
        averageReceiptsPerPatient,
        sumOrAverage(visitsTotal, paymentsTotal)
      ),
      rvuPerPatient: createMetric(
        "RVUs per Patient",
        rvuPerPatient,
        sumOrAverage(visitsTotal, rvusTotal)
      ),
      adjustments: createMetric("Adjustments", [], 0),
      adjustmentPercentOfCharges: createMetric(
        "Adjustments % of Charges",
        [],
        0
      ),
      rvus: createMetric("RVUs", this.rvus, rvusTotal),
      patientCountTotal: createMetric("Total", [], 0),
      npWellnessVisitTotal: createMetric("Total", [], 0),
      medicareAnnualWellnessTotal: createMetric("Total", [], 0),
      followUpPatientTotal: createMetric("Total", [], 0),
    };
  }

  buildCPTMetrics(): {
    cptMetrics: CptCodeMetric[];
    categoryTotals: Record<string, Metric>;
    totalVisits: number[];
  } {
    const metrics: CptCodeMetric[] = [];
    const categoryValues: Record<string, number[]> = {};
    const totalVisitsByMonth = new Array(12).fill(0);

    for (const category of Object.values(CPT_CATEGORIES_ALLSCRIPTS)) {
      categoryValues[category] = new Array(12).fill(0);
    }

    // First pass: calculate category values and totals
    const categoryTotalSums: Record<string, number> = {};
    for (const category of Object.values(CPT_CATEGORIES_ALLSCRIPTS)) {
      categoryTotalSums[category] = 0;
    }

    for (const [code, values] of Object.entries(this.codes)) {
      const codeTotal = sum(values);

      const label = CPT_CODE_MAPPING_ALLSCRIPTS[code] || "CPT Coding";
      const category = CPT_CATEGORIES_ALLSCRIPTS[label];

      if (category) {
        for (let i = 0; i < 12; i++) {
          categoryValues[category][i] += values[i];
        }
        categoryTotalSums[category] += codeTotal;

        // Only add to totalVisitsByMonth if it's NOT "CPT Coding"
        if (label !== "CPT Coding") {
          for (let i = 0; i < 12; i++) {
            totalVisitsByMonth[i] += values[i];
          }
        }
      }
    }

    // Second pass: create metrics with category-specific percentages
    for (const [code, values] of Object.entries(this.codes)) {
      const codeTotal = sum(values);

      const label = CPT_CODE_MAPPING_ALLSCRIPTS[code] || "CPT Coding";
      const category = CPT_CATEGORIES_ALLSCRIPTS[label];

      // Calculate percentage within the category
      const categoryTotal = category ? categoryTotalSums[category] : 0;
      const codingPercentage = formatPercentage(codeTotal, categoryTotal);

      metrics.push({
        code,
        values,
        total: codeTotal,
        coding: codingPercentage,
        label,
      });
    }

    const categoryTotals: Record<string, Metric> = {};

    for (const key of Object.values(CPT_CATEGORIES_ALLSCRIPTS)) {
      categoryTotals[key] = createMetric(
        "Total",
        categoryValues[key],
        sum(categoryValues[key])
      );
    }

    return {
      cptMetrics: metrics,
      categoryTotals,
      totalVisits: totalVisitsByMonth,
    };
  }
}

function createProviderNodeAllScripts(
  provider: string,
  data: AllScriptsAggregatedData
): AllScriptsMetricBuilder {
  const builder = new AllScriptsMetricBuilder();

  // Copy monthly data
  builder.charges = [
    ...(data.providerChargesByMonth[provider] || new Array(12).fill(0)),
  ];
  builder.payments = [
    ...(data.providerPaymentsByMonth[provider] || new Array(12).fill(0)),
  ];
  builder.visits = [
    ...(data.providerVisitsByMonth[provider] || new Array(12).fill(0)),
  ];
  builder.rvus = [
    ...(data.providerRvusByMonth[provider] || new Array(12).fill(0)),
  ];

  // Copy CPT codes
  if (data.providerCptCodesByMonth[provider]) {
    for (const [code, values] of Object.entries(
      data.providerCptCodesByMonth[provider]
    )) {
      builder.codes[code] = [...values];
    }
  }

  return builder;
}

function createLocationNodeAllScripts(
  location: string,
  providers: Set<string>,
  data: AllScriptsAggregatedData
): Node {
  const locationNode: Node = {
    id: slugify(location),
    label: location,
    type: "location",
    iconType: "clinic",
    data: {} as NodeData,
    children: [],
  };

  const locationBuilder = new AllScriptsMetricBuilder();

  // Process each provider
  for (const provider of Array.from(providers)) {
    const providerBuilder = createProviderNodeAllScripts(provider, data);

    const providerNode: Node = {
      id: slugify(provider),
      label: provider,
      type: "provider",
      iconType: "person",
      data: providerBuilder.buildNodeData(),
    };

    locationBuilder.aggregate(providerBuilder);
    locationNode.children!.push(providerNode);
  }

  locationNode.data = locationBuilder.buildNodeData();
  return locationNode;
}

async function loadLocationMappings(): Promise<Map<string, string>> {
  const csvPath = path.join("data", "allscripts_locations.csv");
  const locationToState = new Map<string, string>();

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row: LocationMapping) => {
        locationToState.set(row.Location, row.State);
      })
      .on("end", () => {
        resolve(locationToState);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

function createStateNode(
  state: string,
  locationNodes: Node[]
): Node {
  const stateBuilder = new AllScriptsMetricBuilder();

  // Aggregate all location data into state
  for (const locationNode of locationNodes) {
    // Create a builder from the location's data to aggregate
    const locationBuilder = new AllScriptsMetricBuilder();
    
    // Aggregate all providers in this location
    if (locationNode.children) {
      for (const providerNode of locationNode.children) {
        const providerBuilder = new AllScriptsMetricBuilder();
        // Reconstruct provider builder from node data
        providerBuilder.charges = providerNode.data.charges.values;
        providerBuilder.payments = providerNode.data.payments.values;
        providerBuilder.visits = providerNode.data.totalVisits.values;
        providerBuilder.rvus = providerNode.data.rvus.values;
        
        // Reconstruct CPT codes from the node's cptCodes data
        for (const cptMetric of providerNode.data.cptCodes) {
          providerBuilder.codes[cptMetric.code] = cptMetric.values;
        }
        
        locationBuilder.aggregate(providerBuilder);
      }
    }
    
    stateBuilder.aggregate(locationBuilder);
  }

  const stateNode: Node = {
    id: slugify(state),
    label: state,
    type: "state",
    iconType: "clinic",
    data: stateBuilder.buildNodeData(),
    children: locationNodes,
  };

  return stateNode;
}

async function processYearDataAllScripts(year: string): Promise<Node[]> {
  const revenuePath = path.join("data", "allscripts_revenue.csv");
  const paymentsPath = path.join("data", "allscripts_payments.csv");

  console.log(`Processing AllScripts data for year ${year}...`);
  const data = await processAllScriptsData(revenuePath, paymentsPath, year);
  
  // Load location to state mappings
  const locationToState = await loadLocationMappings();

  const items: Node[] = [];

  // Create location nodes grouped by state
  const stateToLocations = new Map<string, Node[]>();

  for (const [location, providers] of Object.entries(data.locationProviders)) {
    const locationNode = createLocationNodeAllScripts(
      location,
      providers,
      data
    );
    
    const state = locationToState.get(location) || "Unknown";
    
    if (!stateToLocations.has(state)) {
      stateToLocations.set(state, []);
    }
    stateToLocations.get(state)!.push(locationNode);
  }

  // Create state nodes
  for (const [state, locationNodes] of stateToLocations.entries()) {
    const stateNode = createStateNode(state, locationNodes);
    items.push(stateNode);
  }

  // Create "All Providers" aggregation node at state level
  const allProvidersBuilder = new AllScriptsMetricBuilder();

  for (const provider of Object.keys(data.providerChargesByMonth)) {
    const providerBuilder = createProviderNodeAllScripts(provider, data);
    allProvidersBuilder.aggregate(providerBuilder);
  }

  const allProvidersNode: Node = {
    id: "all-providers",
    label: "All Providers",
    type: "aggregation",
    iconType: "clinic",
    data: allProvidersBuilder.buildNodeData(),
  };

  items.push(allProvidersNode);

  return items;
}

/**
 * Post-process provider rankings from provider performance items
 */
function calculateProviderRankingsAllScripts(
  items: Node[]
): Record<string, Record<string, number>> {
  const providerMetrics = {
    PatientCount: {},
  };

  // Traverse location nodes to find provider children
  for (const locationNode of items) {
    if (locationNode.children && locationNode.children.length > 0) {
      for (const provider of locationNode.children) {
        const providerName = provider.label;

        // Aggregate patient count from totalVisits
        if (provider.data.totalVisits?.total) {
          providerMetrics.PatientCount[providerName] =
            provider.data.totalVisits.total;
        }
      }
    }
  }

  return providerMetrics;
}

/**
 * Post-process operational dashboard from provider performance items
 */
function calculateOperationalMetricsAllScripts(items: Node[]): {
  patientsSeen: number[];
  charges: number[];
} | null {
  const allProvidersNode = items.find((node) => node.id === "all-providers");
  if (!allProvidersNode) {
    return null;
  }

  return {
    patientsSeen: allProvidersNode.data.totalVisits.values,
    charges: allProvidersNode.data.charges.values,
  };
}

export async function allScriptsTransform(): Promise<object> {
  const revenuePath = path.join("data", "allscripts_revenue.csv");

  // First, load all revenue data to extract available years
  console.log("Extracting available years from AllScripts data...");
  const allRevenueRecords = await processAllScriptsRevenue(revenuePath);
  const years = extractYearsFromRevenue(allRevenueRecords);

  console.log(`Found AllScripts data for years: ${years.join(", ")}`);

  const allYearsData: Record<string, Node[]> = {};
  const providerRankingsByYear = {};
  const operationalMetricsByYear = {};

  for (const year of years) {
    try {
      const items = await processYearDataAllScripts(year);
      allYearsData[year] = items;

      // Calculate post-processed metrics
      providerRankingsByYear[year] = calculateProviderRankingsAllScripts(items);
      operationalMetricsByYear[year] =
        calculateOperationalMetricsAllScripts(items);
    } catch (err) {
      console.error(`Error processing year ${year}:`, err);
    }
  }

  const allData = {
    providerRankings: providerRankingsByYear,
    providerPerformance: allYearsData,
    financial: {},
    operational: operationalMetricsByYear,
    clinical: {},
  };

  // Write to local JSON file
  const outputPath = path.join("data", "allscripts_transformed.json");
  await writeFile(outputPath, JSON.stringify(allData, null, 2));
  console.log(
    `AllScripts transformation complete. Output written to ${outputPath}`
  );

  // Store AllScripts data in Firebase under uhealth database
  try {
    await storeAllScriptsDashboardData("uhealth", allData);
    console.log(
      `AllScripts data successfully stored in Firebase under uhealth database`
    );
  } catch (err) {
    console.error("Error storing AllScripts data to Firebase:", err);
  }

  return allData;
}
