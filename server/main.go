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

	// Initialize router
	r := mux.NewRouter()

	r.HandleFunc("/trigger-etl/{customer-id}", triggerETL)
	r.HandleFunc("/trigger-etl-test/{customer-id}", triggerETLTest)
	r.HandleFunc("/table-data/{customer-id}", tableDataHandler)

	// Serve SvelteKit static build with SPA fallback
	staticDir := "./build"
	fs := http.FileServer(http.Dir(staticDir))

	r.PathPrefix("/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Construct the path to the file in the static directory
		filePath := filepath.Join(staticDir, r.URL.Path)

		// Check if the file exists
		_, err := os.Stat(filePath)
		if os.IsNotExist(err) {
			// File does not exist, serve the SPA fallback page
			http.ServeFile(w, r, filepath.Join(staticDir, "200.html"))
			return
		}

		// Serve the existing file
		fs.ServeHTTP(w, r)
	})

	// Enable CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
	})

	// Wrap router with CORS handler
	handler := c.Handler(r)

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
	if err := downloadBucket(bucketName, "data"); err != nil {
		log.Printf("Error downloading data: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error downloading data: %v", err)
		return
	}
	log.Println("Data download complete")

	// Step 2: Transform data
	jsonData, err := transformData()
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
	if err := uploadBucket(transformedBucketName, objectName, jsonData); err != nil {
		log.Printf("Error uploading transformed data: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error uploading transformed data: %v", err)
		return
	}
	log.Println("Data upload complete")

	// Step 4: Delete local /data folder
	if err := os.RemoveAll("data"); err != nil {
		log.Printf("Error deleting local data directory: %v", err)
		// Depending on requirements, you might want to handle this error differently
	} else {
		log.Println("Local data directory deleted successfully")
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
	jsonData, err := transformData()
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
	if err := uploadBucket(transformedBucketName, objectName, jsonData); err != nil {
		log.Printf("Error uploading transformed data: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error uploading transformed data: %v", err)
		return
	}
	log.Println("Data upload complete")

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "ETL process completed successfully")
}

func tableDataHandler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

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
