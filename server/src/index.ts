import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getBucketName } from "./types/common";
import {
  downloadFromFirebaseStorage,
  uploadHierarchyToStorage,
  getHierarchyFromStorage,
  deleteLocalData,
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
 * Main ETL endpoint - downloads data from Firebase Storage, transforms it, and uploads back to Firebase Storage
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
    const jsonData = await transformData(customerId);
    console.log("Data transformation complete");

    // Step 3: Upload transformed data to Firebase Storage
    console.log("Uploading transformed data to Firebase Storage...");
    await uploadHierarchyToStorage(customerId, jsonData);
    console.log("Data upload complete");

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
 * Test ETL endpoint - transforms data without downloading, uploads to Firebase Storage
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
      const jsonData = await transformData(customerId);
      console.log("Data transformation complete");

      // Step 2: Upload transformed data to Firebase Storage
      console.log("Uploading transformed data to Firebase Storage...");
      await uploadHierarchyToStorage(customerId, jsonData);
      console.log("Data upload complete");

      res.status(200).send("ETL process completed successfully");
    } catch (error) {
      console.error("Error in ETL process:", error);
      res.status(500).send(`Error in ETL process: ${error}`);
    }
  }
);

/**
 * Endpoint to retrieve transformed data from Firebase Storage
 */
app.get("/table-data/:customerId", async (req: Request, res: Response) => {
  try {
    const customerId = req.params.customerId;
    getBucketName(customerId); // Validate customer ID

    const data = await getHierarchyFromStorage(customerId);

    res.setHeader("Content-Type", "application/json");
    res.json(data);
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
 * Transform data based on customer ID
 */
async function transformData(clientName: string): Promise<object> {
  switch (clientName.toLowerCase()) {
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
