import { PUBLIC_API_URL } from "$env/static/public";

type Slug = {
  customerID: string;
};

export const load = async ({ params }: { params: Slug }) => {
  const { customerID } = params;

  if (customerID === "favicon.ico") {
    return {
      tableData: [],
      customerID,
    };
  }

  try {
    const res = await fetch(`${PUBLIC_API_URL}/table-data/${customerID}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.statusText}`);
    }
    const tableData = await res.json();

    return {
      tableData,
      customerID,
    };
  } catch (error) {
    console.error("Error loading data:", error);
    return {
      error: "Could not load data.",
    };
  }
};
