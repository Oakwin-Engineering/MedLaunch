import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

const BASE_URL = "https://rcm-api.athelas.com";

// Replace these with your credentials
const USERNAME =
  process.env.ATHELAS_USERNAME || "daniel.oukolov@brightideasmed.com";
const PASSWORD = process.env.ATHELAS_PASSWORD || "_Georgia-tech2025!";

// Utility: Log and exit on error
const handleError = (message: string, error: any) => {
  console.error(`❌ ${message}`);
  if (axios.isAxiosError(error)) {
    console.error(error.response?.data || error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
};

// Step 1: Login and get bearer token
export async function getBearerToken(): Promise<string> {
  console.log("🔐 Logging in to get bearer token...");

  try {
    const response = await axios.post(
      `${BASE_URL}/v1/login/login`,
      {
        username: USERNAME,
        password: PASSWORD,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Some APIs return "token", some return "access_token"
    const token = response.data?.token || response.data?.access_token;
    if (!token) {
      console.error("❌ Login succeeded, but no token found in response.");
      console.log("Response body:", response.data);
      throw new Error("No token in response");
    }

    console.log("✅ Bearer token acquired");
    return token;
  } catch (error) {
    handleError("Failed to get bearer token", error);
    throw error;
  }
}

// Step 2: Request report
export async function requestReport(token: string) {
  console.log("📊 Requesting patient_collections_report...");

  const payload = {
    start_date: "2025-07-01",
    end_date: "2025-07-30",
    include_credits: "false",
    report_format: "csv",
    selected_tables: ["Detailed Collections"],
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/v1/reports/patient_collections_report`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "auth-scheme": "cognito",
        },
      }
    );

    const signedUri = response.data;
    if (!signedUri) throw new Error("No signed_uri found in response");
    console.log("✅ Report ready. Download URL received.");
    return signedUri;
  } catch (error) {
    handleError("Failed to request report", error);
    throw error;
  }
}

// Step 3: Download report file
export async function downloadReportFile(url: string) {
  console.log("⬇️ Downloading report...");
  const filePath = path.resolve("./patient_collections_report.zip");

  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, response.data);
    console.log(`✅ Report downloaded: ${filePath}`);
  } catch (error) {
    handleError("Failed to download report file", error);
  }
}
