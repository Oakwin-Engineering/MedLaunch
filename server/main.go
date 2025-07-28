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

func main() {
	http.HandleFunc("/trigger-etl", triggerETL)
	http.HandleFunc("/transform", triggerTransform)
	http.HandleFunc("/table-data", tableDataHandler)

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

func triggerTransform(w http.ResponseWriter, r *http.Request) {
	// path := "/data/Athelas/May/SubmittedClaimsReport/All Data/All Data_Start_05_01_2025_End_05_31_2025.csv"

}

func triggerETL(w http.ResponseWriter, r *http.Request) {
	// csvPath := "data/ADP/payrollJanJune.csv"

	// // We will pull the bucketname out of the request object when a cloud function passes it in.
	// transformedBucketName := "med-launch-transformed"
	// objectName := "adp.json"

	downloadError := downloadEntireBucket("med-launch", "data")
	if downloadError != nil {
		log.Printf("Error downloading CSVs: %v", downloadError)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Failed: %v", downloadError)
		return
	}

	// err := TransformAndUploadADPCSV(csvPath, transformedBucketName, objectName)
	// if err != nil {
	// 	log.Printf("Error transforming/uploading CSV: %v", err)
	// 	w.WriteHeader(http.StatusInternalServerError)
	// 	fmt.Fprintf(w, "Failed: %v", err)
	// 	return
	// }

	log.Printf("CSV transformed and uploaded successfully.")
	fmt.Fprintf(w, "CSV transformed and uploaded successfully.")
}

func tableDataHandler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	// We will pull the bucketname out of the request object when a cloud function passes it in.
	bucketName := "med-launch-transformed"
	objectName := "adp.json"

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

	fmt.Print(rc)

	w.Header().Set("Content-Type", "application/json")
	if _, err := io.Copy(w, rc); err != nil {
		log.Printf("Failed to write response: %v", err)
	}
}
