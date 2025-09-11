// Sample storage-quickstart creates a Google Cloud Storage bucket.
package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"cloud.google.com/go/storage"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	// Load environment variables
	godotenv.Load()

	router := mux.NewRouter()

	// Register handlers with the mux router
	router.HandleFunc("/trigger-etl/{customer-id}", triggerETL)
	router.HandleFunc("/trigger-etl-test/{customer-id}", triggerETLTest)
	router.HandleFunc("/table-data/{customer-id}", tableDataHandler)
	router.HandleFunc("/upload-bucket/{customer-id}", uploadBucketHandler)

	// Enable CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
	})

	// Wrap the router with the CORS handler
	handler := c.Handler(router)

	log.Println("Starting server on :8080 ...")

	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func triggerETL(w http.ResponseWriter, r *http.Request) {
	log.Println("Starting ETL process...")

	// Get customer ID from URL parameters and map to bucket name
	vars := mux.Vars(r)
	customerId := vars["customer-id"]
	bucketName, err := getBucketName(customerId)
	if err != nil {
		log.Printf("Error mapping customer ID: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, "Error mapping customer ID: %v", err)
		return
	}

	// Step 1: Download data from GCS
	// Download from the root of the bucket into the local 'data' directory.
	if err := downloadBucket(bucketName + "-pretransformed"); err != nil {
		log.Printf("Error downloading data: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error downloading data: %v", err)
		return
	}
	log.Println("Data download complete")

	// Step 2: Transform data
	jsonData, err := transformData(customerId)
	if err != nil {
		log.Printf("Error transforming data: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error transforming data: %v", err)
		return
	}
	log.Println("Data transformation complete")

	// Step 3: Upload transformed data to GCS
	// Use transformed bucket for output
	transformedBucketName := bucketName + "-transformed"
	var objectName = "facility-provider-hierarchy.json"
	if err := uploadFileToBucket(transformedBucketName, objectName, jsonData); err != nil {
		log.Printf("Error uploading transformed data: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error uploading transformed data: %v", err)
		return
	}
	log.Println("Data upload complete")

	// Step 4: Delete local data folder
	if err := deleteLocalData("data"); err != nil {
		log.Printf("Warning: failed to delete local data: %v", err)
		// Do not fail the whole process, just log a warning
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "ETL process completed successfully")
}

func triggerETLTest(w http.ResponseWriter, r *http.Request) {
	// Get customer ID from URL parameters and map to bucket name
	vars := mux.Vars(r)
	customerId := vars["customer-id"]

	bucketName, err := getBucketName(customerId)

	if err != nil {
		log.Printf("Error mapping customer ID: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, "Error mapping customer ID: %v", err)
		return
	}

	// Step 2: Transform data
	jsonData, err := transformData(customerId)
	if err != nil {
		log.Printf("Error transforming data: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error transforming data: %v", err)
		return
	}
	log.Println("Data transformation complete")

	// Step 3: Upload transformed data to GCS
	// Use transformed bucket for output
	transformedBucketName := bucketName + "-transformed"
	var objectName = "facility-provider-hierarchy.json"
	if err := uploadFileToBucket(transformedBucketName, objectName, jsonData); err != nil {
		log.Printf("Error uploading transformed data: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error uploading transformed data: %v", err)
		return
	}
	log.Println("Data upload complete")

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "ETL process completed successfully")
}

func uploadBucketHandler(w http.ResponseWriter, r *http.Request) {
	// Get customer ID from URL parameters
	vars := mux.Vars(r)
	customerID := vars["customer-id"]

	bucketName, err := getBucketName(customerID)
	if err != nil {
		log.Printf("Error mapping customer ID: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Create a temporary directory to store uploaded files
	tempDir, err := os.MkdirTemp("./", "upload-"+customerID+"-*")
	if err != nil {
		log.Printf("Error creating temp dir: %v", err)
		http.Error(w, "Error creating temp dir", http.StatusInternalServerError)
		return
	}
	defer os.RemoveAll(tempDir) // Clean up the temp directory

	// Parse the multipart form
	if err := r.ParseMultipartForm(32 << 20); err != nil { // 32MB max memory
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get a reference to the uploaded files
	files := r.MultipartForm.File["files"]

	for _, header := range files {
		// The client sends the relative path in the filename field
		objectName := header.Filename
		if objectName == "" {
			continue // Skip empty filenames
		}

		// Create the full local path
		localPath := filepath.Join(tempDir, objectName)

		// Open the uploaded file
		file, err := header.Open()
		if err != nil {
			log.Printf("Error opening uploaded file %s: %v", objectName, err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer file.Close()

		// Create the destination file on the server
		dst, err := os.Create(localPath)
		if err != nil {
			log.Printf("Error creating destination file %s: %v", localPath, err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		// Copy the uploaded file's content to the destination file
		if _, err := io.Copy(dst, file); err != nil {
			log.Printf("Error saving file %s: %v", objectName, err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	preTransformedBucketName := bucketName + "-pretransformed"

	// Ensure the bucket exists
	if err := createBucket(preTransformedBucketName); err != nil {
		log.Printf("Error ensuring bucket %s exists: %v", preTransformedBucketName, err)
		http.Error(w, "Failed to ensure cloud storage bucket exists", http.StatusInternalServerError)
		return
	}

	// Clear the bucket before uploading new files
	if err := clearBucket(preTransformedBucketName); err != nil {
		log.Printf("Error clearing bucket %s: %v", preTransformedBucketName, err)
		http.Error(w, "Failed to clear cloud storage bucket", http.StatusInternalServerError)
		return
	}

	// Upload the entire directory from the temp location to GCS
	if err := uploadDirectoryToBucket(preTransformedBucketName, tempDir); err != nil {
		log.Printf("Error uploading directory %s to bucket %s: %v", tempDir, preTransformedBucketName, err)
		http.Error(w, "Failed to upload directory to cloud storage", http.StatusInternalServerError)
		return
	}

	log.Printf("Successfully uploaded directory for %s to %s", customerID, preTransformedBucketName)
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Successfully uploaded files for %s", customerID)
}

func tableDataHandler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	// Get customer ID from URL parameters
	vars := mux.Vars(r)
	customerId := vars["customer-id"]

	bucketName, err := getBucketName(customerId)
	if err != nil {
		log.Printf("Error mapping customer ID: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, "Error mapping customer ID: %v", err)
		return
	}

	transformedBucketName := bucketName + "-transformed"

	objectName := "facility-provider-hierarchy.json"

	client, err := storage.NewClient(ctx)
	if err != nil {
		log.Printf("Failed to create storage client: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Failed to create storage client: %v", err)
		return
	}
	defer client.Close()

	rc, err := client.Bucket(transformedBucketName).Object(objectName).NewReader(ctx)
	if err != nil {
		log.Printf("Failed to read object: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Failed to read object: %v", err)
		return
	}
	defer rc.Close()

	w.Header().Set("Content-Type", "application/json")
	if _, err := io.Copy(w, rc); err != nil {
		log.Printf("Failed to write response: %v", err)
	}
}


