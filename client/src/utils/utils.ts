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

export enum FilterMode {
  ProviderOnly = "Provider",
  LocationOnly = "Location",
  Hierarchy = "Hierarchy",
}

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

export const transformToRevisNetworkHierarchy = (data, options = {}) => {
  const {
    rootLabel = "All Providers",
    includeMetrics = true,
    metricKeys = ["total", "charges", "payments", "rvus"],
    includeIcon = true,
  } = options;

  function processItem(item) {
    const node = {
      label: item.label,
      id: item.id,
    };

    if (includeIcon && item.iconType) {
      node.iconType = item.iconType;
    }

    if (includeMetrics && item.data) {
      node.metrics = {};

      metricKeys.forEach((key) => {
        if (item.data[key]) {
          node.metrics[key] = {
            total: item.data[key].total || 0,
            values: item.data[key].values || [],
          };
        }
      });
    }

    if (
      item.children &&
      Array.isArray(item.children) &&
      item.children.length > 0
    ) {
      node.children = item.children.map((child) => processItem(child));
    }

    return node;
  }

  const hierarchy = {
    label: rootLabel,
    children: [],
  };

  data.forEach((provider) => {
    hierarchy.children.push(processItem(provider));
  });

  return hierarchy;
};
