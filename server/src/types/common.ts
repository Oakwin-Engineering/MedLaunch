// Node represents a facility or provider in the hierarchy
export type Node = {
  id: string;
  label: string;
  iconType: string;
  data: NodeData;
  children?: Node[];
};

// NodeData holds the structured metrics for a node
export type NodeData = {
  cptCodes: CptCodeMetric[];
  cptCodingTotal: Metric;
  totalVisits: Metric;
  patientCountTotal: Metric;
  npWellnessVisitTotal: Metric;
  medicareAnnualWellnessTotal?: Metric;
  transitionalCareManagementTotal?: Metric;
  allergyTestsTotal?: Metric;
  medicareAddOnTotal?: Metric;
  depressionScreeningTotal?: Metric;
  initialVisitsTotal?: Metric;
  payerPayment?: Metric;
  patientPayment?: Metric;
  subsequentVisitsTotal?: Metric;
  dischargeTotal?: Metric;
  followUpPatientTotal: Metric;
  charges: Metric;
  payments: Metric;
  rvus: Metric;
  payroll: Metric;
  adjustments: Metric;
  operatingProfit: Metric;
  rvuPerPatient: Metric;
  chargePerPatient: Metric;
  paymentPercentOfCharges: Metric;
  averageReceiptsPerPatient: Metric;
  adjustmentPercentOfCharges: Metric;
};

// CptCodeMetric represents a CPT code's metrics
export type CptCodeMetric = {
  code: string;
  values: number[];
  total: number;
  coding: string;
  label: string;
};

// Metric represents a single metric with a label, values, total, and coding
export type Metric = {
  label: string;
  values: number[];
  total: number;
  coding: string;
};

// Array of months used for data processing
export const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export const CUSTOMERS = ["uhealth", "demo", "vitalcare"];

// Helper function to convert strings to URL-friendly IDs
export function slugify(s: string): string {
  return s.toLowerCase().replace(/ /g, "_").replace(/\./g, "");
}

// Helper function to check if a string array contains a value
export function contains(slice: string[], str: string): boolean {
  return slice.includes(str);
}

export function getBucketName(customerId: string): string {
  const lowerCustomerId = customerId.toLowerCase();
  if (CUSTOMERS.includes(lowerCustomerId)) {
    return lowerCustomerId;
  }
  throw new Error(`Invalid customer ID: ${customerId}`);
}

export function createMetric(
  label: string,
  values: number[],
  total: number
): Metric {
  return { label, values, total, coding: "-" };
}

export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

export function divideArrays(
  numerator: number[],
  denominator: number[]
): number[] {
  return numerator.map((n, i) => (denominator[i] > 0 ? n / denominator[i] : 0));
}

export function percentageArrays(
  numerator: number[],
  denominator: number[]
): number[] {
  return numerator.map((n, i) =>
    denominator[i] > 0 ? (n / denominator[i]) * 100 : 0
  );
}

export function percentageValue(
  numerator: number,
  denominator: number
): number {
  return denominator > 0 ? (numerator / denominator) * 100 : 0;
}

export function sumOrAverage(divisor: number, numerator: number): number {
  return divisor > 0 ? numerator / divisor : 0;
}

export function formatPercentage(value: number, total: number): string {
  return total > 0 ? `${((value / total) * 100).toFixed(2)}%` : "0.00%";
}

export function sortNodes(items: Node[]): void {
  items.sort((a, b) => {
    if (a.label === "All Providers") return -1;
    if (b.label === "All Providers") return 1;
    return a.label.localeCompare(b.label);
  });
}
