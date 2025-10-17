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
  "New Patient Wellness Visits": "rgba(211, 217, 227, 1)",
  "Medicare Annual Wellness": "rgba(210, 190, 237, 1)",
  "Transitional Care Management": "rgba(173, 216, 230, 1)",
  "Allergy Tests": "rgba(255, 218, 185, 1)",
  "Medicare Add-on": "rgba(221, 160, 221, 1)",
  "Depression Screening (PHQ2 & PHQ9)": "rgba(176, 224, 230, 1)",
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
  "New Patient Wellness Visits": "npWellnessVisitTotal",
  "Medicare Annual Wellness": "medicareAnnualWellnessTotal",
  "Transitional Care Management": "transitionalCareManagementTotal",
  "Allergy Tests": "allergyTestsTotal",
  "Medicare Add-on": "medicareAddOnTotal",
  "Depression Screening (PHQ2 & PHQ9)": "depressionScreeningTotal",
  // UHealth categories
  "Initial Visits": "initialVisitsTotal",
  "Subsequent Visits": "subsequentVisitsTotal",
  Discharge: "dischargeTotal",
  // Common
  "CPT Coding": "cptCodingTotal",
};
