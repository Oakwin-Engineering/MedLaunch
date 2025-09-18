// Sample storage-quickstart creates a Google Cloud Storage bucket.
package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"cloud.google.com/go/storage"
	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

var LOG_MODE string = os.Getenv("LOG_MODE")

func main() {
	// Load environment variables
	godotenv.Load()

	router := mux.NewRouter()

	// Register handlers with the mux router
	router.HandleFunc("/trigger-etl/{customer-id}", triggerETL)
	router.HandleFunc("/trigger-etl-test/{customer-id}", triggerETLTest)
	router.HandleFunc("/download-data/{customer-id}", downloadDataHandler)
	router.HandleFunc("/table-data/{customer-id}", tableDataHandler)
	router.HandleFunc("/print-pdf/{customer-id}", printPDF)

	// Enable CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
	})

	// Wrap the router with the CORS handler
	handler := c.Handler(router)

	log.Println("Starting server on :8080 ....")

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
	log.Println("Starting ETL Without Download process...")

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

func downloadDataHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Starting data download process...")

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

	// Download data from GCS
	if err := downloadBucket(bucketName + "-pretransformed"); err != nil {
		log.Printf("Error downloading data: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error downloading data: %v", err)
		return
	}
	log.Println("Data download complete")

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Data download completed successfully")
}

func printPDF(w http.ResponseWriter, r *http.Request) {
	// Get customer ID from URL parameters (optional if you want dynamic file names)
	vars := mux.Vars(r)
	customerId := vars["customer-id"]

	// Create a context with cancel
	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	// Give Chrome some startup time
	ctx, cancel = context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	var pdfBuf []byte
	url := "https://medlaunch-client-973560072485.us-central1.run.app/" + customerId

	// Run tasks
	err := chromedp.Run(ctx,
		chromedp.Navigate(url),
		chromedp.WaitVisible("body", chromedp.ByQuery), // wait until the page is ready
		chromedp.ActionFunc(func(ctx context.Context) error {
			var err error
			pdfBuf, _, err = page.PrintToPDF().
				WithPrintBackground(true).
				WithPaperWidth(16).
				Do(ctx)
			return err
		}),
	)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to generate PDF: %v", err), http.StatusInternalServerError)
		return
	}

	// Set headers so browser downloads it
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s-report.pdf\"", customerId))
	w.WriteHeader(http.StatusOK)

	// Write PDF bytes to response
	if _, err := w.Write(pdfBuf); err != nil {
		log.Printf("Failed to write PDF response: %v", err)
	}
}
