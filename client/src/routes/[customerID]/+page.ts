import { env } from "$env/dynamic/public";

type Slug = {
  customerID: string;
};

const apiUrl = env.PUBLIC_API_URL;

export const load = async ({ params }: { params: Slug }) => {
  const { customerID } = params;

  try {
    const res = await fetch(`${apiUrl}/table-data/${customerID}`);
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
