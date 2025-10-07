import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { Node, NodeData, Metric, CptCodeMetric, MONTHS } from "../types/common";
import { slugify } from "../types/common";
import { matchNames } from "../services/nameMatching";
import {
  processUnitsVitalCare,
  processChargesVitalCare,
  processPaymentsVitalCare,
  processContractualAdjustmentsVitalCare,
  getUniqueCPTCodesVitalCare,
  processMonthlyPatientCount,
  processRVUsVitalCare,
  processTotalVisitsVitalCare,
  processPayrollVitalCare,
  processProviderLocationRelationshipVitalCare,
  processAccountsReceivable,
} from "../etl/etlVitalcare";

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
  "99394": "Nurse Practitioner Well Visit",
  "99395": "Nurse Practitioner Well Visit",
  "99396": "Nurse Practitioner Well Visit",
  "99397": "Nurse Practitioner Well Visit",
  "99495": "Medicare Annual Wellness",
  "99496": "Medicare Annual Wellness",
};

const SLEEP_STUDY_CPT: Record<string, boolean> = {
  "95811": true,
  "95810": true,
  "95805": true,
};

const G2211 = "G2211";

const CPT_CATEGORIES: Record<string, string> = {
  "New Patient": "PatientCountTotal",
  "Follow Up Patient": "FollowUpPatientTotal",
  "Nurse Practitioner Well Visit": "NPWellnessVisitTotal",
  "Medicare Annual Wellness": "MedicareAnnualWellnessTotal",
  "CPT Coding": "CPTCodingTotal",
};

interface DataSources {
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
}

class MetricBuilder {
  charges: number[] = new Array(12).fill(0);
  payments: number[] = new Array(12).fill(0);
  adjustments: number[] = new Array(12).fill(0);
  rvus: number[] = new Array(12).fill(0);
  totalVisits: number[] = new Array(12).fill(0);
  payroll: number[] = new Array(12).fill(0);
  cptData: Record<string, Record<string, number[]>> = {};

  aggregate(other: MetricBuilder): void {
    for (let i = 0; i < 12; i++) {
      this.charges[i] += other.charges[i];
      this.payments[i] += other.payments[i];
      this.adjustments[i] += other.adjustments[i];
      this.rvus[i] += other.rvus[i];
      this.totalVisits[i] += other.totalVisits[i];
      this.payroll[i] += other.payroll[i];
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
    };
  }

  buildCPTMetrics(): {
    cptMetrics: CptCodeMetric[];
    categoryTotals: Record<string, Metric>;
  } {
    let cptUnitsTotalSum = 0;
    for (const data of Object.values(this.cptData)) {
      cptUnitsTotalSum += sum(data.units);
    }

    const metrics: CptCodeMetric[] = [];
    const categoryValues: Record<string, number[]> = {};
    const totalVisitsByMonth = new Array(12).fill(0);

    for (const category of Object.values(CPT_CATEGORIES)) {
      categoryValues[category] = new Array(12).fill(0);
    }

    for (const [code, data] of Object.entries(this.cptData)) {
      const units = data.units;
      const unitsTotal = sum(units);

      for (let i = 0; i < 12; i++) {
        totalVisitsByMonth[i] += units[i];
      }

      let label = CPT_CODE_MAPPING_VITALCARE[code] || "CPT Coding";

      const category = CPT_CATEGORIES[label];
      if (category) {
        for (let i = 0; i < 12; i++) {
          categoryValues[category][i] += units[i];
        }
      }

      metrics.push({
        code,
        values: units,
        total: unitsTotal,
        coding: formatPercentage(unitsTotal, cptUnitsTotalSum),
        label,
      });
    }

    const categoryTotals: Record<string, Metric> = {
      Total: createMetric("Total", totalVisitsByMonth, sum(totalVisitsByMonth)),
    };

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
  const monthlyPatientCount = await processMonthlyPatientCount(
    financialAnalysisFile
  );
  const rvus = await processRVUsVitalCare(rvuFile);
  const totalVisits = await processTotalVisitsVitalCare(rvuFile);
  const { data: payroll, uniqueEmployees } = await processPayrollVitalCare(
    payrollFile
  );

  const providerMetrics = aggregateProviderMetrics(
    { rvus, units },
    monthlyPatientCount
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
    providerMetrics,
  };
}

function aggregateProviderMetrics(
  ds: {
    rvus: Record<string, Record<string, number>>;
    units: Record<string, Record<string, Record<string, number>>>;
  },
  monthlyPatientCount: Record<string, Record<string, number>>
): Record<string, Record<string, number>> {
  const providerMetrics: Record<string, Record<string, number>> = {
    PatientCount: {},
    RVUs: {},
    SleepStudy: {},
    G2211: {},
  };

  // Aggregate patient counts
  for (const providerData of Object.values(monthlyPatientCount)) {
    for (const [provider, count] of Object.entries(providerData)) {
      providerMetrics.PatientCount[provider] =
        (providerMetrics.PatientCount[provider] || 0) + count;
    }
  }

  // Aggregate RVUs
  for (const providerData of Object.values(ds.rvus)) {
    for (const [provider, rvuCount] of Object.entries(providerData)) {
      providerMetrics.RVUs[provider] =
        (providerMetrics.RVUs[provider] || 0) + rvuCount;
    }
  }

  // Aggregate sleep study CPTs
  for (const cptMap of Object.values(ds.units)) {
    for (const [cptCode, providerMap] of Object.entries(cptMap)) {
      if (SLEEP_STUDY_CPT[cptCode]) {
        for (const [provider, units] of Object.entries(providerMap)) {
          providerMetrics.SleepStudy[provider] =
            (providerMetrics.SleepStudy[provider] || 0) + units;
        }
      }
    }
  }

  // Aggregate G2211 CPTs
  for (const cptMap of Object.values(ds.units)) {
    for (const [cptCode, providerMap] of Object.entries(cptMap)) {
      if (cptCode === G2211) {
        for (const [provider, units] of Object.entries(providerMap)) {
          providerMetrics.G2211[provider] =
            (providerMetrics.G2211[provider] || 0) + units;
        }
      }
    }
  }

  return providerMetrics;
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

    if (ds.totalVisits[month]?.[providerName]) {
      builder.totalVisits[i] = ds.totalVisits[month][providerName];
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

export async function vitalCareTransform(): Promise<Buffer> {
  const years = await getYearDirectories("data");

  const accountsReceivable = await processAccountsReceivable(
    "data/accounts_receivable.csv"
  );

  const allYearsData: Record<string, Node[]> = {};
  const allYearsProviderMetrics: Record<
    string,
    Record<string, Record<string, number>>
  > = {};

  for (const year of years) {
    const dataSources = await loadDataSources(year);
    const items = await processYearData(dataSources);

    allYearsData[year] = items;
    allYearsProviderMetrics[year] = dataSources.providerMetrics;
  }

  const dashboardData = {
    providerRankings: allYearsProviderMetrics,
    providerPerformance: allYearsData,
    financial: accountsReceivable,
    operational: {},
  };

  return Buffer.from(JSON.stringify(dashboardData));
}

// Helper functions
function createMetric(label: string, values: number[], total: number): Metric {
  return { label, values, total, coding: "-" };
}

function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

function divideArrays(numerator: number[], denominator: number[]): number[] {
  return numerator.map((n, i) => (denominator[i] > 0 ? n / denominator[i] : 0));
}

function percentageArrays(
  numerator: number[],
  denominator: number[]
): number[] {
  return numerator.map((n, i) =>
    denominator[i] > 0 ? (n / denominator[i]) * 100 : 0
  );
}

function percentageValue(numerator: number, denominator: number): number {
  return denominator > 0 ? (numerator / denominator) * 100 : 0;
}

function sumOrAverage(divisor: number, numerator: number): number {
  return divisor > 0 ? numerator / divisor : 0;
}

function formatPercentage(value: number, total: number): string {
  return total > 0 ? `${((value / total) * 100).toFixed(2)}%` : "0.00%";
}

function sortNodes(items: Node[]): void {
  items.sort((a, b) => {
    if (a.label === "All Providers") return -1;
    if (b.label === "All Providers") return 1;
    return a.label.localeCompare(b.label);
  });
}
