function flat(array) {
  var result = [];
  array.forEach(function (a) {
    result.push(a);
    if (Array.isArray(a.children)) {
      result = result.concat(flat(a.children));
    }
  });
  return result;
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function getEntityByRoute(
  route: string,
  flatData: { segment: string; data: [] }[]
) {
  const parts = route.split("/").filter(Boolean);
  const lastSegment = parts[parts.length - 1];
  return flatData.find((item) => item.segment === lastSegment)?.data;
}

export { flat, formatCurrency, getEntityByRoute };
