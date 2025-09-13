# MedLaunch Project Overview

## 1. Project Purpose

MedLaunch is a full-stack web application designed for processing, analyzing, and visualizing medical-financial data for different healthcare clients. The application provides a simple interface for triggering complex data pipelines and viewing the results in a structured, hierarchical dashboard.

The core functionality revolves around an ETL (Extract, Transform, Load) process that takes raw medical data (in CSV format), performs customer-specific transformations and aggregations, and then presents the processed data in an interactive web interface. This allows administrators to analyze key metrics related to facilities, providers, CPT codes, charges, payments, and more.

## 2. Technical Architecture

The project is a monorepo with two main components: a Go backend and a SvelteKit frontend.

### 2.1. Backend (Go)

The backend is a Go application responsible for the core business logic, including data processing, API handling, and interaction with external services.

- **API Server (`main.go`)**: Exposes a RESTful API using the `gorilla/mux` router. Key endpoints include:

  - `/trigger-etl/{customer-id}`: Initiates the data processing pipeline for a specific customer.
  - `/table-data/{customer-id}`: Serves the transformed JSON data to the frontend.
  - `/download-data/{customer-id}`: Triggers a download of the raw data.

- **ETL Pipeline (`etlUtils.go`, `uhealth.go`, `vitalcare.go`)**: This is the heart of the backend. It reads raw CSV files containing financial and medical data, performs complex transformations, and aggregates the data. The logic is customized for each client (e.g., `uHealthTransform` and `vitalCareTransform`), demonstrating a multi-tenant design.

- **Google Cloud Storage Integration (`gcs.go`)**: The application uses GCS for data storage. The backend downloads raw data from a `-pretransformed` bucket and uploads the processed JSON to a `-transformed` bucket.

- **Generative AI (`gemini.go`)**: The project integrates with Google's Gemini AI to perform tasks like name matching, which helps in cleaning and standardizing the data.

- **Dependencies (`go.mod`)**: Key libraries include:

  - `cloud.google.com/go/storage`: For GCS integration.
  - `github.com/gorilla/mux`: For HTTP routing.
  - `google.golang.org/genai`: For interacting with the Gemini AI.

- **Containerization (`server/Dockerfile`)**: The Go application is containerized using a multi-stage Docker build, resulting in a lightweight, production-ready image based on Alpine Linux.

### 2.2. Frontend (SvelteKit)

The frontend is a modern, reactive web application built with SvelteKit, providing a user-friendly interface for interacting with the backend.

- **Main Dashboard (`+page.svelte`)**: The entry point of the application, displaying a list of customers and allowing an admin to trigger the ETL process for each.

- **Customer-Specific View (`[customerID]/+page.svelte`)**: A dynamic route that displays the processed data for a specific customer. It features:

  - A hierarchical sidebar (`Sidebar.svelte`) for navigating the data structure (facilities and providers).
  - A table view (`Table.svelte`) to display detailed metrics for the selected node in the hierarchy.

- **Data Loading (`[customerID]/+page.ts`)**: The `load` function in this file fetches the processed data from the backend's `/table-data/{customer-id}` endpoint when the page is loaded.

- **Styling**: The UI is styled with Tailwind CSS and uses `flowbite-svelte` for UI components, creating a clean and modern look.

- **Dependencies (`package.json`)**: Key libraries include:

  - `svelte` and `@sveltejs/kit`: The core framework.
  - `tailwindcss`: For utility-first CSS.
  - `flowbite-svelte`: For pre-built UI components.

- **Containerization (`client/Dockerfile`)**: The SvelteKit application is also containerized using a multi-stage Docker build, creating a production-ready Node.js server to serve the application.

## 3. Overall Workflow

1.  **Trigger ETL**: An admin visits the main dashboard, selects a customer, and clicks the "Run ETL Process" button.
2.  **Backend Processing**: The frontend sends a `POST` request to the `/trigger-etl/{customer-id}` endpoint. The Go backend then:
    a. Downloads the latest raw data from the customer's GCS bucket.
    b. Processes and transforms the data using customer-specific logic.
    c. Uploads the resulting `facility-provider-hierarchy.json` file back to GCS.
3.  **View Dashboard**: The admin navigates to the customer-specific dashboard.
4.  **Data Fetching**: The SvelteKit frontend fetches the processed JSON data from the `/table-data/{customer-id}` endpoint.
5.  **Visualization**: The data is displayed in an interactive, hierarchical table, allowing the admin to explore the financial and operational metrics of different facilities and providers.
