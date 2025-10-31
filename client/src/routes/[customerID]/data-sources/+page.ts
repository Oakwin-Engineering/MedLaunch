import type { PageLoad } from "./$types";
import { PUBLIC_API_URL } from "$env/static/public";

type Slug = {
  customerID: string;
};

export const load: PageLoad = async ({ params }: { params: Slug }) => {
  const { customerID } = params;

  try {
    // Fetch CSV data from the backend
    const response = await fetch(
      `${PUBLIC_API_URL}/download-csv/${customerID}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV data: ${response.statusText}`);
    }

    const csvData = await response.text();

    return {
      csvData,
      customerID,
      error: null,
    };
  } catch (error) {
    console.error("Error loading CSV data:", error);

    return {
      csvData: "",
      customerID,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
