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

export const headers = [
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
}

export const DropdownItems = [
  { label: "Location", mode: FilterMode.LocationOnly },
  { label: "Provider", mode: FilterMode.ProviderOnly },
];
