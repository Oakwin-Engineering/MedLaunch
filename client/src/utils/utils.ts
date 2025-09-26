import { FilterMode } from "../constants";

export const formatNumber = (value: number) => {
  if (typeof value !== "number") return value;
  return value.toLocaleString("en-US");
};

export const formatCurrency = (value: number) => {
  if (value === 0) return "0";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// Separate utility for flattening hierarchy
export const flattenHierarchy = (nodes: any[]): any[] => {
  let result: any[] = [];

  for (const node of nodes) {
    result.push(node);

    if (node.children && node.children.length > 0) {
      result = result.concat(flattenHierarchy(node.children));
    }
  }

  return result;
};

export const filterEntity = (
  nodes: any[],
  term: string,
  mode: FilterMode
): any[] => {
  const lowerCaseTerm = term?.toLowerCase() || "";

  if (mode === FilterMode.ProviderOnly) {
    // Recursive helper to find providers
    const findProvidersRecursively = (nodesToSearch: any[]): any[] => {
      let providers: any[] = [];
      for (const node of nodesToSearch) {
        if (node.iconType === "person") {
          providers.push(node);
        }
        if (node.children && node.children.length > 0) {
          providers = providers.concat(findProvidersRecursively(node.children));
        }
      }
      return providers;
    };

    const allProviders = findProvidersRecursively(nodes);

    const matchingProviders = allProviders.filter((provider) =>
      provider.label.toLowerCase().includes(lowerCaseTerm)
    );

    // Deduplicate by label
    const uniqueProviders = new Map();
    for (const provider of matchingProviders) {
      if (!uniqueProviders.has(provider.label)) {
        uniqueProviders.set(provider.label, provider);
      }
    }

    return Array.from(uniqueProviders.values());
  }

  if (mode === FilterMode.LocationOnly) {
    if (!term) {
      return nodes; // return all locations if empty
    }
    return nodes.filter((location) =>
      location.label.toLowerCase().includes(lowerCaseTerm)
    );
  }

  return []; // fallback
};

type CodeRow = {
  label: string;
  [key: string]: any;
};

type GroupedLabel = {
  label: string;
  rows: CodeRow[];
};

export const groupByLabel = (codes: CodeRow[]): GroupedLabel[] => {
  const groups: Record<string, CodeRow[]> = {};

  for (const row of codes) {
    if (!groups[row.label]) groups[row.label] = [];
    groups[row.label].push(row);
  }

  const order = [
    "CPT Coding",
    "New Patient",
    "Follow Up Patient",
    "Nurse Practitioner Well Visit",
    "Medicare Annual Wellness",
  ];

  const ordered = Object.entries(groups)
    .map(([label, rows]) => ({
      label,
      rows,
    }))
    .sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));

  return ordered;
};
