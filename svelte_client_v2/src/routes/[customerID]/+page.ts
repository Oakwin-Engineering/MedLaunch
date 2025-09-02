type Slug = {
  customerID: string;
};

const apiUrl = import.meta.env.VITE_PUBLIC_API_URL;

export const load = async ({ params }: { params: Slug }) => {
  const { customerID } = params;

  console.log(apiUrl);

  try {
    const res = await fetch(`${apiUrl}/table-data/${customerID}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.statusText}`);
    }
    const data = await res.json();

    return {
      ...data,
    };
  } catch (error) {
    console.error("Error loading data:", error);
    return {
      error: "Could not load data.",
    };
  }
};
