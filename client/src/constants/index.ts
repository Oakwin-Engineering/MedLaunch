export const customers = [
  {
    customerID: "uhealth",
    customerName: "UHealth",
  },
  {
    customerID: "demo",
    customerName: "Demo",
  },
  {
    customerID: "vitalcare",
    customerName: "VitalCare",
  },
];

export const Headers = [
  "Code/Description",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Totals",
  "Coding %",
];

export enum FilterMode {
  ProviderOnly = "Provider",
  LocationOnly = "Location",
  Hierarchial = "Hierarchial PDF",
}

export const DropdownItems = [
  { label: "Location", mode: FilterMode.LocationOnly },
  { label: "Provider", mode: FilterMode.ProviderOnly },
  { label: "Hierarchial PDF", mode: FilterMode.Hierarchial },
];

export const CPTCodeLabelColors = {
  // VitalCare categories
  "New Patient": "rgb(222, 234, 255)",
  "Follow Up Patient": "rgb(241, 205, 177)",
  "Nurse Practitioner Well Visit": "rgba(211, 217, 227, 1)",
  "Medicare Annual Wellness": "rgba(210, 190, 237, 1)",
  // UHealth categories
  "Initial Visits": "rgb(255, 247, 153)",
  "Subsequent Visits": "rgb(241, 205, 177)",
  Discharge: "rgba(211, 217, 227, 1)",
  // Common
  "CPT Coding": "rgb(254, 249, 200)",
};

export const LabelMapping = {
  // VitalCare categories
  "New Patient": "patientCountTotal",
  "Follow Up Patient": "followUpPatientTotal",
  "Nurse Practitioner Well Visit": "npWellnessVisitTotal",
  "Medicare Annual Wellness": "medicareAnnualWellnessTotal",
  // UHealth categories
  "Initial Visits": "initialVisitsTotal",
  "Subsequent Visits": "subsequentVisitsTotal",
  Discharge: "dischargeTotal",
  // Common
  "CPT Coding": "cptCodingTotal",
};
