// Sample storage-quickstart creates a Google Cloud Storage bucket.

package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"

	"cloud.google.com/go/storage"
	"github.com/rs/cors"
)

// Node represents a facility or provider in the hierarchy
type Node struct {
	ID       string       `json:"id"`
	Label    string       `json:"label"`
	IconType string       `json:"iconType"`
	Data     []MetricData `json:"data"`
	Children []*Node      `json:"children,omitempty"`
}

// MetricData represents metric information for a node
type MetricData struct {
	Section         string    `json:"section"`
	Type            string    `json:"type"`
	Label           string    `json:"label,omitempty"`
	Code            string    `json:"code,omitempty"`
	Values          []float64 `json:"values"`
	Total           float64   `json:"total"`
	Coding          string    `json:"coding"`
	ColorGroup      string    `json:"colorGroup"`
	IsCurrency      bool      `json:"isCurrency,omitempty"`
	IsSectionHeader bool      `json:"isSectionHeader,omitempty"`
}

func main() {
	// Serve static files from the build directory
	fs := http.FileServer(http.Dir("./out"))
	http.HandleFunc("/trigger-etl", triggerETL)
	http.HandleFunc("/trigger-etl-test", triggerETLTest)
	http.HandleFunc("/table-data", tableDataHandler)
	http.Handle("/", fs)

	// Enable CORS for localhost:3000
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
	})

	handler := c.Handler(http.DefaultServeMux)

	log.Println("Starting server on :8080 ...")

	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func triggerETL(w http.ResponseWriter, r *http.Request) {
	log.Println("Starting ETL process...")

	// Step 1: Download data from GCS
	if err := downloadBucket("medlaunch", "data"); err != nil {
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
	bucketName := "medlaunch-transformed"
	objectName := "facility-provider-hierarchy.json"
	if err := uploadBucket(bucketName, objectName, jsonData); err != nil {
		log.Printf("Error uploading transformed data: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error uploading transformed data: %v", err)
		return
	}
	log.Println("Data upload complete")

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "ETL process completed successfully")
}

func triggerETLTest(w http.ResponseWriter, r *http.Request) {

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
	bucketName := "medlaunch-transformed"
	objectName := "facility-provider-hierarchy.json"
	if err := uploadBucket(bucketName, objectName, jsonData); err != nil {
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

	// We will pull the bucketname out of the request object when a cloud function passes it in.
	bucketName := "medlaunch-transformed"
	objectName := "facility-provider-hierarchy.json"

	client, err := storage.NewClient(ctx)
	if err != nil {
		log.Printf("Failed to create storage client: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Failed to create storage client: %v", err)
		return
	}
	defer client.Close()

	rc, err := client.Bucket(bucketName).Object(objectName).NewReader(ctx)
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
