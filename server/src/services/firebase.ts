import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const mkdir = promisify(fs.mkdir);
const rmdir = promisify(fs.rm);

// Initialize Firebase Admin with Application Default Credentials
initializeApp({
  storageBucket: "medlaunch-8f4c7.firebasestorage.app",
});

const bucket = getStorage().bucket();

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
 * Uploads transformed data to Firebase Storage
 * @param customerId - The customer ID (e.g., "uhealth" or "vitalcare")
 * @param data - The transformed JSON data to store
 */
export async function uploadToFirestore(
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
 * Retrieves transformed data from Firebase Storage
 * @param customerId - The customer ID
 * @returns The parsed JSON data
 */
export async function getFromFirestore(customerId: string): Promise<any> {
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
