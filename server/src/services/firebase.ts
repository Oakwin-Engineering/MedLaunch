import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const mkdir = promisify(fs.mkdir);
const rmdir = promisify(fs.rm);

// Initialize Firebase Admin with Application Default Credentials
const app = initializeApp({
  credential: applicationDefault(),
  storageBucket: "medlaunch-8f4c7.firebasestorage.app",
});

const bucket = getStorage().bucket();

/**
 * Gets the Firestore instance for a specific customer database
 * @param customerId - The customer ID (e.g., "uhealth", "vitalcare")
 * @returns Firestore instance for that customer's database
 */
function getCustomerDb(customerId: string) {
  return getFirestore(app, customerId);
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
 * Stores a hierarchical node in Firestore (works for any hierarchy structure)
 * @param customerId - The customer ID
 * @param nodeData - The node data to store
 */
export async function storeHierarchyNode(
  customerId: string,
  nodeData: {
    id: string;
    label: string;
    type: string; // 'state', 'division', 'location', 'provider', etc.
    parentId?: string | null;
    year: string;
    data: any;
  }
): Promise<void> {
  try {
    const db = getCustomerDb(customerId);

    await db
      .collection("nodes")
      .doc(`${nodeData.id}_${nodeData.year}`)
      .set({
        id: nodeData.id,
        label: nodeData.label,
        type: nodeData.type,
        parentId: nodeData.parentId || null,
        year: nodeData.year,
        data: nodeData.data,
        updatedAt: new Date().toISOString(),
      });
  } catch (err) {
    throw new Error(`Failed to store ${nodeData.type} node: ${err}`);
  }
}

/**
 * Recursively stores a hierarchy tree in Firestore
 * Works for any depth and structure
 * @param customerId - The customer ID
 * @param nodes - Array of nodes to store
 * @param year - The year of the data
 * @param parentId - The parent node ID (null for root nodes)
 */
async function storeNodesRecursively(
  customerId: string,
  nodes: any[],
  year: string,
  parentId: string | null
): Promise<void> {
  for (const node of nodes) {
    // Skip special aggregation nodes
    if (node.id === "all-providers") {
      continue;
    }

    // Store this node (type comes from the node itself)
    await storeHierarchyNode(customerId, {
      id: node.id,
      label: node.label,
      type: node.type,
      parentId,
      year,
      data: node.data,
    });

    // Recursively store children if they exist
    if (node.children && node.children.length > 0) {
      await storeNodesRecursively(
        customerId,
        node.children,
        year,
        node.id
      );
    }
  }
}

/**
 * Stores complete hierarchy for a customer and year in Firestore
 * @param customerId - The customer ID
 * @param year - The year of the data
 * @param hierarchyData - The root nodes of the hierarchy
 */
export async function storeCompleteHierarchy(
  customerId: string,
  year: string,
  hierarchyData: any[]
): Promise<void> {
  console.log(`\n📦 Storing ${year} hierarchy in Firestore...`);

  // Store all nodes recursively (type comes from each node)
  await storeNodesRecursively(customerId, hierarchyData, year, null);

  console.log(`✅ Stored complete hierarchy for ${year}`);
}

/**
 * Stores all dashboard data in Firestore
 * Clears existing data and stores hierarchy, rankings, operational, and financial metrics
 * @param customerId - The customer ID
 * @param dashboardData - Complete dashboard data from transformers
 */
export async function storeAllDashboardData(
  customerId: string,
  dashboardData: any
): Promise<void> {
  console.log(`\n🔄 Starting Firestore storage for ${customerId}...`);

  // Clear existing Firestore data before storing new data
  await clearCustomerFirestoreData(customerId);

  // Extract dashboard data
  const providerPerformance = dashboardData.providerPerformance;
  const providerRankings = dashboardData.providerRankings;
  const operational = dashboardData.operational;
  const financial = dashboardData.financial;

  // Store each year's data in Firestore
  for (const year in providerPerformance) {
    console.log(`  📅 Storing ${year} data...`);

    // Store hierarchy nodes (type comes from each node)
    await storeCompleteHierarchy(customerId, year, providerPerformance[year]);

    // Store provider rankings for this year
    if (providerRankings && providerRankings[year]) {
      await storeProviderRankings(customerId, year, providerRankings[year]);
    }

    // Store operational metrics for this year
    if (operational && operational[year]) {
      await storeOperationalMetrics(customerId, year, operational[year]);
    }
  }

  // Store financial metrics (not year-specific)
  if (financial && Object.keys(financial).length > 0) {
    await storeFinancialMetrics(customerId, financial);
  }

  console.log(`✅ Completed Firestore storage for ${customerId}\n`);
}

/**
 * Retrieves all dashboard data from Firestore
 * @param customerId - The customer ID
 * @returns Complete dashboard data with all metrics
 */
export async function getAllDashboardData(customerId: string): Promise<any> {
  try {
    const db = getCustomerDb(customerId);

    // Fetch all collections in parallel
    const [nodesSnap, rankingsSnap, operationalSnap, financialSnap] =
      await Promise.all([
        db.collection("nodes").get(),
        db.collection("providerRankings").get(),
        db.collection("operationalMetrics").get(),
        db.collection("financialMetrics").get(),
      ]);

    // Build hierarchy from nodes
    const hierarchiesByYear = await buildHierarchyFromNodes(nodesSnap);

    // Build rankings by year
    const rankingsByYear: Record<string, any> = {};
    rankingsSnap.forEach((doc) => {
      const data = doc.data();
      rankingsByYear[data.year] = data;
    });

    // Build operational metrics by year
    const operationalByYear: Record<string, any> = {};
    operationalSnap.forEach((doc) => {
      const data = doc.data();
      operationalByYear[data.year] = data;
    });

    // Get financial data
    let financialData = {};
    financialSnap.forEach((doc) => {
      financialData = doc.data();
    });

    return {
      providerPerformance: hierarchiesByYear,
      providerRankings: rankingsByYear,
      operational: operationalByYear,
      financial: financialData,
    };
  } catch (err) {
    throw new Error(`Failed to retrieve dashboard data from Firestore: ${err}`);
  }
}

/**
 * Builds hierarchy from nodes snapshot
 * @param nodesSnap - Firestore snapshot of nodes collection
 * @returns Object with years as keys, each containing reconstructed hierarchy
 */
function buildHierarchyFromNodes(nodesSnap: any): Record<string, any[]> {
  // Group nodes by year
  const nodesByYear: Record<string, any[]> = {};

  nodesSnap.forEach((doc: any) => {
    const data = doc.data();
    const year = data.year;

    if (!nodesByYear[year]) {
      nodesByYear[year] = [];
    }

    nodesByYear[year].push(data);
  });

  // Build hierarchy for each year
  const hierarchiesByYear: Record<string, any[]> = {};

  for (const [year, nodes] of Object.entries(nodesByYear)) {
    // Build a map of all nodes with children arrays
    const nodesMap = new Map();

    nodes.forEach((data: any) => {
      nodesMap.set(data.id, {
        id: data.id,
        label: data.label,
        type: data.type,
        data: data.data,
        children: [],
      });
    });

    // Build hierarchy by connecting children to parents
    const rootNodes: any[] = [];

    nodes.forEach((nodeData: any) => {
      const node = nodesMap.get(nodeData.id);

      if (nodeData.parentId && nodesMap.has(nodeData.parentId)) {
        // Has a parent - add to parent's children
        const parent = nodesMap.get(nodeData.parentId);
        parent.children.push(node);
      } else {
        // No parent or parent not found - this is a root node
        rootNodes.push(node);
      }
    });

    hierarchiesByYear[year] = rootNodes;
  }

  return hierarchiesByYear;
}

/**
 * Deletes all Firestore data for a specific customer
 * @param customerId - The customer ID (e.g., "uhealth", "vitalcare")
 */
export async function clearCustomerFirestoreData(
  customerId: string
): Promise<void> {
  try {
    console.log(`🗑️  Clearing Firestore data for ${customerId}...`);

    const db = getCustomerDb(customerId);
    const collections = [
      "nodes",
      "providerRankings",
      "operationalMetrics",
      "financialMetrics",
    ];

    for (const collectionName of collections) {
      const collectionRef = db.collection(collectionName);

      // Get all documents in the collection
      const snapshot = await collectionRef.get();

      if (snapshot.empty) {
        console.log(`  ℹ️  Collection ${collectionName} is already empty`);
        continue;
      }

      // Delete in batches of 500 (Firestore limit)
      const batchSize = 500;
      let deletedCount = 0;

      while (true) {
        const batch = db.batch();
        const docs = await collectionRef.limit(batchSize).get();

        if (docs.empty) break;

        docs.forEach((doc) => {
          batch.delete(doc.ref);
          deletedCount++;
        });

        await batch.commit();
      }

      console.log(
        `  ✅ Deleted ${deletedCount} documents from ${collectionName}`
      );
    }

    console.log(`✅ Cleared all Firestore data for ${customerId}`);
  } catch (err) {
    console.error(`Failed to clear Firestore data for ${customerId}: ${err}`);
    throw new Error(`Failed to clear Firestore data: ${err}`);
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
    const db = getCustomerDb(customerId);
    const batch = db.batch();
    let operationCount = 0;

    for (const provider of providerData) {
      const docRef = db.collection("providers").doc(provider.id);
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
 * Stores detailed metrics for any node type (provider, location, division, state)
 * @param customerId - The customer ID (e.g., "uhealth", "vitalcare")
 * @param year - The year of the data
 * @param nodeId - The node's unique ID
 * @param nodeLabel - The node's label/name
 * @param nodeType - The type of node (provider, location, division, state)
 * @param metrics - The full metrics object with monthly data
 */
export async function storeNodeMetrics(
  customerId: string,
  year: string,
  nodeId: string,
  nodeLabel: string,
  nodeType: string,
  metrics: any
): Promise<void> {
  try {
    const db = getCustomerDb(customerId);
    const docId = `${nodeId}_${year}`;
    await db
      .collection("nodeMetrics")
      .doc(docId)
      .set({
        nodeId,
        nodeLabel,
        nodeType,
        year,
        ...metrics,
        updatedAt: new Date().toISOString(),
      });
  } catch (err) {
    throw new Error(
      `Failed to store metrics for ${nodeType} ${nodeId}: ${err}`
    );
  }
}

/**
 * @deprecated Use storeNodeMetrics instead
 * Kept for backward compatibility with UHealth
 */
export async function storeProviderMetrics(
  customerId: string,
  year: string,
  providerId: string,
  providerName: string,
  metrics: any
): Promise<void> {
  return storeNodeMetrics(
    customerId,
    year,
    providerId,
    providerName,
    "provider",
    metrics
  );
}

/**
 * Stores provider rankings by year in Firestore
 * @param customerId - The customer ID
 * @param year - The year of the data
 * @param rankingsData - Provider rankings data
 */
export async function storeProviderRankings(
  customerId: string,
  year: string,
  rankingsData: any
): Promise<void> {
  try {
    const db = getCustomerDb(customerId);
    await db
      .collection("providerRankings")
      .doc(year)
      .set({
        year,
        ...rankingsData,
        updatedAt: new Date().toISOString(),
      });
  } catch (err) {
    throw new Error(`Failed to store provider rankings for ${year}: ${err}`);
  }
}

/**
 * Stores operational metrics by year in Firestore
 * @param customerId - The customer ID
 * @param year - The year of the data
 * @param operationalData - Operational metrics data
 */
export async function storeOperationalMetrics(
  customerId: string,
  year: string,
  operationalData: any
): Promise<void> {
  try {
    const db = getCustomerDb(customerId);
    await db
      .collection("operationalMetrics")
      .doc(year)
      .set({
        year,
        ...operationalData,
        updatedAt: new Date().toISOString(),
      });
  } catch (err) {
    throw new Error(`Failed to store operational metrics for ${year}: ${err}`);
  }
}

/**
 * Stores financial metrics in Firestore
 * @param customerId - The customer ID
 * @param financialData - Financial metrics data (may not be year-specific)
 */
export async function storeFinancialMetrics(
  customerId: string,
  financialData: any
): Promise<void> {
  try {
    const db = getCustomerDb(customerId);
    await db
      .collection("financialMetrics")
      .doc("summary")
      .set({
        ...financialData,
        updatedAt: new Date().toISOString(),
      });
  } catch (err) {
    throw new Error(`Failed to store financial metrics: ${err}`);
  }
}
