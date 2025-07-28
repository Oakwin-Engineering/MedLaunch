// Sample storage-quickstart creates a Google Cloud Storage bucket.

package main

import (
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"cloud.google.com/go/storage"
	"github.com/rs/cors"
)

// Define the Node structure for our JSON hierarchy
type Node struct {
	ID       string      `json:"id"`
	Label    string      `json:"label"`
	IconType string      `json:"iconType"`
	Data     interface{} `json:"data,omitempty"`
	Children []*Node     `json:"children,omitempty"`
}

// Define the data structure for metrics
type MetricData struct {
	Section         string      `json:"section"`
	Type            string      `json:"type"`
	Code            string      `json:"code,omitempty"`
	Label           string      `json:"label,omitempty"`
	Values          []float64   `json:"values"`
	Total           interface{} `json:"total"`
	Coding          string      `json:"coding"`
	ColorGroup      string      `json:"colorGroup"`
	IsCurrency      bool        `json:"isCurrency,omitempty"`
	IsSectionHeader bool        `json:"isSectionHeader,omitempty"`
}

var months = []string{"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December"}

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
	path := "example/April/all_data.csv"
	chargesByClinicPath := "example/April/charges_by_clinic.csv"
	chargesByProviderPath := "example/April/charges_by_provider_bottom.csv"

	// Process charges by clinic and get facility totals
	facilityTotals, err := processChargesByClinic(chargesByClinicPath)
	if err != nil {
		log.Printf("Error processing charges by clinic: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error processing charges by clinic: %v", err)
		return
	}

	// Print facility totals
	fmt.Println("\nFacility Totals:")
	for facility, total := range facilityTotals {
		fmt.Printf("%s: $%.2f\n", facility, total)
	}

	// Process charges by provider and get provider totals
	providerTotals, err := processChargesByProvider(chargesByProviderPath)
	if err != nil {
		log.Printf("Error processing charges by provider: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error processing charges by provider: %v", err)
		return
	}

	// Print provider totals
	fmt.Println("\nProvider Totals:")
	for provider, total := range providerTotals {
		fmt.Printf("%s: $%.2f\n", provider, total)
	}

	baseData := []MetricData{
		{
			Section:    "Initial Visits",
			Type:       "data",
			Code:       "99374",
			Values:     []float64{7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7},
			Total:      7,
			Coding:     "7%",
			ColorGroup: "yellow",
		},
		{
			Section:    "Initial Visits",
			Type:       "data",
			Code:       "99375",
			Values:     []float64{1, 2, 1, 1, 2, 3, 2, 1, 2, 1, 3, 2},
			Total:      21,
			Coding:     "5%",
			ColorGroup: "yellow",
		},
		// Add more metrics as needed...
		{
			Section:    "Provider Income",
			Type:       "data",
			Label:      "Average income per RVU",
			Values:     []float64{8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8},
			Total:      "$",
			Coding:     "",
			ColorGroup: "orange",
			IsCurrency: true,
		},
	}

	// Read and parse the CSV file
	file, err := os.Open(path)
	if err != nil {
		log.Printf("Error opening CSV file: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error opening CSV file: %v", err)
		return
	}
	defer file.Close()

	// Create CSV reader
	csvReader := csv.NewReader(file)

	// Indices for facility and provider in the csv
	facilityIndex := 8
	providerIndex := 6

	// Map to store unique facilities and their providers
	facilityProviders := make(map[string]map[string]bool)
	// Map to track provider occurrences across all facilities
	providerOccurrences := make(map[string]int)
	// Map to track provider-facility combinations
	providerFacilities := make(map[string][]string)

	// Read and process CSV rows to gather all provider-facility relationships
	for {
		record, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue // Skip malformed lines
		}

		facility := strings.TrimSpace(record[facilityIndex])
		provider := strings.TrimSpace(record[providerIndex])

		if facility != "" && provider != "" {
			if _, exists := facilityProviders[facility]; !exists {
				facilityProviders[facility] = make(map[string]bool)
			}
			facilityProviders[facility][provider] = true

			// Track which facilities each provider appears in
			if !contains(providerFacilities[provider], facility) {
				providerFacilities[provider] = append(providerFacilities[provider], facility)
			}
		}
	}

	// Create the final items slice
	var items []*Node

	// Convert the map to our desired structure
	for facility, providers := range facilityProviders {
		facilityNode := &Node{
			ID:       slugify(facility),
			Label:    facility,
			IconType: "clinic",
			Data:     baseData,
			Children: []*Node{},
		}

		// Add providers as children
		for provider := range providers {
			// Get occurrence number for this provider
			providerOccurrences[provider]++
			occurrence := 1

			// If provider appears in multiple facilities, find which occurrence this is
			if len(providerFacilities[provider]) > 1 {
				for i, f := range providerFacilities[provider] {
					if f == facility {
						occurrence = i + 1
						break
					}
				}
			}

			// Create provider ID with occurrence number if needed
			providerID := slugify(provider)
			if len(providerFacilities[provider]) > 1 {
				providerID = fmt.Sprintf("%s_%d", providerID, occurrence)
			}

			facilityNode.Children = append(facilityNode.Children, &Node{
				ID:       providerID,
				Label:    provider,
				IconType: "person",
				Data:     baseData,
			})
		}

		items = append(items, facilityNode)
	}

	// // Marshal the data to JSON
	// jsonData, err := json.MarshalIndent(items, "", "  ")
	// if err != nil {
	// 	log.Printf("Error marshaling JSON: %v", err)
	// 	w.WriteHeader(http.StatusInternalServerError)
	// 	fmt.Fprintf(w, "Error marshaling JSON: %v", err)
	// 	return
	// }

	// // Upload to GCS
	// bucketName := "med-launch-transformed"
	// objectName := "facility-provider-hierarchy.json"

	// if err := uploadToGCS(bucketName, objectName, jsonData); err != nil {
	// 	log.Printf("Error uploading to GCS: %v", err)
	// 	w.WriteHeader(http.StatusInternalServerError)
	// 	fmt.Fprintf(w, "Error uploading to GCS: %v", err)
	// 	return
	// }

	w.WriteHeader(http.StatusOK)
	// fmt.Fprintf(w, "Successfully uploaded hierarchy to gs://%s/%s", bucketName, objectName)
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

	fmt.Print(rc)

	w.Header().Set("Content-Type", "application/json")
	if _, err := io.Copy(w, rc); err != nil {
		log.Printf("Failed to write response: %v", err)
	}
}
