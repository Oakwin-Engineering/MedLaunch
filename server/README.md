# MedLaunch Server

## Overview

This Go project provides utilities for downloading files and folders from Google Cloud Storage (GCS). It is designed to run both locally (for development) and in production (on Google Cloud Run).

## Features

- Download individual files or entire folders from GCS buckets
- Uses the official Google Cloud Storage Go SDK
- Supports both local development and production deployments

---

## Authentication

### Local Development

To access GCS from your local machine, you must authenticate using the Google Cloud SDK. This ensures your Go application can interact with GCS using your user credentials.

**Steps:**

1. Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) if you haven't already.
2. Authenticate your CLI and generate application default credentials:
   ```sh
   gcloud auth application-default login
   ```
   - This opens a browser window. Log in with your Google account that has access to the GCS bucket.
   - This creates the credentials file at `~/.config/gcloud/application_default_credentials.json`.
3. (Optional) Set your active project:
   ```sh
   gcloud config set project YOUR_PROJECT_ID
   ```

### Production (Google Cloud Run)

In production, authentication is handled automatically using a [service account](https://cloud.google.com/iam/docs/service-accounts) attached to your Cloud Run service. Make sure the service account has the `roles/storage.objectViewer` (or broader) permissions for your GCS bucket.

**Recommended steps:**

1. Create or select a service account in your GCP project.
2. Grant it the `Storage Object Viewer` role:
   ```sh
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:YOUR_SERVICE_ACCOUNT@gcp-project.iam.gserviceaccount.com" \
     --role="roles/storage.objectViewer"
   ```
3. Deploy your Cloud Run service with this service account:
   ```sh
   gcloud run deploy YOUR_SERVICE_NAME \
     --image gcr.io/YOUR_PROJECT_ID/YOUR_IMAGE \
     --service-account YOUR_SERVICE_ACCOUNT@gcp-project.iam.gserviceaccount.com
   ```

---

## Setup & Running Locally

2. **Install dependencies:**
   ```sh
   go mod tidy
   ```
3. **Authenticate with Google Cloud (see above).**
4. **Run the project:**
   ```sh
   go run main.go
   ```
   - Edit `main.go` to specify the bucket, object, or folder you want to download.

---

## Environment Variables (Optional)

You can use environment variables to configure bucket names, objects, or credentials for more flexibility.

---

## Troubleshooting

- **Permission errors:** Make sure your account or service account has access to the bucket/object.
- **Authentication errors:** Ensure you have run `gcloud auth application-default login` locally, or that Cloud Run has the correct service account.
- **SDK not found:** Make sure the Google Cloud SDK is installed and in your `PATH` if using `gcloud` CLI commands.

---

## References

- [Google Cloud Storage Go SDK](https://pkg.go.dev/cloud.google.com/go/storage)
- [Google Cloud Authentication Guide](https://cloud.google.com/docs/authentication/getting-started)
- [Cloud Run Service Accounts](https://cloud.google.com/run/docs/securing/service-identity)

---

Feel free to reach out or open an issue if you encounter any problems!
