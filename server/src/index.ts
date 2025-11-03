import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getBucketName } from "./types/common";
import {
  downloadFromFirebaseStorage,
  getAllDashboardData,
  storeAllDashboardData,
  deleteLocalData,
  exportCustomerDataAsCSV,
} from "./services/firebase";
import { vitalCareTransform } from "./transformers/vitalcare";
import { uHealthTransform } from "./transformers/uhealth";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

/**
 * Main ETL endpoint - downloads data from Firebase Storage, transforms it, and stores in Firestore
 */
app.post("/trigger-etl/:customerId", async (req: Request, res: Response) => {
  console.log("Starting ETL process...");

  try {
    const customerId = req.params.customerId;
    getBucketName(customerId); // Validate customer ID

    // Step 1: Download data from Firebase Storage
    console.log("Downloading data from Firebase Storage...");
    await downloadFromFirebaseStorage(customerId);
    console.log("Data download complete");

    // Step 2: Transform data
    console.log("Transforming data...");
    const dashboardData = await transformData(customerId);
    console.log("Data transformation complete");

    // Step 3: Store in Firestore
    console.log("Storing data in Firestore...");
    await storeAllDashboardData(customerId, dashboardData);
    console.log("Firestore storage complete");

    // Step 4: Delete local data folder
    try {
      await deleteLocalData("data");
    } catch (err) {
      console.warn(`Warning: failed to delete local data: ${err}`);
    }

    res.status(200).send("ETL process completed successfully");
  } catch (error) {
    console.error("Error in ETL process:", error);
    res.status(500).send(`Error in ETL process: ${error}`);
  }
});

/**
 * Test ETL endpoint - transforms data without downloading and stores in Firestore
 */
app.post(
  "/trigger-etl-test/:customerId",
  async (req: Request, res: Response) => {
    console.log("Starting ETL Without Download process...");

    try {
      const customerId = req.params.customerId;
      getBucketName(customerId); // Validate customer ID

      // Step 1: Transform data
      console.log("Transforming data...");
      const dashboardData = await transformData(customerId);
      console.log("Data transformation complete");

      // Step 2: Store in Firestore
      console.log("Storing data in Firestore...");
      await storeAllDashboardData(customerId, dashboardData);
      console.log("Firestore storage complete");

      res.status(200).send("ETL process completed successfully");
    } catch (error) {
      console.error("Error in ETL process:", error);
      res.status(500).send(`Error in ETL process: ${error}`);
    }
  }
);

/**
 * Endpoint to retrieve all dashboard data from Firestore
 * Returns: providerPerformance, providerRankings, operational, financial
 */
app.get("/table-data/:customerId", async (req: Request, res: Response) => {
  try {
    const customerId = req.params.customerId;
    getBucketName(customerId); // Validate customer ID

    // Get all dashboard data from Firestore
    const dashboardData = await getAllDashboardData(customerId);

    res.setHeader("Content-Type", "application/json");
    res.json(dashboardData);
  } catch (error) {
    console.error("Error retrieving table data:", error);
    res.status(500).send(`Error retrieving table data: ${error}`);
  }
});

/**
 * Endpoint to download data from Firebase Storage
 */
app.get("/download-data/:customerId", async (req: Request, res: Response) => {
  console.log("Starting data download process...");

  try {
    const customerId = req.params.customerId;
    getBucketName(customerId); // Validate customer ID

    await downloadFromFirebaseStorage(customerId);
    console.log("Data download complete");

    res.status(200).send("Data download completed successfully");
  } catch (error) {
    console.error("Error downloading data:", error);
    res.status(500).send(`Error downloading data: ${error}`);
  }
});

/**
 * Endpoint to download customer data as multiple CSV files
 * Returns JSON with separate CSV strings for each data type
 * Supports Athelas, AllScripts, and ECW data sources
 */
app.get("/download-csv/:customerId", async (req: Request, res: Response) => {
  try {
    const customerId = req.params.customerId;
    getBucketName(customerId); // Validate customer ID

    console.log(`Generating CSVs for customer: ${customerId}`);

    // Customer data source configuration
    const CUSTOMER_DATA_SOURCES: Record<
      string,
      ("athelas" | "allscripts" | "ecw")[]
    > = {
      vitalcare: ["ecw"],
      uhealth: ["athelas", "allscripts"],
      demo: ["ecw"],
      // Default for all other customers
      default: ["athelas"],
    };

    const dataSources =
      CUSTOMER_DATA_SOURCES[customerId] || CUSTOMER_DATA_SOURCES.default;

    const result: any = {
      success: true,
      athelas: null,
      allscripts: null,
      ecw: null,
    };

    // Generate CSV files for each data source
    for (const dataSource of dataSources) {
      try {
        const csvData = await exportCustomerDataAsCSV(customerId, dataSource);
        result[dataSource] = {
          cptCodes: csvData.cptCodes,
          financial: csvData.financial,
          payroll: csvData.payroll,
          rvu: csvData.rvu,
        };
      } catch (error) {
        // Silently handle missing data sources
      }
    }

    console.log(`✅ CSV export completed for ${customerId}`);

    // Return JSON with all CSV files
    res.json(result);
  } catch (error) {
    console.error("Error generating CSVs:", error);
    res.status(500).json({
      success: false,
      error: `Error generating CSVs: ${error}`,
    });
  }
});

/**
 * Transform data based on customer ID
 * Only handles transformation, does not store to Firestore
 */
async function transformData(clientName: string): Promise<object> {
  const customerId = clientName.toLowerCase();

  switch (customerId) {
    case "uhealth":
      return await uHealthTransform();
    case "vitalcare":
      return await vitalCareTransform();
    case "demo":
      // Demo account can use vital care logic
      return await vitalCareTransform();
    default:
      throw new Error("No customer name sent in");
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Starting server on :${PORT} ....`);
});
