import { PUBLIC_API_URL } from "$env/static/public";

type Slug = {
  customerID: string;
};

export const load = async ({ params }: { params: Slug }) => {
  const { customerID } = params;

  try {
    const res = await fetch(`${PUBLIC_API_URL}/table-data/${customerID}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.statusText}`);
    }
    const allDashboards = await res.json();

    return {
      allDashboards,
      customerID,
    };
  } catch (error) {
    console.error("Error loading data:", error);
    return {
      error: "Could not load data.",
    };
  }
};
