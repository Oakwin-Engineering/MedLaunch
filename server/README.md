# MedLaunch Server v2 (TypeScript/Express/Node.js)

## Overview

This is a TypeScript/Express/Node.js conversion of the original Go-based MedLaunch server. It provides ETL (Extract, Transform, Load) utilities for downloading files from Google Cloud Storage (GCS), transforming healthcare data, and uploading results back to GCS.

## Features

- Download data from GCS buckets
- Transform healthcare data for VitalCare and UHealth customers
- Upload transformed JSON data to GCS
- RESTful API endpoints for ETL operations
- TypeScript for type safety
- Express.js for HTTP server

---

## Prerequisites

- Node.js 18+ and npm
- Google Cloud SDK (for local development)
- Access to GCS buckets

---

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `PROJECT_ID`: Your GCP project ID
   - `LOG_MODE`: Set to `debug` for verbose logging
   - `PORT`: Server port (default: 8080)

---

## Authentication

### Local Development

To access GCS from your local machine, authenticate using the Google Cloud SDK:

```bash
gcloud auth application-default login
```

This creates credentials at `~/.config/gcloud/application_default_credentials.json`.

### Production (Google Cloud Run)

In production, authentication is handled automatically using a service account attached to your Cloud Run service. Ensure the service account has the `roles/storage.objectViewer` and `roles/storage.objectCreator` permissions.

---

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Build and Run
```bash
npm run build
npm start
```

---

## API Endpoints

### 1. Trigger Full ETL Process
```
GET /trigger-etl/:customer-id
```
Downloads data from GCS, transforms it, and uploads the result.

**Example:**
```bash
curl http://localhost:8080/trigger-etl/vitalcare
```

### 2. Trigger ETL Test (No Download)
```
GET /trigger-etl-test/:customer-id
```
Transforms local data and uploads the result (skips download step).

**Example:**
```bash
curl http://localhost:8080/trigger-etl-test/vitalcare
```

### 3. Get Transformed Data
```
GET /table-data/:customer-id
```
Retrieves the transformed JSON data from GCS.

**Example:**
```bash
curl http://localhost:8080/table-data/vitalcare
```

### 4. Download Data Only
```
GET /download-data/:customer-id
```
Downloads data from GCS without transformation.

**Example:**
```bash
curl http://localhost:8080/download-data/vitalcare
```

---

## Project Structure

```
server_v2/
├── src/
│   ├── index.ts                 # Main Express server
│   ├── types/
│   │   └── common.ts            # TypeScript interfaces and types
│   ├── services/
│   │   ├── gcs.ts               # Google Cloud Storage operations
│   │   └── nameMatching.ts     # Fuzzy name matching logic
│   ├── etl/
│   │   ├── etlVitalcare.ts     # VitalCare CSV processing
│   │   └── etlUhealth.ts       # UHealth CSV processing
│   └── transformers/
│       ├── vitalcare.ts         # VitalCare data transformation
│       └── uhealth.ts           # UHealth data transformation
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## Data Flow

1. **Download**: Data is downloaded from `{customer}-pretransformed` GCS bucket
2. **Transform**: CSV files are processed and transformed into hierarchical JSON
3. **Upload**: Transformed data is uploaded to `{customer}-transformed` GCS bucket
4. **Cleanup**: Local data directory is removed

---

## Supported Customers

- `vitalcare`: VitalCare healthcare data
- `uhealth`: UHealth healthcare data

---

## Environment Variables

- `PORT`: Server port (default: 8080)
- `PROJECT_ID`: GCP project ID for bucket creation
- `LOG_MODE`: Set to `debug` for detailed logging

---

## Deployment

### Docker Build
```bash
docker build -t medlaunch-server .
docker run -p 8080:8080 medlaunch-server
```

### Google Cloud Run
```bash
gcloud run deploy medlaunch-server \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Differences from Go Version

- Uses Express.js instead of Gorilla Mux
- Uses `csv-parser` for CSV processing
- Uses `jaro-winkler` for name matching (same algorithm as Go version)
- Async/await pattern instead of Go's error handling
- TypeScript for type safety

---

## Troubleshooting

- **Permission errors**: Ensure your GCP account has access to the buckets
- **Authentication errors**: Run `gcloud auth application-default login`
- **Module not found**: Run `npm install`
- **Port already in use**: Change the PORT in `.env`

---

## References

- [Google Cloud Storage Node.js SDK](https://cloud.google.com/nodejs/docs/reference/storage/latest)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

## License

ISC
