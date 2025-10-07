// Node represents a facility or provider in the hierarchy
export interface Node {
  id: string;
  label: string;
  iconType: string;
  data: NodeData;
  children?: Node[];
}

// NodeData holds the structured metrics for a node
export interface NodeData {
  cptCodes: CptCodeMetric[];
  cptCodingTotal: Metric;
  totalVisits: Metric;
  patientCountTotal: Metric;
  npWellnessVisitTotal: Metric;
  medicareAnnualWellnessTotal: Metric;
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
}

// CptCodeMetric represents a CPT code's metrics
export interface CptCodeMetric {
  code: string;
  values: number[];
  total: number;
  coding: string;
  label: string;
}

// Metric represents a single metric with a label, values, total, and coding
export interface Metric {
  label: string;
  values: number[];
  total: number;
  coding: string;
}

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
