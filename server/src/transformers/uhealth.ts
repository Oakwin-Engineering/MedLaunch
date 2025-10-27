import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import {
  Node,
  NodeData,
  Metric,
  CptCodeMetric,
  MONTHS,
  contains,
  slugify,
  createMetric,
  sum,
  divideArrays,
  percentageArrays,
  percentageValue,
  sumOrAverage,
  formatPercentage,
} from "../types/common";
import { matchNames } from "../services/nameMatching";
import {
  loadStateDivisionMapping,
  processChargesByClinicUHealth,
  processChargesByProviderUHealth,
  processCollectionsByFacilityUHealth,
  processCollectionsByProviderUHealth,
  processVisitsByClinicUHealth,
  processVisitsByProviderUHealth,
  processProviderCodeRelationshipsUHealth,
  processProviderFacilityRelationshipsUHealth,
  processADPProviderPayrollMonthlyUHealth,
} from "../etl/etlUhealth";

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const CPT_CODE_MAPPING_UHEALTH: Record<string, string> = {
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

const CPT_CATEGORIES_UHEALTH: Record<string, string> = {
  "Initial Visits": "InitialVisitsTotal",
  "Subsequent Visits": "SubsequentVisitsTotal",
  Discharge: "DischargeTotal",
  "CPT Coding": "CPTCodingTotal",
};

type UHealthDataSources = {
  monthlyFacilityTotals: Record<string, Record<string, number>>;
  monthlyProviderTotals: Record<string, Record<string, number>>;
  monthlyFacilityCollections: Record<string, Record<string, number>>;
  monthlyProviderCollections: Record<string, Record<string, number>>;
  monthlyProviderCodes: Record<string, Record<string, Record<string, number>>>;
  monthlyFacilityVisits: Record<string, Record<string, number>>;
  monthlyProviderVisits: Record<string, Record<string, number>>;
  monthlyProviderPayrolls: Record<string, Record<string, number>>;
  uniqueADPProviderNames: string[];
};

class UHealthMetricBuilder {
  charges: number[] = new Array(12).fill(0);
  collections: number[] = new Array(12).fill(0);
  visits: number[] = new Array(12).fill(0);
  payroll: number[] = new Array(12).fill(0);
  codes: Record<string, number[]> = {};

  aggregate(other: UHealthMetricBuilder): void {
    for (let i = 0; i < 12; i++) {
      this.charges[i] += other.charges[i];
      this.collections[i] += other.collections[i];
      this.visits[i] += other.visits[i];
      this.payroll[i] += other.payroll[i];
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
    const collectionsTotal = sum(this.collections);
    const payrollTotal = sum(this.payroll);

    const opmValues = new Array(12).fill(0);
    for (let i = 0; i < 12; i++) {
      if (this.collections[i] > 0 && this.payroll[i] > 0) {
        opmValues[i] = this.collections[i] - this.payroll[i];
      }
    }
    const opmTotal = sum(opmValues);

    const { cptMetrics, categoryTotals, totalVisits } = this.buildCPTMetrics();
    const visitsTotal = sum(totalVisits);

    const chargePerPatient = divideArrays(this.charges, totalVisits);
    const paymentPercentOfCharges = percentageArrays(
      this.collections,
      this.charges
    );
    const averageReceiptsPerPatient = divideArrays(
      this.collections,
      totalVisits
    );

    return {
      cptCodes: cptMetrics,
      cptCodingTotal: categoryTotals.CPTCodingTotal,
      initialVisitsTotal: categoryTotals.InitialVisitsTotal,
      subsequentVisitsTotal: categoryTotals.SubsequentVisitsTotal,
      dischargeTotal: categoryTotals.DischargeTotal,
      totalVisits: createMetric("Total Visits", totalVisits, visitsTotal),
      charges: createMetric("Charges", this.charges, chargesTotal),
      payments: createMetric("Payments", this.collections, collectionsTotal),
      payroll: createMetric("Payroll", this.payroll, payrollTotal),
      operatingProfit: createMetric("Operating Profit", opmValues, opmTotal),
      chargePerPatient: createMetric(
        "Charges per Patient",
        chargePerPatient,
        sumOrAverage(visitsTotal, chargesTotal)
      ),
      paymentPercentOfCharges: createMetric(
        "Payment % of Charges",
        paymentPercentOfCharges,
        percentageValue(collectionsTotal, chargesTotal)
      ),
      averageReceiptsPerPatient: createMetric(
        "Average Receipts per Patient",
        averageReceiptsPerPatient,
        sumOrAverage(visitsTotal, collectionsTotal)
      ),
      rvuPerPatient: createMetric("RVUs per Patient", [], 0),
      adjustments: createMetric("Adjustments", [], 0),
      adjustmentPercentOfCharges: createMetric(
        "Adjustments % of Charges",
        [],
        0
      ),
      rvus: createMetric("RVUs", [], 0),
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

    for (const category of Object.values(CPT_CATEGORIES_UHEALTH)) {
      categoryValues[category] = new Array(12).fill(0);
    }

    // First pass: calculate category values and totals
    const categoryTotalSums: Record<string, number> = {};
    for (const category of Object.values(CPT_CATEGORIES_UHEALTH)) {
      categoryTotalSums[category] = 0;
    }

    for (const [code, values] of Object.entries(this.codes)) {
      const codeTotal = sum(values);

      const label = CPT_CODE_MAPPING_UHEALTH[code] || "CPT Coding";
      const category = CPT_CATEGORIES_UHEALTH[label];

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

      const label = CPT_CODE_MAPPING_UHEALTH[code] || "CPT Coding";
      const category = CPT_CATEGORIES_UHEALTH[label];

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

    for (const key of Object.values(CPT_CATEGORIES_UHEALTH)) {
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

async function getYearDirectories(basePath: string): Promise<string[]> {
  const files = await readdir(basePath);
  const years: string[] = [];

  for (const file of files) {
    const filePath = path.join(basePath, file);
    const stats = await stat(filePath);
    if (stats.isDirectory()) {
      years.push(file);
    }
  }

  return years;
}

async function loadUHealthDataSources(
  year: string
): Promise<UHealthDataSources> {
  const ds: UHealthDataSources = {
    monthlyFacilityTotals: {},
    monthlyProviderTotals: {},
    monthlyFacilityCollections: {},
    monthlyProviderCollections: {},
    monthlyProviderCodes: {},
    monthlyFacilityVisits: {},
    monthlyProviderVisits: {},
    monthlyProviderPayrolls: {},
    uniqueADPProviderNames: [],
  };

  // Process payroll data
  const { data: payrollData, uniqueProviders } =
    await processADPProviderPayrollMonthlyUHealth(`data/${year}/adp.csv`);
  ds.monthlyProviderPayrolls = payrollData;
  ds.uniqueADPProviderNames = uniqueProviders;

  // Process each month's data
  for (const month of MONTHS) {
    const chargesByClinicPath = `data/${year}/${month}_charges_by_clinic.csv`;
    const chargesByProviderPath = `data/${year}/${month}_charges_by_provider_top.csv`;
    const collectionsByFacilityPath = `data/${year}/${month}_collections_by_facility.csv`;
    const collectionsByProviderPath = `data/${year}/${month}_collections_by_provider.csv`;
    const cptCodesByProviderPath = `data/${year}/${month}_charges_by_provider_bottom.csv`;

    try {
      if (fs.existsSync(chargesByClinicPath)) {
        ds.monthlyFacilityTotals[month] = await processChargesByClinicUHealth(
          chargesByClinicPath
        );
        ds.monthlyFacilityVisits[month] = await processVisitsByClinicUHealth(
          chargesByClinicPath
        );
      }

      if (fs.existsSync(chargesByProviderPath)) {
        ds.monthlyProviderTotals[month] = await processChargesByProviderUHealth(
          chargesByProviderPath
        );
        ds.monthlyProviderVisits[month] = await processVisitsByProviderUHealth(
          chargesByProviderPath
        );
      }

      if (fs.existsSync(collectionsByFacilityPath)) {
        ds.monthlyFacilityCollections[month] =
          await processCollectionsByFacilityUHealth(collectionsByFacilityPath);
      }

      if (fs.existsSync(collectionsByProviderPath)) {
        ds.monthlyProviderCollections[month] =
          await processCollectionsByProviderUHealth(collectionsByProviderPath);
      }

      if (fs.existsSync(cptCodesByProviderPath)) {
        ds.monthlyProviderCodes[month] =
          await processProviderCodeRelationshipsUHealth(cptCodesByProviderPath);
      }
    } catch (err) {
      console.error(`Error processing month ${month}:`, err);
    }
  }

  return ds;
}

function createProviderNodeUHealth(
  provider: string,
  ds: UHealthDataSources,
  namesMapping: Record<string, string>
): UHealthMetricBuilder {
  const builder = new UHealthMetricBuilder();

  for (let i = 0; i < MONTHS.length; i++) {
    const month = MONTHS[i];

    // Get charges
    if (ds.monthlyProviderTotals[month]?.[provider]) {
      builder.charges[i] = ds.monthlyProviderTotals[month][provider];
    }

    // Get collections
    if (ds.monthlyProviderCollections[month]?.[provider]) {
      builder.collections[i] = ds.monthlyProviderCollections[month][provider];
    }

    // Get visits
    if (ds.monthlyProviderVisits[month]?.[provider]) {
      builder.visits[i] = ds.monthlyProviderVisits[month][provider];
    }

    // Get payroll
    const mappedName = namesMapping[provider];
    if (mappedName && ds.monthlyProviderPayrolls[month]?.[mappedName]) {
      builder.payroll[i] = ds.monthlyProviderPayrolls[month][mappedName];
    }

    // Get codes
    if (ds.monthlyProviderCodes[month]?.[provider]) {
      for (const [code, count] of Object.entries(
        ds.monthlyProviderCodes[month][provider]
      )) {
        if (!builder.codes[code]) {
          builder.codes[code] = new Array(12).fill(0);
        }
        builder.codes[code][i] = count;
      }
    }
  }

  return builder;
}

function getFacilityOccurrence(
  provider: string,
  facility: string,
  providerToFacilityMap: Record<string, string[]>
): number {
  if (providerToFacilityMap[provider]?.length > 1) {
    const index = providerToFacilityMap[provider].indexOf(facility);
    return index + 1;
  }
  return 1;
}

function generateProviderIDForFacility(
  provider: string,
  occurrence: number,
  providerToFacilityMap: Record<string, string[]>
): string {
  let providerID = slugify(provider);
  if (providerToFacilityMap[provider]?.length > 1) {
    providerID = `${providerID}_${occurrence}`;
  }
  return providerID;
}

function createFacilityNodeUHealth(
  facility: string,
  providers: Record<string, boolean>,
  ds: UHealthDataSources,
  namesMapping: Record<string, string>,
  providerToFacilityMap: Record<string, string[]>
): Node {
  const facilityNode: Node = {
    id: slugify(facility),
    label: facility,
    type: "location",
    iconType: "clinic",
    data: {} as NodeData,
    children: [],
  };

  const facilityBuilder = new UHealthMetricBuilder();

  // Process each provider
  for (const provider of Object.keys(providers)) {
    const occurrence = getFacilityOccurrence(
      provider,
      facility,
      providerToFacilityMap
    );
    const providerID = generateProviderIDForFacility(
      provider,
      occurrence,
      providerToFacilityMap
    );

    const providerBuilder = createProviderNodeUHealth(
      provider,
      ds,
      namesMapping
    );

    const providerNode: Node = {
      id: providerID,
      label: provider,
      type: "provider",
      iconType: "person",
      data: providerBuilder.buildNodeData(),
    };

    facilityBuilder.aggregate(providerBuilder);
    facilityNode.children!.push(providerNode);
  }

  // Also add facility-level metrics directly from data sources
  for (let i = 0; i < MONTHS.length; i++) {
    const month = MONTHS[i];

    if (ds.monthlyFacilityTotals[month]?.[facility]) {
      facilityBuilder.charges[i] = ds.monthlyFacilityTotals[month][facility];
    }

    if (ds.monthlyFacilityCollections[month]?.[facility]) {
      facilityBuilder.collections[i] =
        ds.monthlyFacilityCollections[month][facility];
    }

    if (ds.monthlyFacilityVisits[month]?.[facility]) {
      facilityBuilder.visits[i] = ds.monthlyFacilityVisits[month][facility];
    }
  }

  facilityNode.data = facilityBuilder.buildNodeData();
  return facilityNode;
}

async function processYearDataUHealth(year: string): Promise<Node[]> {
  // Process provider-facility relationships
  const mergedFacilityProviders: Record<string, Record<string, boolean>> = {};
  const mergedProviderFacilities: Record<string, string[]> = {};

  for (const month of MONTHS) {
    const allDataPath = `data/${year}/${month}_all_data.csv`;
    if (!fs.existsSync(allDataPath)) {
      continue;
    }

    try {
      const { facilityProviders, providerFacilities } =
        await processProviderFacilityRelationshipsUHealth(allDataPath);

      // console.log(facilityProviders, providerFacilities);

      // Merge relationships
      for (const [facility, providers] of Object.entries(facilityProviders)) {
        if (!mergedFacilityProviders[facility]) {
          mergedFacilityProviders[facility] = {};
        }
        for (const provider of Object.keys(providers)) {
          mergedFacilityProviders[facility][provider] = true;
        }
      }

      for (const [provider, facilities] of Object.entries(providerFacilities)) {
        if (!mergedProviderFacilities[provider]) {
          mergedProviderFacilities[provider] = [];
        }
        for (const facility of facilities) {
          if (!contains(mergedProviderFacilities[provider], facility)) {
            mergedProviderFacilities[provider].push(facility);
          }
        }
      }
    } catch (err) {
      console.error(`Error processing ${allDataPath}:`, err);
    }
  }

  if (Object.keys(mergedFacilityProviders).length === 0) {
    throw new Error(`No data found to process for year ${year}`);
  }

  // Load location mapping
  const locationMapping = await loadStateDivisionMapping(
    `data/${year}/state_division_mapping.csv`
  );

  // Load all data sources
  const ds = await loadUHealthDataSources(year);

  // Get unique providers and match names
  const uniqueAthelasProviders = Object.keys(mergedProviderFacilities);
  const namesMapping = matchNames(
    uniqueAthelasProviders,
    ds.uniqueADPProviderNames
  );

  // Build hierarchy
  const states: Record<string, Record<string, Node[]>> = {};

  for (const [facility, providers] of Object.entries(mergedFacilityProviders)) {
    const mapping = locationMapping[facility];
    if (!mapping) {
      continue;
    }

    const facilityNode = createFacilityNodeUHealth(
      facility,
      providers,
      ds,
      namesMapping,
      mergedProviderFacilities
    );

    if (!states[mapping.state]) {
      states[mapping.state] = {};
    }
    if (!states[mapping.state][mapping.division]) {
      states[mapping.state][mapping.division] = [];
    }
    states[mapping.state][mapping.division].push(facilityNode);
  }

  const items: Node[] = [];

  // Build state and division nodes with aggregation
  for (const [stateName, divisions] of Object.entries(states)) {
    const stateNode: Node = {
      id: slugify(stateName),
      label: stateName,
      type: "state",
      iconType: "state",
      data: {} as NodeData,
      children: [],
    };

    const stateBuilder = new UHealthMetricBuilder();

    for (const [divisionName, facilityNodes] of Object.entries(divisions)) {
      const divisionNode: Node = {
        id: slugify(divisionName),
        label: divisionName,
        type: "division",
        iconType: "division",
        data: {} as NodeData,
        children: facilityNodes,
      };

      const divisionBuilder = new UHealthMetricBuilder();

      // Aggregate facility data to division
      for (const facilityNode of facilityNodes) {
        for (let i = 0; i < 12; i++) {
          divisionBuilder.charges[i] += facilityNode.data.charges.values[i];
          divisionBuilder.collections[i] +=
            facilityNode.data.payments.values[i];
          divisionBuilder.visits[i] += facilityNode.data.totalVisits.values[i];
          divisionBuilder.payroll[i] += facilityNode.data.payroll.values[i];
        }
        for (const cptCode of facilityNode.data.cptCodes) {
          if (!divisionBuilder.codes[cptCode.code]) {
            divisionBuilder.codes[cptCode.code] = new Array(12).fill(0);
          }
          for (let i = 0; i < 12; i++) {
            divisionBuilder.codes[cptCode.code][i] += cptCode.values[i];
          }
        }
      }

      divisionNode.data = divisionBuilder.buildNodeData();
      stateNode.children!.push(divisionNode);

      // Aggregate division to state
      stateBuilder.aggregate(divisionBuilder);
    }

    stateNode.data = stateBuilder.buildNodeData();
    items.push(stateNode);
  }

  // Create "All Providers" node
  const allProvidersBuilder = new UHealthMetricBuilder();

  for (const provider of uniqueAthelasProviders) {
    const providerBuilder = createProviderNodeUHealth(
      provider,
      ds,
      namesMapping
    );
    allProvidersBuilder.aggregate(providerBuilder);
  }

  const allProvidersNode: Node = {
    id: "all-providers",
    label: "All Providers",
    type: "aggregation",
    iconType: "clinic",
    data: allProvidersBuilder.buildNodeData(),
  };

  // Sort and prepend "All Providers"
  items.sort((a, b) => a.label.localeCompare(b.label));

  for (const stateNode of items) {
    stateNode.children!.sort((a, b) => a.label.localeCompare(b.label));
    for (const divisionNode of stateNode.children!) {
      divisionNode.children!.sort((a, b) => a.label.localeCompare(b.label));
    }
  }

  items.unshift(allProvidersNode);

  return items;
}

/**
 * Post-process provider rankings from provider performance items
 * Extracts metrics by traversing the node hierarchy
 */
function calculateProviderRankingsUHealth(
  items: Node[]
): Record<string, Record<string, number>> {
  const providerMetrics = {
    PatientCount: {},
  };

  // Traverse state > division > facility nodes to find provider children
  for (const stateNode of items) {
    if (stateNode.children && stateNode.children.length > 0) {
      for (const divisionNode of stateNode.children) {
        if (divisionNode.children && divisionNode.children.length > 0) {
          for (const facilityNode of divisionNode.children) {
            if (facilityNode.children && facilityNode.children.length > 0) {
              for (const provider of facilityNode.children) {
                const providerName = provider.label;

                // Aggregate patient count from totalVisits
                if (provider.data.totalVisits?.total) {
                  providerMetrics.PatientCount[providerName] =
                    provider.data.totalVisits.total;
                }
              }
            }
          }
        }
      }
    }
  }

  return providerMetrics;
}

/**
 * Post-process operational dashboard from provider performance items
 */
function calculateOperationalMetricsUHealth(items: Node[]): {
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

export async function uHealthTransform(): Promise<object> {
  const years = await getYearDirectories("data");

  const allYearsData: Record<string, Node[]> = {};
  const providerRankingsByYear = {};
  const operationalMetricsByYear = {};

  for (const year of years) {
    try {
      const items = await processYearDataUHealth(year);
      allYearsData[year] = items;

      // Calculate post-processed metrics
      providerRankingsByYear[year] = calculateProviderRankingsUHealth(items);
      operationalMetricsByYear[year] =
        calculateOperationalMetricsUHealth(items);
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

  // Return all transformed data
  return allData;
}
