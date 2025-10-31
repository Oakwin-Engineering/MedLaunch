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
 * Endpoint to download customer data as CSV
 */
app.get("/download-csv/:customerId", async (req: Request, res: Response) => {
  try {
    const customerId = req.params.customerId;
    getBucketName(customerId); // Validate customer ID

    console.log(`Generating CSV for customer: ${customerId}`);

    // Generate CSV from customer data
    const csvData = await exportCustomerDataAsCSV(customerId);

    console.log(`CSV generated successfully for customer: ${customerId}`);

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${customerId}-data.csv"`
    );
    res.send(csvData);
  } catch (error) {
    console.error("Error generating CSV:", error);
    res.status(500).send(`Error generating CSV: ${error}`);
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
    default:
      throw new Error("No customer name sent in");
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Starting server on :${PORT} ....`);
});
