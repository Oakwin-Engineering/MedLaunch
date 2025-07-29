// Sample storage-quickstart creates a Google Cloud Storage bucket.

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sort"

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
	// Initialize maps to store merged relationships
	mergedFacilityProviders := make(map[string]map[string]bool)
	mergedProviderFacilities := make(map[string][]string)

	// Process each month's data, build nav bar.
	for _, month := range months {
		allDataPath := fmt.Sprintf("example/%s/all_data.csv", month)

		// Skip if file doesn't exist
		if _, err := os.Stat(allDataPath); os.IsNotExist(err) {
			continue
		}

		// Process provider-facility relationships for this month
		facilityProviders, providerFacilities := processProviderFacilityRelationships(allDataPath)
		if facilityProviders == nil || providerFacilities == nil {
			continue
		}

		// Merge facility providers
		for facility, providers := range facilityProviders {
			if _, exists := mergedFacilityProviders[facility]; !exists {
				mergedFacilityProviders[facility] = make(map[string]bool)
			}
			for provider := range providers {
				mergedFacilityProviders[facility][provider] = true
			}
		}

		// Merge provider facilities
		for provider, facilities := range providerFacilities {
			for _, facility := range facilities {
				if !contains(mergedProviderFacilities[provider], facility) {
					mergedProviderFacilities[provider] = append(mergedProviderFacilities[provider], facility)
				}
			}
		}
	}

	// If no data was processed, return
	if len(mergedFacilityProviders) == 0 || len(mergedProviderFacilities) == 0 {
		return
	}

	// Initialize maps to store data for each month
	monthlyFacilityTotals := make(map[string]map[string]float64)
	monthlyProviderTotals := make(map[string]map[string]float64)
	monthlyFacilityCollections := make(map[string]map[string]float64)
	monthlyProviderCollections := make(map[string]map[string]float64)
	monthlyProviderCodes := make(map[string]map[string]map[string]int)
	monthlyFacilityVisits := make(map[string]map[string]float64)
	monthlyProviderVisits := make(map[string]map[string]float64)

	// Process each month's data
	for _, month := range months {
		// Generate file paths for this month
		chargesByClinicPath := fmt.Sprintf("example/%s/charges_by_clinic.csv", month)
		chargesByProviderPath := fmt.Sprintf("example/%s/charges_by_provider_bottom.csv", month)
		collectionsByFacilityPath := fmt.Sprintf("example/%s/collections_by_facility.csv", month)
		collectionsByProviderPath := fmt.Sprintf("example/%s/collections_by_provider.csv", month)
		cptCodesByProviderPath := fmt.Sprintf("example/%s/charges_by_provider_top.csv", month)

		// Process charges by clinics
		if facilityTotals, err := processChargesByClinic(chargesByClinicPath); err == nil {
			monthlyFacilityTotals[month] = facilityTotals
		}

		// Process visits for clinics
		if facilityVisits, err := processVisitsByClinic(chargesByClinicPath); err == nil {
			monthlyFacilityVisits[month] = facilityVisits
		}

		// Process charges by providers
		if providerTotals, err := processChargesByProvider(chargesByProviderPath); err == nil {
			monthlyProviderTotals[month] = providerTotals
		}

		// Process collections by facility
		if facilityCollections, err := processCollectionsByFacility(collectionsByFacilityPath); err == nil {
			monthlyFacilityCollections[month] = facilityCollections
		}

		// Process collections by provider
		if providerCollections, err := processCollectionsByProvider(collectionsByProviderPath); err == nil {
			monthlyProviderCollections[month] = providerCollections
		}

		// Process provider code relationships
		if providerCodes, err := processProviderCodeRelationships(cptCodesByProviderPath); err == nil {
			monthlyProviderCodes[month] = providerCodes
		}

		// Process visits for clinics
		if facilityVisits, err := processVisitsByClinic(chargesByClinicPath); err == nil {
			monthlyFacilityVisits[month] = facilityVisits
		}

		// Process visits for providers
		if providerVisits, err := processVisitsByProvider(chargesByProviderPath); err == nil {
			monthlyProviderVisits[month] = providerVisits
		}
	}

	// Print summary of processed data
	fmt.Println("\nProcessed Data Summary:")
	for _, month := range months {
		fmt.Printf("\nMonth: %s", month)
		if totals, exists := monthlyFacilityTotals[month]; exists {
			fmt.Printf("\n  Facilities with charges: %d", len(totals))
		}
		if totals, exists := monthlyProviderTotals[month]; exists {
			fmt.Printf("\n  Providers with charges: %d", len(totals))
		}
		if collections, exists := monthlyFacilityCollections[month]; exists {
			fmt.Printf("\n  Facilities with collections: %d", len(collections))
		}
		if collections, exists := monthlyProviderCollections[month]; exists {
			fmt.Printf("\n  Providers with collections: %d", len(collections))
		}
		if codes, exists := monthlyProviderCodes[month]; exists {
			fmt.Printf("\n  Providers with code data: %d", len(codes))
			// Print unique CPT codes for this month
			uniqueCodes := make(map[string]bool)
			for _, providerData := range codes {
				for code := range providerData {
					uniqueCodes[code] = true
				}
			}
			fmt.Printf("\n  Unique CPT codes: %d", len(uniqueCodes))
		}
		if visits, exists := monthlyFacilityVisits[month]; exists {
			fmt.Printf("\n  Facilities with visits: %d", len(visits))
		}
		if visits, exists := monthlyProviderVisits[month]; exists {
			fmt.Printf("\n  Providers with visits: %d", len(visits))
		}
		fmt.Println()
	}

	// Map to track provider occurrences across all facilities
	providerOccurrences := make(map[string]int)

	// Create the final items slice
	var items []*Node

	// Convert the map to our desired structure
	for facility, providers := range mergedFacilityProviders {
		// Build facility metrics data
		facilityChargesValues := make([]float64, 12)
		facilityCollectionsValues := make([]float64, 12)
		facilityVisitsValues := make([]float64, 12)
		facilityCodeValues := make(map[string][]float64)

		// Get monthly values for this facility
		for i, month := range months {
			// Get charges
			if monthData, exists := monthlyFacilityTotals[month]; exists {
				if total, ok := monthData[facility]; ok {
					facilityChargesValues[i] = total
				}
			}

			// Get collections
			if monthData, exists := monthlyFacilityCollections[month]; exists {
				if total, ok := monthData[facility]; ok {
					facilityCollectionsValues[i] = total
				}
			}

			// Get visits
			if monthData, exists := monthlyFacilityVisits[month]; exists {
				if total, ok := monthData[facility]; ok {
					facilityVisitsValues[i] = total
				}
			}

			// Aggregate CPT codes from providers in this facility
			if monthCodes, exists := monthlyProviderCodes[month]; exists {
				for provider := range providers {
					if providerData, ok := monthCodes[provider]; ok {
						for code, count := range providerData {
							if _, exists := facilityCodeValues[code]; !exists {
								facilityCodeValues[code] = make([]float64, 12)
							}
							facilityCodeValues[code][i] += float64(count)
						}
					}
				}
			}
		}

		// Calculate totals
		facilityChargesTotal := 0.0
		facilityCollectionsTotal := 0.0
		facilityVisitsTotal := 0.0
		for i := 0; i < 12; i++ {
			facilityChargesTotal += facilityChargesValues[i]
			facilityCollectionsTotal += facilityCollectionsValues[i]
			facilityVisitsTotal += facilityVisitsValues[i]
		}

		// Build facility metrics data
		facilityData := []MetricData{}

		// Add CPT code metrics first
		totalVisitsByMonth := make([]float64, 12)
		totalVisitsSum := 0.0

		for code, values := range facilityCodeValues {
			total := 0.0
			for i, v := range values {
				total += v
				totalVisitsByMonth[i] += v
			}
			totalVisitsSum += total

			facilityData = append(facilityData, MetricData{
				Section:    "Initial Visits",
				Type:       "data",
				Code:       code,
				Values:     values,
				Total:      total,
				Coding:     "-",
				ColorGroup: "yellow",
			})
		}

		// Add total visits metric
		facilityData = append(facilityData, MetricData{
			Section:    "Initial Visits",
			Type:       "total",
			Label:      "Total",
			Values:     totalVisitsByMonth,
			Total:      totalVisitsSum,
			Coding:     "-",
			ColorGroup: "yellow",
		})

		// Add other metrics
		facilityData = append(facilityData, MetricData{
			Section:    "Totals",
			Type:       "data",
			Label:      "Monthly Visits",
			Values:     facilityVisitsValues,
			Total:      facilityVisitsTotal,
			Coding:     "-",
			ColorGroup: "orange",
		})

		facilityData = append(facilityData, MetricData{
			Section:         "Charges",
			Type:            "data",
			Label:           "Charges",
			Values:          facilityChargesValues,
			Total:           facilityChargesTotal,
			Coding:          "-",
			ColorGroup:      "green",
			IsSectionHeader: true,

			IsCurrency: true,
		})

		facilityData = append(facilityData, MetricData{
			Section:         "Payments",
			Type:            "data",
			Label:           "Payments",
			Values:          facilityCollectionsValues,
			Total:           facilityCollectionsTotal,
			Coding:          "-",
			ColorGroup:      "blue",
			IsSectionHeader: true,

			IsCurrency: true,
		})

		facilityNode := &Node{
			ID:       slugify(facility),
			Label:    facility,
			IconType: "clinic",
			Data:     facilityData,
			Children: []*Node{},
		}

		// Add providers as children
		for provider := range providers {
			// Get occurrence number for this provider
			providerOccurrences[provider]++
			occurrence := 1

			// If provider appears in multiple facilities, find which occurrence this is
			if len(mergedProviderFacilities[provider]) > 1 {
				for i, f := range mergedProviderFacilities[provider] {
					if f == facility {
						occurrence = i + 1
						break
					}
				}
			}

			// Create provider ID with occurrence number if needed
			providerID := slugify(provider)
			if len(mergedProviderFacilities[provider]) > 1 {
				providerID = fmt.Sprintf("%s_%d", providerID, occurrence)
			}

			// Build monthly values arrays for this provider
			chargesValues := make([]float64, 12)
			collectionsValues := make([]float64, 12)
			visitsValues := make([]float64, 12)
			codesValues := make(map[string][]float64)

			// Fill in the values arrays from monthly data
			for i, month := range months {
				// Get charges
				if monthData, exists := monthlyProviderTotals[month]; exists {
					if total, ok := monthData[provider]; ok {
						chargesValues[i] = total
					}
				}

				// Get collections
				if monthData, exists := monthlyProviderCollections[month]; exists {
					if total, ok := monthData[provider]; ok {
						collectionsValues[i] = total
					}
				}

				// Get visits
				if monthData, exists := monthlyProviderVisits[month]; exists {
					if total, ok := monthData[provider]; ok {
						visitsValues[i] = total
					}
				}

				// Get codes
				if monthData, exists := monthlyProviderCodes[month]; exists {
					if providerData, ok := monthData[provider]; ok {
						for code, count := range providerData {
							if _, exists := codesValues[code]; !exists {
								codesValues[code] = make([]float64, 12)
							}
							codesValues[code][i] = float64(count)
						}
					}
				}
			}

			// Calculate totals
			chargesTotal := 0.0
			collectionsTotal := 0.0
			visitsTotal := 0.0
			for _, v := range chargesValues {
				chargesTotal += v
			}
			for _, v := range collectionsValues {
				collectionsTotal += v
			}
			for _, v := range visitsValues {
				visitsTotal += v
			}

			// Calculate total visits across all CPT codes
			totalVisitsByMonth := make([]float64, 12)
			totalVisitsSum := 0.0

			// Initialize baseData with CPT codes first
			baseData := []MetricData{}

			// Add code metrics and calculate totals
			for code, values := range codesValues {
				total := 0.0
				for i, v := range values {
					total += v
					totalVisitsByMonth[i] += v
				}
				totalVisitsSum += total

				baseData = append(baseData, MetricData{
					Section:    "Initial Visits",
					Type:       "data",
					Code:       code,
					Values:     values,
					Total:      total,
					Coding:     "-",
					ColorGroup: "yellow",
				})
			}

			// Add total visits metric
			baseData = append(baseData, MetricData{
				Section:    "Initial Visits",
				Type:       "total",
				Label:      "Total",
				Values:     totalVisitsByMonth,
				Total:      totalVisitsSum,
				Coding:     "-",
				ColorGroup: "yellow",
			})

			// Add other metrics
			baseData = append(baseData, MetricData{
				Section:    "Totals",
				Type:       "data",
				Label:      "Total Visits",
				Values:     visitsValues,
				Total:      visitsTotal,
				Coding:     "-",
				ColorGroup: "orange",
			})

			baseData = append(baseData, MetricData{
				Section:         "Charges",
				Type:            "data",
				Label:           "Charges",
				Values:          chargesValues,
				Total:           chargesTotal,
				Coding:          "-",
				ColorGroup:      "green",
				IsSectionHeader: true,
				IsCurrency:      true,
			})

			baseData = append(baseData, MetricData{
				Section:         "Payments",
				Type:            "data",
				Label:           "Payments",
				Values:          collectionsValues,
				Total:           collectionsTotal,
				Coding:          "-",
				ColorGroup:      "blue",
				IsSectionHeader: true,
				IsCurrency:      true,
			})

			facilityNode.Children = append(facilityNode.Children, &Node{
				ID:       providerID,
				Label:    provider,
				IconType: "person",
				Data:     baseData,
			})
		}

		items = append(items, facilityNode)
	}

	// Sort facilities alphabetically by label
	sort.Slice(items, func(i, j int) bool {
		return items[i].Label < items[j].Label
	})

	// Marshal the data to JSON
	jsonData, err := json.MarshalIndent(items, "", "  ")
	if err != nil {
		log.Printf("Error marshaling JSON: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error marshaling JSON: %v", err)
		return
	}

	// Upload to GCS
	bucketName := "med-launch-transformed"
	objectName := "facility-provider-hierarchy.json"

	if err := uploadToGCS(bucketName, objectName, jsonData); err != nil {
		log.Printf("Error uploading to GCS: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error uploading to GCS: %v", err)
		return
	}

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
