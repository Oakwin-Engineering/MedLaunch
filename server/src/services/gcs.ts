import { Storage } from "@google-cloud/storage";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const storage = new Storage();
const mkdir = promisify(fs.mkdir);
const rmdir = promisify(fs.rm);

/**
 * Downloads all objects from a GCS bucket to a local directory
 */
export async function downloadBucket(bucketName: string): Promise<void> {
  const localDestDir = "data";

  // Remove the data directory to ensure a clean download
  try {
    await rmdir(localDestDir, { recursive: true, force: true });
  } catch (err) {
    console.error(`Failed to remove existing data directory: ${err}`);
  }

  // Create base directory
  await mkdir(localDestDir, { recursive: true });

  const bucket = storage.bucket(bucketName);
  const [files] = await bucket.getFiles();

  for (const file of files) {
    // Skip if this is a directory
    if (file.name.endsWith("/")) {
      continue;
    }

    // Construct the full local path for the file
    const localPath = path.join(localDestDir, file.name);

    // Create parent directories
    await mkdir(path.dirname(localPath), { recursive: true });

    // Download the file
    await file.download({ destination: localPath });
    console.log(`Downloaded: ${localPath}`);
  }
}

/**
 * Uploads data to a GCS bucket
 */
export async function uploadFileToBucket(
  bucketName: string,
  objectName: string,
  data: object
): Promise<void> {
  const bucket = storage.bucket(bucketName);

  // Check if the bucket exists, if not create it
  try {
    await bucket.exists();
  } catch (err) {
    console.log(`Bucket ${bucketName} does not exist, creating it...`);
    const projectId = process.env.PROJECT_ID;
    if (!projectId) {
      throw new Error("PROJECT_ID environment variable is not set");
    }
    await storage.createBucket(bucketName, {
      location: "US",
    });
  }

  // Upload the object
  const file = bucket.file(objectName);
  await file.save(JSON.stringify(data), {
    contentType: "application/json",
  });

  console.log(`Uploaded ${objectName} to ${bucketName}`);
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
