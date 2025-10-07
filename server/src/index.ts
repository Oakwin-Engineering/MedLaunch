import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Storage } from "@google-cloud/storage";
import { getBucketName } from "./types/common";
import {
  downloadBucket,
  uploadFileToBucket,
  deleteLocalData,
} from "./services/gcs";
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
 * Main ETL endpoint - downloads data, transforms it, and uploads to GCS
 */
app.post("/trigger-etl/:customerId", async (req: Request, res: Response) => {
  console.log("Starting ETL process...");

  try {
    const customerId = req.params.customerId;
    const bucketName = getBucketName(customerId);

    // Step 1: Download data from GCS
    console.log("Downloading data from GCS...");
    await downloadBucket(`${bucketName}-pretransformed`);
    console.log("Data download complete");

    // Step 2: Transform data
    console.log("Transforming data...");
    const jsonData = await transformData(customerId);
    console.log("Data transformation complete");

    // Step 3: Upload transformed data to GCS
    console.log("Uploading transformed data...");
    const transformedBucketName = `${bucketName}-transformed`;
    const objectName = "facility-provider-hierarchy.json";
    await uploadFileToBucket(transformedBucketName, objectName, jsonData);
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
 * Test ETL endpoint - transforms data without downloading from GCS
 */
app.post(
  "/trigger-etl-test/:customerId",
  async (req: Request, res: Response) => {
    console.log("Starting ETL Without Download process...");

    try {
      const customerId = req.params.customerId;
      const bucketName = getBucketName(customerId);

      // Step 1: Transform data
      console.log("Transforming data...");
      const jsonData = await transformData(customerId);
      console.log("Data transformation complete");

      // Step 2: Upload transformed data to GCS
      console.log("Uploading transformed data...");
      const transformedBucketName = `${bucketName}-transformed`;
      const objectName = "facility-provider-hierarchy.json";
      await uploadFileToBucket(transformedBucketName, objectName, jsonData);
      console.log("Data upload complete");

      res.status(200).send("ETL process completed successfully");
    } catch (error) {
      console.error("Error in ETL process:", error);
      res.status(500).send(`Error in ETL process: ${error}`);
    }
  }
);

/**
 * Endpoint to retrieve transformed data from GCS
 */
app.get("/table-data/:customerId", async (req: Request, res: Response) => {
  try {
    const customerId = req.params.customerId;
    const bucketName = getBucketName(customerId);
    const transformedBucketName = `${bucketName}-transformed`;
    const objectName = "facility-provider-hierarchy.json";

    const storage = new Storage();
    const file = storage.bucket(transformedBucketName).file(objectName);

    const [data] = await file.download();

    res.setHeader("Content-Type", "application/json");
    res.send(data);
  } catch (error) {
    console.error("Error retrieving table data:", error);
    res.status(500).send(`Error retrieving table data: ${error}`);
  }
});

/**
 * Endpoint to download data from GCS
 */
app.get("/download-data/:customerId", async (req: Request, res: Response) => {
  console.log("Starting data download process...");

  try {
    const customerId = req.params.customerId;
    const bucketName = getBucketName(customerId);

    await downloadBucket(`${bucketName}-pretransformed`);
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
async function transformData(clientName: string): Promise<Buffer> {
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
