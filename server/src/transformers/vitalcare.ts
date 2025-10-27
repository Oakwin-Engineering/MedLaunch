import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import {
  Node,
  NodeData,
  Metric,
  CptCodeMetric,
  MONTHS,
  slugify,
  createMetric,
  sum,
  divideArrays,
  percentageArrays,
  percentageValue,
  sumOrAverage,
  formatPercentage,
  sortNodes,
} from "../types/common";
import { matchNames } from "../services/nameMatching";
import {
  processUnitsVitalCare,
  processChargesVitalCare,
  processPaymentsVitalCare,
  processContractualAdjustmentsVitalCare,
  getUniqueCPTCodesVitalCare,
  processRVUsVitalCare,
  processTotalVisitsVitalCare,
  processPayrollVitalCare,
  processProviderLocationRelationshipVitalCare,
  processAccountsReceivable,
  processPayerPaymentVitalCare,
  processPatientPaymentVitalCare,
} from "../etl/etlVitalcare";
import {
  uploadHierarchyToStorage,
  storeProviderSummaries,
  storeProviderMetrics,
  storePracticeSummary,
} from "../services/firebase";

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const CPT_CODE_MAPPING_VITALCARE: Record<string, string> = {
  "99202": "New Patient",
  "99203": "New Patient",
  "99204": "New Patient",
  "99205": "New Patient",
  "99211": "Follow Up Patient",
  "99212": "Follow Up Patient",
  "99213": "Follow Up Patient",
  "99214": "Follow Up Patient",
  "99215": "Follow Up Patient",
  "99394": "New Patient Wellness Visits",
  "99395": "New Patient Wellness Visits",
  "99396": "New Patient Wellness Visits",
  "99397": "New Patient Wellness Visits",
  G0439: "Medicare Annual Wellness",
  G0438: "Medicare Annual Wellness",
  G0402: "Medicare Annual Wellness",
  "99495": "Transitional Care Management",
  "99496": "Transitional Care Management",
  "95004": "Allergy Tests",
  G2211: "Medicare Add-on",
  "96127": "Depression Screening (PHQ2 & PHQ9)",
};

const SLEEP_STUDY_CPT: Record<string, boolean> = {
  "95811": true,
  "95810": true,
  "95805": true,
};

const NEW_PATIENT_CPT: Record<string, boolean> = {
  "99202": true,
  "99203": true,
  "99204": true,
  "99205": true,
};

const G2211 = "G2211";

const CPT_CATEGORIES: Record<string, string> = {
  "New Patient": "PatientCountTotal",
  "Follow Up Patient": "FollowUpPatientTotal",
  "New Patient Wellness Visits": "NPWellnessVisitTotal",
  "Medicare Annual Wellness": "MedicareAnnualWellnessTotal",
  "Transitional Care Management": "TransitionalCareManagementTotal",
  "Allergy Tests": "AllergyTestsTotal",
  "Medicare Add-on": "MedicareAddOnTotal",
  "Depression Screening (PHQ2 & PHQ9)": "DepressionScreeningTotal",
  "CPT Coding": "CPTCodingTotal",
};

type DataSources = {
  units: Record<string, Record<string, Record<string, number>>>;
  charges: Record<string, Record<string, Record<string, number>>>;
  payments: Record<string, Record<string, Record<string, number>>>;
  adjustments: Record<string, Record<string, Record<string, number>>>;
  uniqueCPTCodes: string[];
  rvus: Record<string, Record<string, number>>;
  totalVisits: Record<string, Record<string, number>>;
  payroll: Record<string, Record<string, number>>;
  uniquePaylocityProviders: string[];
  providerMetrics: Record<string, Record<string, number>>;
  payerPayment: Record<string, Record<string, number>>;
  patientPayment: Record<string, Record<string, number>>;
};

class MetricBuilder {
  charges: number[] = new Array(12).fill(0);
  payments: number[] = new Array(12).fill(0);
  adjustments: number[] = new Array(12).fill(0);
  rvus: number[] = new Array(12).fill(0);
  totalVisits: number[] = new Array(12).fill(0);
  payroll: number[] = new Array(12).fill(0);
  payerPayment: number[] = new Array(12).fill(0);
  patientPayment: number[] = new Array(12).fill(0);
  cptData: Record<string, Record<string, number[]>> = {};

  aggregate(other: MetricBuilder): void {
    for (let i = 0; i < 12; i++) {
      this.charges[i] += other.charges[i];
      this.payments[i] += other.payments[i];
      this.adjustments[i] += other.adjustments[i];
      this.rvus[i] += other.rvus[i];
      this.totalVisits[i] += other.totalVisits[i];
      this.payroll[i] += other.payroll[i];
      this.payerPayment[i] += other.payerPayment[i];
      this.patientPayment[i] += other.patientPayment[i];
    }

    for (const [code, data] of Object.entries(other.cptData)) {
      if (!this.cptData[code]) {
        this.cptData[code] = { units: new Array(12).fill(0) };
      }
      for (let i = 0; i < 12; i++) {
        this.cptData[code].units[i] += data.units[i];
      }
    }
  }

  buildNodeData(): NodeData {
    const chargesTotal = sum(this.charges);
    const paymentsTotal = sum(this.payments);
    const adjustmentsTotal = sum(this.adjustments);
    const rvusTotal = sum(this.rvus);
    const totalVisitsTotal = sum(this.totalVisits);
    const payrollTotal = sum(this.payroll);
    const payerPaymentTotal = sum(this.payerPayment);
    const patientPaymentTotal = sum(this.patientPayment);

    const opmValues = new Array(12).fill(0);
    for (let i = 0; i < 12; i++) {
      if (this.payments[i] > 0 && this.payroll[i] > 0) {
        opmValues[i] = this.payments[i] - this.payroll[i];
      }
    }
    const opmTotal = sum(opmValues);

    const rvuPerPatient = divideArrays(this.rvus, this.totalVisits);
    const chargePerPatient = divideArrays(this.charges, this.totalVisits);
    const paymentPercentOfCharges = percentageArrays(
      this.payments,
      this.charges
    );
    const averageReceiptsPerPatient = divideArrays(
      this.payments,
      this.totalVisits
    );
    const adjustmentPercentOfCharges = percentageArrays(
      this.adjustments,
      this.charges
    );

    const { cptMetrics, categoryTotals } = this.buildCPTMetrics();

    return {
      cptCodes: cptMetrics,
      totalVisits: createMetric(
        "Total Visits",
        this.totalVisits,
        totalVisitsTotal
      ),
      cptCodingTotal: categoryTotals.CPTCodingTotal,
      patientCountTotal: categoryTotals.PatientCountTotal,
      npWellnessVisitTotal: categoryTotals.NPWellnessVisitTotal,
      medicareAnnualWellnessTotal: categoryTotals.MedicareAnnualWellnessTotal,
      transitionalCareManagementTotal:
        categoryTotals.TransitionalCareManagementTotal,
      allergyTestsTotal: categoryTotals.AllergyTestsTotal,
      medicareAddOnTotal: categoryTotals.MedicareAddOnTotal,
      depressionScreeningTotal: categoryTotals.DepressionScreeningTotal,
      followUpPatientTotal: categoryTotals.FollowUpPatientTotal,
      charges: createMetric("Charges", this.charges, chargesTotal),
      payments: createMetric("Payments", this.payments, paymentsTotal),
      adjustments: createMetric(
        "Adjustments",
        this.adjustments,
        adjustmentsTotal
      ),
      rvus: createMetric("RVUs", this.rvus, rvusTotal),
      payroll: createMetric("Payroll", this.payroll, payrollTotal),
      operatingProfit: createMetric("Operating Profit", opmValues, opmTotal),
      rvuPerPatient: createMetric(
        "RVUs per Patient",
        rvuPerPatient,
        sumOrAverage(totalVisitsTotal, rvusTotal)
      ),
      chargePerPatient: createMetric(
        "Charges per Patient",
        chargePerPatient,
        sumOrAverage(totalVisitsTotal, chargesTotal)
      ),
      paymentPercentOfCharges: createMetric(
        "Payment % of Charges",
        paymentPercentOfCharges,
        percentageValue(paymentsTotal, chargesTotal)
      ),
      averageReceiptsPerPatient: createMetric(
        "Average Receipts per Patient",
        averageReceiptsPerPatient,
        sumOrAverage(totalVisitsTotal, paymentsTotal)
      ),
      adjustmentPercentOfCharges: createMetric(
        "Adjustments % of Charges",
        adjustmentPercentOfCharges,
        percentageValue(adjustmentsTotal, chargesTotal)
      ),
      payerPayment: createMetric(
        "Payer Payment",
        this.payerPayment,
        payerPaymentTotal
      ),
      patientPayment: createMetric(
        "Patient Payment",
        this.patientPayment,
        patientPaymentTotal
      ),
    };
  }

  buildCPTMetrics(): {
    cptMetrics: CptCodeMetric[];
    categoryTotals: Record<string, Metric>;
  } {
    const metrics: CptCodeMetric[] = [];
    const categoryValues: Record<string, number[]> = {};

    for (const category of Object.values(CPT_CATEGORIES)) {
      categoryValues[category] = new Array(12).fill(0);
    }

    // First pass: calculate category values and totals
    const categoryTotalSums: Record<string, number> = {};
    for (const category of Object.values(CPT_CATEGORIES)) {
      categoryTotalSums[category] = 0;
    }

    for (const [code, data] of Object.entries(this.cptData)) {
      const units = data.units;
      const unitsTotal = sum(units);

      let label = CPT_CODE_MAPPING_VITALCARE[code] || "CPT Coding";

      const category = CPT_CATEGORIES[label];

      if (category) {
        for (let i = 0; i < 12; i++) {
          categoryValues[category][i] += units[i];
        }
        categoryTotalSums[category] += unitsTotal;
      }
    }

    // Second pass: create metrics with category-specific percentages
    for (const [code, data] of Object.entries(this.cptData)) {
      const units = data.units;
      const unitsTotal = sum(units);

      let label = CPT_CODE_MAPPING_VITALCARE[code] || "CPT Coding";
      const category = CPT_CATEGORIES[label];

      // Calculate percentage within the category
      const categoryTotal = category ? categoryTotalSums[category] : 0;
      const codingPercentage = formatPercentage(unitsTotal, categoryTotal);

      metrics.push({
        code,
        values: units,
        total: unitsTotal,
        coding: codingPercentage,
        label,
      });
    }

    const categoryTotals: Record<string, Metric> = {};

    for (const key of Object.values(CPT_CATEGORIES)) {
      categoryTotals[key] = createMetric(
        "Total",
        categoryValues[key],
        sum(categoryValues[key])
      );
    }

    return { cptMetrics: metrics, categoryTotals };
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

async function loadDataSources(year: string): Promise<DataSources> {
  const financialAnalysisFile = `data/${year}/financial_analysis.csv`;
  const rvuFile = `data/${year}/rvu.csv`;
  const payrollFile = `data/${year}/payroll.csv`;

  const units = await processUnitsVitalCare(financialAnalysisFile);
  const charges = await processChargesVitalCare(financialAnalysisFile);
  const payments = await processPaymentsVitalCare(financialAnalysisFile);
  const adjustments = await processContractualAdjustmentsVitalCare(
    financialAnalysisFile
  );
  const uniqueCPTCodes = await getUniqueCPTCodesVitalCare(
    financialAnalysisFile
  );
  const payerPayment = await processPayerPaymentVitalCare(
    financialAnalysisFile
  );
  const patientPayment = await processPatientPaymentVitalCare(
    financialAnalysisFile
  );

  const rvus = await processRVUsVitalCare(rvuFile);
  const totalVisits = await processTotalVisitsVitalCare(rvuFile);
  const { data: payroll, uniqueEmployees } = await processPayrollVitalCare(
    payrollFile
  );

  return {
    units,
    charges,
    payments,
    adjustments,
    uniqueCPTCodes,
    rvus,
    totalVisits,
    payroll,
    uniquePaylocityProviders: uniqueEmployees,
    providerMetrics: {}, // Will be calculated in post-processing
    payerPayment,
    patientPayment,
  };
}

function processProviderFinancials(
  builder: MetricBuilder,
  providerName: string,
  ds: DataSources
): void {
  for (const cptCode of ds.uniqueCPTCodes) {
    const cptUnitsValues = new Array(12).fill(0);
    let dataFound = false;

    for (let i = 0; i < MONTHS.length; i++) {
      const month = MONTHS[i];

      if (ds.units[month]?.[cptCode]?.[providerName]) {
        const val = ds.units[month][cptCode][providerName];
        if (val !== 0) {
          cptUnitsValues[i] = val;
          dataFound = true;

          // Calculate totalVisits from CPT units, excluding "CPT Coding"
          const label = CPT_CODE_MAPPING_VITALCARE[cptCode] || "CPT Coding";
          if (label !== "CPT Coding") {
            builder.totalVisits[i] += val;
          }
        }
      }

      addMonthlyValue(
        builder.charges,
        i,
        ds.charges,
        month,
        cptCode,
        providerName
      );
      addMonthlyValue(
        builder.payments,
        i,
        ds.payments,
        month,
        cptCode,
        providerName
      );
      addMonthlyValue(
        builder.adjustments,
        i,
        ds.adjustments,
        month,
        cptCode,
        providerName
      );
    }

    if (dataFound) {
      if (!builder.cptData[cptCode]) {
        builder.cptData[cptCode] = { units: new Array(12).fill(0) };
      }
      builder.cptData[cptCode].units = cptUnitsValues;
    }
  }
}

function processProviderRVUsAndVisits(
  builder: MetricBuilder,
  providerName: string,
  ds: DataSources
): void {
  for (let i = 0; i < MONTHS.length; i++) {
    const month = MONTHS[i];

    if (ds.rvus[month]?.[providerName]) {
      builder.rvus[i] = ds.rvus[month][providerName];
    }
  }
}

function processProviderPayroll(
  builder: MetricBuilder,
  providerName: string,
  ds: DataSources,
  namesMapping: Record<string, string>
): void {
  for (let i = 0; i < MONTHS.length; i++) {
    const month = MONTHS[i];
    const mappedName = namesMapping[providerName];

    if (ds.payroll[month]?.[mappedName]) {
      builder.payroll[i] = ds.payroll[month][mappedName];
    }
  }
}

function processProviderPayments(
  builder: MetricBuilder,
  providerName: string,
  ds: DataSources
): void {
  for (let i = 0; i < MONTHS.length; i++) {
    const month = MONTHS[i];

    if (ds.payerPayment[month]?.[providerName]) {
      builder.payerPayment[i] = ds.payerPayment[month][providerName];
    }

    if (ds.patientPayment[month]?.[providerName]) {
      builder.patientPayment[i] = ds.patientPayment[month][providerName];
    }
  }
}

function buildProviderToLocationMap(
  locationProviderMap: Record<string, string[]>
): Record<string, string[]> {
  const providerToLocationMap: Record<string, string[]> = {};

  for (const [loc, provs] of Object.entries(locationProviderMap)) {
    for (const p of provs) {
      if (!providerToLocationMap[p]) {
        providerToLocationMap[p] = [];
      }
      providerToLocationMap[p].push(loc);
    }
  }

  return providerToLocationMap;
}

function getProviderOccurrence(
  providerName: string,
  location: string,
  providerToLocationMap: Record<string, string[]>
): number {
  if (providerToLocationMap[providerName]?.length > 1) {
    const index = providerToLocationMap[providerName].indexOf(location);
    return index + 1;
  }
  return 1;
}

function generateProviderID(
  providerName: string,
  occurrence: number,
  providerToLocationMap: Record<string, string[]>
): string {
  let providerID = slugify(providerName);
  if (providerToLocationMap[providerName]?.length > 1) {
    providerID = `${providerID}_${occurrence}`;
  }
  return providerID;
}

function addMonthlyValue(
  target: number[],
  index: number,
  data: Record<string, Record<string, Record<string, number>>>,
  month: string,
  cptCode: string,
  providerName: string
): void {
  const val = data[month]?.[cptCode]?.[providerName];
  if (val && val !== 0) {
    target[index] += val;
  }
}

function createLocationNode(
  location: string,
  providers: string[],
  ds: DataSources,
  namesMapping: Record<string, string>,
  providerToLocationMap: Record<string, string[]>
): Node {
  const locationNode: Node = {
    id: slugify(location),
    label: location,
    iconType: "clinic",
    data: {} as NodeData,
    children: [],
  };

  const locationBuilder = new MetricBuilder();

  for (const providerName of providers) {
    const occurrence = getProviderOccurrence(
      providerName,
      location,
      providerToLocationMap
    );
    const providerID = generateProviderID(
      providerName,
      occurrence,
      providerToLocationMap
    );

    const providerBuilder = new MetricBuilder();
    processProviderFinancials(providerBuilder, providerName, ds);
    processProviderRVUsAndVisits(providerBuilder, providerName, ds);
    processProviderPayroll(providerBuilder, providerName, ds, namesMapping);
    processProviderPayments(providerBuilder, providerName, ds);

    const providerNode: Node = {
      id: providerID,
      label: providerName,
      iconType: "person",
      data: providerBuilder.buildNodeData(),
    };

    locationBuilder.aggregate(providerBuilder);
    locationNode.children!.push(providerNode);
  }

  locationNode.data = locationBuilder.buildNodeData();
  return locationNode;
}

function createAllProvidersNode(
  uniqueProviders: string[],
  ds: DataSources,
  namesMapping: Record<string, string>
): Node {
  const builder = new MetricBuilder();

  for (const providerName of uniqueProviders) {
    const providerBuilder = new MetricBuilder();
    processProviderFinancials(providerBuilder, providerName, ds);
    processProviderRVUsAndVisits(providerBuilder, providerName, ds);
    processProviderPayroll(providerBuilder, providerName, ds, namesMapping);
    processProviderPayments(providerBuilder, providerName, ds);
    builder.aggregate(providerBuilder);
  }

  return {
    id: "all-providers",
    label: "All Providers",
    iconType: "clinic",
    data: builder.buildNodeData(),
  };
}

async function processYearData(dataSources: DataSources): Promise<Node[]> {
  const { locationProviderMap, uniqueProviders } =
    await processProviderLocationRelationshipVitalCare(
      "data/provider_location_relationship.csv"
    );

  const namesMapping = matchNames(
    uniqueProviders,
    dataSources.uniquePaylocityProviders
  );
  const providerToLocationMap = buildProviderToLocationMap(locationProviderMap);

  const items: Node[] = [];

  for (const [location, providers] of Object.entries(locationProviderMap)) {
    const locationNode = createLocationNode(
      location,
      providers,
      dataSources,
      namesMapping,
      providerToLocationMap
    );
    items.push(locationNode);
  }

  const allProvidersNode = createAllProvidersNode(
    uniqueProviders,
    dataSources,
    namesMapping
  );
  items.push(allProvidersNode);

  sortNodes(items);

  return items;
}

/**
 * Post-process provider rankings from provider performance items
 * Extracts metrics by traversing the node hierarchy
 */
function calculateProviderRankings(
  items: Node[]
): Record<string, Record<string, number>> {
  const providerMetrics = {
    PatientCount: {},
    RVUs: {},
    SleepStudy: {},
    G2211: {},
  };

  // Traverse location nodes to find provider children
  for (const item of items) {
    // This is a location node, process its children (providers)
    if (item.children && item.children.length > 0) {
      for (const provider of item.children) {
        const providerName = provider.label;

        // Aggregate patient count from totalVisits
        providerMetrics.PatientCount[providerName] =
          provider.data.totalVisits.total;

        // Aggregate RVUs
        providerMetrics.RVUs[providerName] = provider.data.rvus.total;

        // Aggregate Sleep Study CPTs
        let sleepStudyTotal = 0;
        for (const cptCode of provider.data.cptCodes) {
          if (SLEEP_STUDY_CPT[cptCode.code]) {
            sleepStudyTotal += cptCode.total;
          }
        }
        if (sleepStudyTotal > 0) {
          providerMetrics.SleepStudy[providerName] = sleepStudyTotal;
        }

        // Aggregate G2211 CPTs
        const g2211Cpt = provider.data.cptCodes.find(
          (cpt) => cpt.code === G2211
        );
        if (g2211Cpt && g2211Cpt.total > 0) {
          providerMetrics.G2211[providerName] = g2211Cpt.total;
        }
      }
    }
  }

  return providerMetrics;
}

/**
 * Post-process operational dashboard from provider performance items
 */
function calculateOperational(items: Node[]): {
  patientsSeen: number[];
  newPatients: number[];
  charges: number[];
  rvus: number[];
  sleepStudy: number[];
  payerPayment: number[];
  patientPayment: number[];
  totalReceipts: number[];
} | null {
  const allProvidersNode = items.find((node) => node.id === "all-providers");
  if (!allProvidersNode) {
    return null;
  }

  // Calculate new patient count by aggregating new patient CPT codes
  const newPatientCountValues = new Array(12).fill(0);
  for (const cptCode of allProvidersNode.data.cptCodes) {
    if (NEW_PATIENT_CPT[cptCode.code]) {
      for (let i = 0; i < 12; i++) {
        newPatientCountValues[i] += cptCode.values[i];
      }
    }
  }

  // Calculate sleep study values by aggregating sleep study CPT codes
  const sleepStudyValues = new Array(12).fill(0);
  for (const cptCode of allProvidersNode.data.cptCodes) {
    if (SLEEP_STUDY_CPT[cptCode.code]) {
      for (let i = 0; i < 12; i++) {
        sleepStudyValues[i] += cptCode.values[i];
      }
    }
  }

  // Get payer payment and patient payment from allProvidersNode
  const payerPaymentValues = allProvidersNode.data.payerPayment.values;
  const patientPaymentValues = allProvidersNode.data.patientPayment.values;

  // Calculate total receipts (payer + patient)
  const totalReceiptsValues = new Array(12).fill(0);
  for (let i = 0; i < 12; i++) {
    totalReceiptsValues[i] = payerPaymentValues[i] + patientPaymentValues[i];
  }

  return {
    patientsSeen: allProvidersNode.data.totalVisits.values,
    newPatients: newPatientCountValues,
    charges: allProvidersNode.data.charges.values,
    rvus: allProvidersNode.data.rvus.values,
    sleepStudy: sleepStudyValues,
    payerPayment: payerPaymentValues,
    patientPayment: patientPaymentValues,
    totalReceipts: totalReceiptsValues,
  };
}

export async function vitalCareTransform(): Promise<object> {
  const years = await getYearDirectories("data");

  const allYearsProviderPerformance: Record<string, Node[]> = {};
  const allYearsOperational = {};
  const allYearsProviderRankings = {};

  for (const year of years) {
    const dataSources = await loadDataSources(year);
    const items = await processYearData(dataSources);

    // Store provider performance (main calculation)
    allYearsProviderPerformance[year] = items;

    // Post-process other dashboards from items
    allYearsProviderRankings[year] = calculateProviderRankings(items);
    allYearsOperational[year] = calculateOperational(items);

    // Store individual entities in Firestore
    await storeVitalCareDataInFirestore(year, items, allYearsOperational[year]);
  }

  const accountsReceivable = await processAccountsReceivable(
    "data/accounts_receivable.csv"
  );

  const dashboardData = {
    providerRankings: allYearsProviderRankings,
    providerPerformance: allYearsProviderPerformance,
    financial: accountsReceivable,
    operational: allYearsOperational,
  };

  // Upload full hierarchy to Firebase Storage
  await uploadHierarchyToStorage("vitalcare", dashboardData);

  return dashboardData;
}

/**
 * Stores VitalCare data in Firestore collections
 */
async function storeVitalCareDataInFirestore(
  year: string,
  items: Node[],
  operationalMetrics: any
): Promise<void> {
  console.log(`\n📦 Storing ${year} data in Firestore...`);

  // Extract provider data from hierarchy
  const providerSummaries: Array<{
    id: string;
    name: string;
    totalCharges?: number;
    totalPayments?: number;
    totalPayroll?: number;
    totalOperatingProfit?: number;
  }> = [];

  // Traverse the hierarchy to extract providers
  for (const locationNode of items) {
    if (locationNode.children) {
      for (const providerNode of locationNode.children) {
        const providerId = providerNode.id;
        const providerName = providerNode.label;

        // Add to provider summaries
        providerSummaries.push({
          id: providerId,
          name: providerName,
          totalCharges: providerNode.data.charges.total,
          totalPayments: providerNode.data.payments.total,
          totalPayroll: providerNode.data.payroll.total,
          totalOperatingProfit: providerNode.data.operatingProfit.total,
        });

        // Store detailed metrics for this provider
        await storeProviderMetrics(
          "vitalcare",
          year,
          providerId,
          providerName,
          providerNode.data
        );
      }
    }
  }

  // Store provider summaries (creates/updates provider documents)
  if (providerSummaries.length > 0) {
    await storeProviderSummaries("vitalcare", year, providerSummaries);
  }

  // Store practice summary for the year
  await storePracticeSummary("vitalcare", year, operationalMetrics);
}
