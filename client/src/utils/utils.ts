export const formatCurrency = (value: number) => {
  if (value === 0) return "0";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export const filterEntity = (
  nodes: any[],
  term: string,
  providersOnly: boolean
): any[] => {
  const lowerCaseTerm = term?.toLowerCase() || "";

  if (providersOnly) {
    // Helper function to recursively find all providers
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

    // Get all providers from the hierarchy
    const allProviders = findProvidersRecursively(nodes);

    // Filter providers based on the search term
    const matchingProviders = allProviders.filter((provider) =>
      provider.label.toLowerCase().includes(lowerCaseTerm)
    );

    // Return a flat list of matching providers with unique labels
    const uniqueProviders = new Map();
    for (const provider of matchingProviders) {
      if (!uniqueProviders.has(provider.label)) {
        uniqueProviders.set(provider.label, provider);
      }
    }
    return Array.from(uniqueProviders.values());
  } else {
    // Mode 2: Search only for locations
    if (!term) {
      return nodes; // Return all locations if search term is empty
    }
    return nodes.filter((location) =>
      location.label.toLowerCase().includes(lowerCaseTerm)
    );
  }
};
