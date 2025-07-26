// Sample storage-quickstart creates a Google Cloud Storage bucket.

package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"

	"cloud.google.com/go/storage"
)

func main() {
	http.HandleFunc("/trigger-etl", triggerETL)
	http.HandleFunc("/table-data", tableDataHandler)

	log.Println("Starting server on :8080 ...")

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func triggerETL(w http.ResponseWriter, r *http.Request) {
	csvPath := "data/ADP/payrollJanJune.csv"
	bucketName := "med-launch-transformed"
	objectName := "adp.json"

	err := TransformAndUploadADPCSV(csvPath, bucketName, objectName)
	if err != nil {
		log.Printf("Error transforming/uploading CSV: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Failed: %v", err)
		return
	}

	log.Printf("CSV transformed and uploaded successfully.")
	fmt.Fprintf(w, "CSV transformed and uploaded successfully.")
}

func tableDataHandler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	bucketName := "med-launch-transformed"
	objectName := "table.json"

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
