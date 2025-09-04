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
    // Mode 1: Search only for persons (providers)
    const providers = [];
    for (const location of nodes) {
      if (location.children) {
        for (const person of location.children) {
          if (person.label.toLowerCase().includes(lowerCaseTerm)) {
            providers.push(person);
          }
        }
      }
    }
    // Return a flat list of matching providers with unique labels
    const uniqueProviders = new Map();
    for (const provider of providers) {
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
