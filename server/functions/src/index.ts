/**
 * Scheduled Cloud Functions for MedLaunch ETL Process
 * Triggers ETL for VitalCare and UHealth at midnight (5 minutes apart)
 */

import { setGlobalOptions } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";

// Set global options for cost control
setGlobalOptions({ maxInstances: 10 });

const SERVER_URL = "https://medlaunch-server-599586001071.us-central1.run.app";

/**
 * Scheduled function to trigger VitalCare ETL at midnight (00:00 EST)
 * Runs daily at midnight Eastern Time
 */
export const triggerVitalCareETL = onSchedule(
  {
    schedule: "0 0 * * *", // Every day at midnight
    timeZone: "America/New_York", // EST/EDT
    memory: "256MiB",
    timeoutSeconds: 540, // 9 minutes timeout
  },
  async (event) => {
    logger.info("Starting VitalCare ETL trigger at midnight");

    try {
      const response = await fetch(`${SERVER_URL}/trigger-etl/vitalcare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `VitalCare ETL failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.text();
      logger.info("VitalCare ETL completed successfully", { result });
    } catch (error) {
      logger.error("VitalCare ETL failed", { error });
      throw error;
    }
  }
);

/**
 * Scheduled function to trigger UHealth ETL at 00:05 EST (5 minutes after VitalCare)
 * Runs daily at 12:05 AM Eastern Time
 */
export const triggerUHealthETL = onSchedule(
  {
    schedule: "5 0 * * *", // Every day at 12:05 AM
    timeZone: "America/New_York", // EST/EDT
    memory: "256MiB",
    timeoutSeconds: 540, // 9 minutes timeout
  },
  async (event) => {
    logger.info("Starting UHealth ETL trigger at 12:05 AM");

    try {
      const response = await fetch(`${SERVER_URL}/trigger-etl/uhealth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `UHealth ETL failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.text();
      logger.info("UHealth ETL completed successfully", { result });
    } catch (error) {
      logger.error("UHealth ETL failed", { error });
      throw error;
    }
  }
);
