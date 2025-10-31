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
 * Stores multiple hierarchical nodes in Firestore using batch operations
 * @param customerId - The customer ID
 * @param nodesData - Array of node data to store
 */
export async function storeHierarchyNodesBatch(
  customerId: string,
  nodesData: {
    id: string;
    label: string;
    type: string; // 'state', 'division', 'location', 'provider', etc.
    parentId?: string | null;
    year: string;
    data: any;
  }[]
): Promise<void> {
  try {
    const db = getCustomerDb(customerId);

    // Firestore batch limit is 500 operations
    const BATCH_SIZE = 500;

    for (let i = 0; i < nodesData.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = nodesData.slice(i, i + BATCH_SIZE);

      for (const nodeData of chunk) {
        const docRef = db
          .collection("nodes")
          .doc(`${nodeData.id}_${nodeData.year}`);

        batch.set(docRef, {
          id: nodeData.id,
          label: nodeData.label,
          type: nodeData.type,
          parentId: nodeData.parentId || null,
          year: nodeData.year,
          data: nodeData.data,
          updatedAt: new Date().toISOString(),
        });
      }

      await batch.commit();
      console.log(
        `✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: Stored ${
          chunk.length
        } nodes`
      );
    }
  } catch (err) {
    throw new Error(`Failed to store nodes in batch: ${err}`);
  }
}

/**
 * Stores a single hierarchical node in Firestore (legacy function for compatibility)
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
  return storeHierarchyNodesBatch(customerId, [nodeData]);
}

/**
 * Flattens hierarchy tree into array for batch processing
 * @param nodes - Array of nodes to flatten
 * @param year - The year of the data
 * @param parentId - The parent node ID (null for root nodes)
 * @returns Flattened array of all nodes
 */
function flattenHierarchyNodes(
  nodes: any[],
  year: string,
  parentId: string | null
): {
  id: string;
  label: string;
  type: string;
  parentId: string | null;
  year: string;
  data: any;
}[] {
  const flattened: {
    id: string;
    label: string;
    type: string;
    parentId: string | null;
    year: string;
    data: any;
  }[] = [];

  function processNode(node: any, currentParentId: string | null) {
    // Store all-providers nodes at the top level
    const nodeParentId = node.id === "all-providers" ? null : currentParentId;

    flattened.push({
      id: node.id,
      label: node.label,
      type: node.type,
      parentId: nodeParentId,
      year,
      data: node.data,
    });

    // Recursively process children if they exist (skip for all-providers as it's a leaf node)
    if (
      node.children &&
      node.children.length > 0 &&
      node.id !== "all-providers"
    ) {
      for (const child of node.children) {
        processNode(child, node.id);
      }
    }
  }

  for (const node of nodes) {
    processNode(node, parentId);
  }

  return flattened;
}

/**
 * Recursively stores a hierarchy tree in Firestore (legacy function for compatibility)
 * Uses batch operations for performance
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
  const flattenedNodes = flattenHierarchyNodes(nodes, year, parentId);
  await storeHierarchyNodesBatch(customerId, flattenedNodes);
}

/**
 * Stores complete hierarchy for a customer and year in Firestore
 * Uses optimized batch operations for performance
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

  // Flatten hierarchy and store in batches for maximum performance
  const flattenedNodes = flattenHierarchyNodes(hierarchyData, year, null);
  console.log(`📊 Processing ${flattenedNodes.length} total nodes...`);

  await storeHierarchyNodesBatch(customerId, flattenedNodes);

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
 * @returns Complete dashboard data with all metrics, including AllScripts data
 */
export async function getAllDashboardData(customerId: string): Promise<any> {
  try {
    const db = getCustomerDb(customerId);

    // Fetch all collections in parallel (including AllScripts)
    const [
      nodesSnap,
      rankingsSnap,
      operationalSnap,
      financialSnap,
      allscriptsNodesSnap,
      allscriptsRankingsSnap,
      allscriptsOperationalSnap,
    ] = await Promise.all([
      db.collection("nodes").get(),
      db.collection("providerRankings").get(),
      db.collection("operationalMetrics").get(),
      db.collection("financialMetrics").get(),
      db.collection("allscripts_nodes").get(),
      db.collection("allscripts_providerRankings").get(),
      db.collection("allscripts_operationalMetrics").get(),
    ]);

    // Build hierarchy from nodes (Athelas data)
    const hierarchiesByYear = await buildHierarchyFromNodes(nodesSnap);

    // Build rankings by year (Athelas data)
    const rankingsByYear: Record<string, any> = {};
    rankingsSnap.forEach((doc) => {
      const data = doc.data();
      rankingsByYear[data.year] = data;
    });

    // Build operational metrics by year (Athelas data)
    const operationalByYear: Record<string, any> = {};
    operationalSnap.forEach((doc) => {
      const data = doc.data();
      operationalByYear[data.year] = data;
    });

    // Get financial data (Athelas data)
    let financialData = {};
    financialSnap.forEach((doc) => {
      financialData = doc.data();
    });

    // Build AllScripts hierarchy from nodes
    const allscriptsHierarchiesByYear = await buildHierarchyFromNodes(
      allscriptsNodesSnap
    );

    // Build AllScripts rankings by year
    const allscriptsRankingsByYear: Record<string, any> = {};
    allscriptsRankingsSnap.forEach((doc) => {
      const data = doc.data();
      allscriptsRankingsByYear[data.year] = data;
    });

    // Build AllScripts operational metrics by year
    const allscriptsOperationalByYear: Record<string, any> = {};
    allscriptsOperationalSnap.forEach((doc) => {
      const data = doc.data();
      allscriptsOperationalByYear[data.year] = data;
    });

    return {
      // Athelas data
      providerPerformance: hierarchiesByYear,
      providerRankings: rankingsByYear,
      operational: operationalByYear,
      financial: financialData,
      // AllScripts data
      allscripts: {
        providerPerformance: allscriptsHierarchiesByYear,
        providerRankings: allscriptsRankingsByYear,
        operational: allscriptsOperationalByYear,
        financial: {},
      },
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

/**
 * Stores AllScripts hierarchy for a customer and year in Firestore
 * Uses prefixed collection name: allscripts_nodes
 * @param customerId - The customer ID (should be "uhealth")
 * @param year - The year of the data
 * @param hierarchyData - The root nodes of the hierarchy
 */
export async function storeAllScriptsHierarchy(
  customerId: string,
  year: string,
  hierarchyData: any[]
): Promise<void> {
  console.log(`\n📦 Storing AllScripts ${year} hierarchy in Firestore...`);

  const db = getCustomerDb(customerId);
  const flattenedNodes = flattenHierarchyNodes(hierarchyData, year, null);
  console.log(`📊 Processing ${flattenedNodes.length} AllScripts nodes...`);

  // Firestore batch limit is 500 operations
  const BATCH_SIZE = 500;

  for (let i = 0; i < flattenedNodes.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = flattenedNodes.slice(i, i + BATCH_SIZE);

    for (const nodeData of chunk) {
      const docRef = db
        .collection("allscripts_nodes")
        .doc(`${nodeData.id}_${nodeData.year}`);

      batch.set(docRef, {
        id: nodeData.id,
        label: nodeData.label,
        type: nodeData.type,
        parentId: nodeData.parentId || null,
        year: nodeData.year,
        data: nodeData.data,
        updatedAt: new Date().toISOString(),
      });
    }

    await batch.commit();
    console.log(
      `✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: Stored ${
        chunk.length
      } AllScripts nodes`
    );
  }

  console.log(`✅ Stored complete AllScripts hierarchy for ${year}`);
}

/**
 * Stores AllScripts provider rankings by year in Firestore
 * Uses prefixed collection name: allscripts_providerRankings
 * @param customerId - The customer ID (should be "uhealth")
 * @param year - The year of the data
 * @param rankingsData - Provider rankings data
 */
export async function storeAllScriptsProviderRankings(
  customerId: string,
  year: string,
  rankingsData: any
): Promise<void> {
  try {
    const db = getCustomerDb(customerId);
    await db
      .collection("allscripts_providerRankings")
      .doc(year)
      .set({
        year,
        ...rankingsData,
        updatedAt: new Date().toISOString(),
      });
  } catch (err) {
    throw new Error(`Failed to store AllScripts provider rankings for ${year}: ${err}`);
  }
}

/**
 * Stores AllScripts operational metrics by year in Firestore
 * Uses prefixed collection name: allscripts_operationalMetrics
 * @param customerId - The customer ID (should be "uhealth")
 * @param year - The year of the data
 * @param operationalData - Operational metrics data
 */
export async function storeAllScriptsOperationalMetrics(
  customerId: string,
  year: string,
  operationalData: any
): Promise<void> {
  try {
    const db = getCustomerDb(customerId);
    await db
      .collection("allscripts_operationalMetrics")
      .doc(year)
      .set({
        year,
        ...operationalData,
        updatedAt: new Date().toISOString(),
      });
  } catch (err) {
    throw new Error(`Failed to store AllScripts operational metrics for ${year}: ${err}`);
  }
}

/**
 * Stores all AllScripts dashboard data in Firestore
 * Uses prefixed collections: allscripts_nodes, allscripts_providerRankings, allscripts_operationalMetrics
 * @param customerId - The customer ID (should be "uhealth")
 * @param dashboardData - Complete AllScripts dashboard data from transformers
 */
export async function storeAllScriptsDashboardData(
  customerId: string,
  dashboardData: any
): Promise<void> {
  console.log(`\n🔄 Starting AllScripts Firestore storage for ${customerId}...`);

  // Clear existing AllScripts Firestore data before storing new data
  await clearAllScriptsFirestoreData(customerId);

  // Extract dashboard data
  const providerPerformance = dashboardData.providerPerformance;
  const providerRankings = dashboardData.providerRankings;
  const operational = dashboardData.operational;

  // Store each year's data in Firestore
  for (const year in providerPerformance) {
    console.log(`  📅 Storing AllScripts ${year} data...`);

    // Store hierarchy nodes
    await storeAllScriptsHierarchy(customerId, year, providerPerformance[year]);

    // Store provider rankings for this year
    if (providerRankings && providerRankings[year]) {
      await storeAllScriptsProviderRankings(customerId, year, providerRankings[year]);
    }

    // Store operational metrics for this year
    if (operational && operational[year]) {
      await storeAllScriptsOperationalMetrics(customerId, year, operational[year]);
    }
  }

  console.log(`✅ Completed AllScripts Firestore storage for ${customerId}\n`);
}

/**
 * Clears all AllScripts Firestore data for a specific customer
 * @param customerId - The customer ID (should be "uhealth")
 */
export async function clearAllScriptsFirestoreData(
  customerId: string
): Promise<void> {
  try {
    console.log(`🗑️  Clearing AllScripts Firestore data for ${customerId}...`);

    const db = getCustomerDb(customerId);
    const collections = [
      "allscripts_nodes",
      "allscripts_providerRankings",
      "allscripts_operationalMetrics",
    ];

    for (const collectionName of collections) {
      const collectionRef = db.collection(collectionName);

      // Delete in batches of 250 (conservative, to stay well under Firestore's 500 doc limit)
      const batchSize = 250;
      let deletedCount = 0;

      while (true) {
        const docs = await collectionRef.limit(batchSize).get();

        if (docs.empty) break;

        const batch = db.batch();
        docs.forEach((doc) => {
          batch.delete(doc.ref);
          deletedCount++;
        });

        await batch.commit();
      }

      if (deletedCount > 0) {
        console.log(
          `  ✅ Deleted ${deletedCount} documents from ${collectionName}`
        );
      } else {
        console.log(`  ℹ️  Collection ${collectionName} is already empty`);
      }
    }

    console.log(`✅ Cleared all AllScripts Firestore data for ${customerId}`);
  } catch (err) {
    console.error(`Failed to clear AllScripts Firestore data for ${customerId}: ${err}`);
    throw new Error(`Failed to clear AllScripts Firestore data: ${err}`);
  }
}

/**
 * Exports all customer data as CSV string
 * @param customerId - The customer ID
 * @returns CSV string of all provider data
 */
export async function exportCustomerDataAsCSV(
  customerId: string
): Promise<string> {
  try {
    const db = getCustomerDb(customerId);

    // Get all nodes from the customer's database
    const nodesSnapshot = await db.collection("nodes").get();

    if (nodesSnapshot.empty) {
      throw new Error("No data found for this customer");
    }

    // Extract all unique metric keys and CPT codes from the data
    const allMetrics = new Set<string>();
    const allCptCodes = new Set<string>();
    const nodes: any[] = [];

    nodesSnapshot.forEach((doc) => {
      const nodeData = doc.data();
      nodes.push(nodeData);

      // Extract metric keys from the data object
      if (nodeData.data) {
        Object.keys(nodeData.data).forEach((key) => {
          if (key !== "cptCodes") {
            allMetrics.add(key);
          }
        });

        // Extract unique CPT codes
        const cptCodes = nodeData.data.cptCodes || [];
        cptCodes.forEach((cpt: any) => {
          if (cpt.code) {
            allCptCodes.add(cpt.code);
          }
        });
      }
    });

    // Sort metrics and CPT codes alphabetically for consistent column order
    const sortedMetrics = Array.from(allMetrics).sort();
    const sortedCptCodes = Array.from(allCptCodes).sort();

    // Create CSV header
    const headers = ["ID", "Label", "Type", "Parent ID", "Year"];

    // Add headers for each CPT code: Code with coding % and monthly values
    for (const cptCode of sortedCptCodes) {
      headers.push(`CPT ${cptCode}`);
      headers.push(`CPT ${cptCode} Values (Jan-Dec)`);
      headers.push(`CPT ${cptCode} Total`);
    }

    // Add headers for each metric: Values (Jan-Dec) and Total
    for (const metric of sortedMetrics) {
      headers.push(`${metric} Values (Jan-Dec)`);
      headers.push(`${metric} Total`);
    }

    let csvContent = headers.join(",") + "\n";

    // Process each node and create CSV row
    for (const node of nodes) {
      const row = [
        escapeCsvValue(node.id || ""),
        escapeCsvValue(node.label || ""),
        escapeCsvValue(node.type || ""),
        escapeCsvValue(node.parentId || ""),
        escapeCsvValue(node.year || ""),
      ];

      // Add CPT codes data
      const cptCodesArray = node.data?.cptCodes || [];
      const cptCodesMap = new Map();
      cptCodesArray.forEach((cpt: any) => {
        if (cpt.code) {
          cptCodesMap.set(cpt.code, cpt);
        }
      });

      for (const cptCode of sortedCptCodes) {
        const cptData = cptCodesMap.get(cptCode);
        if (cptData) {
          // Add coding percentage
          row.push(escapeCsvValue(cptData.coding || ""));

          // Add monthly values
          const values = cptData.values || [];
          const monthlyValuesStr = Array.from(
            { length: 12 },
            (_, i) => values[i]?.toString() || "0"
          ).join(";");
          row.push(escapeCsvValue(monthlyValuesStr));

          // Add total
          row.push(escapeCsvValue(cptData.total?.toString() || "0"));
        } else {
          // No data for this CPT code in this node
          row.push("");
          row.push("");
          row.push("");
        }
      }

      // Add metric data - all monthly values as semicolon-separated, then total
      for (const metric of sortedMetrics) {
        const metricData = node.data?.[metric];
        const values = metricData?.values || [];

        // Create semicolon-separated string of all 12 monthly values
        const monthlyValuesStr = Array.from(
          { length: 12 },
          (_, i) => values[i]?.toString() || "0"
        ).join(";");
        row.push(escapeCsvValue(monthlyValuesStr));

        // Add total
        row.push(escapeCsvValue(metricData?.total?.toString() || "0"));
      }

      csvContent += row.join(",") + "\n";
    }

    return csvContent;
  } catch (err) {
    throw new Error(`Failed to export customer data as CSV: ${err}`);
  }
}

/**
 * Helper function to escape CSV values
 * @param value - The value to escape
 * @returns Escaped CSV value
 */
function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
