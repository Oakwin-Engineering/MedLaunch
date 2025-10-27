import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const mkdir = promisify(fs.mkdir);
const rmdir = promisify(fs.rm);

// Initialize Firebase Admin with Application Default Credentials
// This works automatically on Cloud Run with the attached service account
initializeApp({
  credential: applicationDefault(),
  storageBucket: "medlaunch-8f4c7.firebasestorage.app",
});

const bucket = getStorage().bucket();
const db = getFirestore();

/**
 * Gets collection name with customer prefix
 * @param customerId - The customer ID (e.g., "uhealth", "vitalcare")
 * @param collectionName - The base collection name
 * @returns Prefixed collection name
 */
function getCollectionName(customerId: string, collectionName: string): string {
  return `${customerId}_${collectionName}`;
}

/**
 * Downloads all files from Firebase Storage for a specific customer to a local directory
 * @param customerId - The customer ID (e.g., "vitalcare", "uhealth")
 */
export async function downloadFromFirebaseStorage(
  customerId: string
): Promise<void> {
  const localDestDir = "data";

  // Remove the data directory to ensure a clean download
  try {
    await rmdir(localDestDir, { recursive: true, force: true });
  } catch (err) {
    console.error(`Failed to remove existing data directory: ${err}`);
  }

  // Create base directory
  await mkdir(localDestDir, { recursive: true });

  // List all files with the customer prefix (e.g., "vitalcare/")
  const [files] = await bucket.getFiles({ prefix: `${customerId}/` });

  for (const file of files) {
    // Skip if this is a directory marker
    if (file.name.endsWith("/")) {
      continue;
    }

    // Remove the customer prefix from the path for local storage
    // e.g., "vitalcare/2022/file.csv" -> "2022/file.csv"
    const relativePath = file.name.replace(`${customerId}/`, "");
    const localPath = path.join(localDestDir, relativePath);

    // Create parent directories
    await mkdir(path.dirname(localPath), { recursive: true });

    // Download the file
    await file.download({ destination: localPath });
    console.log(`Downloaded: ${localPath}`);
  }
}

/**
 * Uploads transformed hierarchy data to Firebase Storage
 * @param customerId - The customer ID (e.g., "uhealth" or "vitalcare")
 * @param data - The transformed JSON data to store
 */
export async function uploadHierarchyToStorage(
  customerId: string,
  data: object
): Promise<void> {
  try {
    // Store in top-level transformed folder: {customerId}-transformed/
    const fileName = `${customerId}-transformed/hierarchy.json`;
    const file = bucket.file(fileName);

    // Upload the JSON data
    await file.save(JSON.stringify(data), {
      contentType: "application/json",
      metadata: {
        metadata: {
          updatedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`Uploaded data to Firebase Storage: ${fileName}`);
  } catch (err) {
    throw new Error(`Failed to upload to Firebase Storage: ${err}`);
  }
}

/**
 * Retrieves transformed hierarchy data from Firebase Storage
 * @param customerId - The customer ID
 * @returns The parsed JSON data
 */
export async function getHierarchyFromStorage(
  customerId: string
): Promise<any> {
  try {
    // Retrieve from top-level transformed folder: {customerId}-transformed/
    const fileName = `${customerId}-transformed/hierarchy.json`;
    const file = bucket.file(fileName);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`No data found for customer: ${customerId}`);
    }

    // Download the file content
    const [content] = await file.download();

    // Parse the JSON string back to an object
    return JSON.parse(content.toString());
  } catch (err) {
    throw new Error(`Failed to retrieve from Firebase Storage: ${err}`);
  }
}

/**
 * Deletes the specified local directory and all its contents
 */
export async function deleteLocalData(dirPath: string): Promise<void> {
  console.log(`Attempting to delete local data directory: ${dirPath}`);
  try {
    await rmdir(dirPath, { recursive: true, force: true });
    console.log(`Successfully deleted local data directory: ${dirPath}`);
  } catch (err) {
    throw new Error(`Failed to delete directory ${dirPath}: ${err}`);
  }
}

/**
 * Stores provider summary data in Firestore
 * @param customerId - The customer ID (e.g., "uhealth", "vitalcare")
 * @param year - The year of the data
 * @param providerData - Array of provider summaries with name and metrics
 */
export async function storeProviderSummaries(
  customerId: string,
  year: string,
  providerData: Array<{
    id: string;
    name: string;
    totalPatientCount?: number;
    totalRVUs?: number;
    totalCharges?: number;
    totalPayments?: number;
    totalPayroll?: number;
    totalOperatingProfit?: number;
  }>
): Promise<void> {
  try {
    const batch = db.batch();
    let operationCount = 0;

    for (const provider of providerData) {
      const docRef = db
        .collection(getCollectionName(customerId, "providers"))
        .doc(provider.id);
      batch.set(
        docRef,
        {
          name: provider.name,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      operationCount++;

      // Firestore batch limit is 500 operations
      if (operationCount >= 500) {
        await batch.commit();
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    console.log(
      `✅ Stored ${providerData.length} providers in Firestore (${customerId} database)`
    );
  } catch (err) {
    throw new Error(`Failed to store provider summaries: ${err}`);
  }
}

/**
 * Stores detailed provider metrics by year in Firestore
 * @param customerId - The customer ID (e.g., "uhealth", "vitalcare")
 * @param year - The year of the data
 * @param providerId - The provider's unique ID
 * @param providerName - The provider's name
 * @param metrics - The full metrics object with monthly data
 */
export async function storeProviderMetrics(
  customerId: string,
  year: string,
  providerId: string,
  providerName: string,
  metrics: any
): Promise<void> {
  try {
    const docId = `${providerId}_${year}`;
    await db
      .collection(getCollectionName(customerId, "providerMetrics"))
      .doc(docId)
      .set({
        providerId,
        providerName,
        year,
        ...metrics,
        updatedAt: new Date().toISOString(),
      });
  } catch (err) {
    throw new Error(
      `Failed to store metrics for provider ${providerId}: ${err}`
    );
  }
}

/**
 * Stores practice-wide summaries by year in Firestore
 * @param customerId - The customer ID (e.g., "uhealth", "vitalcare")
 * @param year - The year of the data
 * @param summaryData - The aggregated practice summary metrics
 */
export async function storePracticeSummary(
  customerId: string,
  year: string,
  summaryData: any
): Promise<void> {
  try {
    await db
      .collection(getCollectionName(customerId, "practiceSummaries"))
      .doc(year)
      .set({
        year,
        ...summaryData,
        updatedAt: new Date().toISOString(),
      });

    console.log(
      `✅ Stored practice summary for ${year} in Firestore (${customerId} database)`
    );
  } catch (err) {
    throw new Error(`Failed to store practice summary for ${year}: ${err}`);
  }
}
