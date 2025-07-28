package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
)

// Helper function to convert strings to URL-friendly IDs
func slugify(s string) string {
	return strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(s, " ", "_"), ".", ""))
}

// Helper function to check if a string slice contains a value
func contains(slice []string, str string) bool {
	for _, v := range slice {
		if v == str {
			return true
		}
	}
	return false
}

// Generic function to process charges from CSV and return total amounts by key
func processCSV(filePath string, keyIdx, amountIdx int) (map[string]float64, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("error opening CSV file: %v", err)
	}
	defer file.Close()

	csvReader := csv.NewReader(file)

	// Map to store totals
	totals := make(map[string]float64)

	// Process each row
	for {
		record, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue // Skip malformed lines
		}

		key := strings.TrimSpace(record[keyIdx])
		amountStr := strings.TrimSpace(record[amountIdx])

		// Parse amount
		amount, err := strconv.ParseFloat(amountStr, 64)
		if err != nil {
			continue // Skip invalid amounts
		}

		// Add to total
		totals[key] += amount
	}

	return totals, nil
}

// Process charges by clinic CSV and return total insurance billed amounts by facility
func processChargesByClinic(filePath string) (map[string]float64, error) {
	return processCSV(filePath, 0, 2) // facility_name at index 0, insurance_billed_amount at index 2
}

// Process charges by provider CSV and return total insurance billed amounts by provider
func processChargesByProvider(filePath string) (map[string]float64, error) {
	return processCSV(filePath, 0, 4) // provider_name at index 0, insurance_billed_amount at index 4
}

// Process collections by facility CSV and return total payments by facility
func processCollectionsByFacility(filePath string) (map[string]float64, error) {
	return processCSV(filePath, 0, 3) // facility_name at index 0, total_payments at index 3
}

// Process collections by provider CSV and return total payments by provider
func processCollectionsByProvider(filePath string) (map[string]float64, error) {
	return processCSV(filePath, 0, 3) // provider_name at index 0, total_payments at index 3
}

// processProviderCodeRelationships reads a CSV file and extracts provider-code relationships
func processProviderCodeRelationships(filePath string) (map[string]map[string]int, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("error opening CSV file: %v", err)
	}
	defer file.Close()

	csvReader := csv.NewReader(file)

	// Skip header row
	_, err = csvReader.Read()
	if err != nil {
		return nil, fmt.Errorf("error reading CSV header: %v", err)
	}

	// Map to store provider-code relationships
	// map[provider_name]map[code]int
	providerCodes := make(map[string]map[string]int)

	// Process each row
	for {
		record, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue // Skip malformed lines
		}

		code := strings.TrimSpace(record[0])
		provider := strings.TrimSpace(record[1])
		encountersBilled, err := strconv.Atoi(strings.TrimSpace(record[2]))
		if err != nil {
			continue // Skip invalid encounter numbers
		}

		// Initialize provider map if it doesn't exist
		if _, exists := providerCodes[provider]; !exists {
			providerCodes[provider] = make(map[string]int)
		}

		// Add or update the code data
		providerCodes[provider][code] = encountersBilled
	}

	return providerCodes, nil
}

// processProviderFacilityRelationships reads a CSV file and extracts provider-facility relationships
func processProviderFacilityRelationships(path string, w http.ResponseWriter) (map[string]map[string]bool, map[string][]string) {
	// Read and parse the CSV file
	file, err := os.Open(path)
	if err != nil {
		log.Printf("Error opening CSV file: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, "Error opening CSV file: %v", err)
		return nil, nil
	}
	defer file.Close()

	// Create CSV reader
	csvReader := csv.NewReader(file)

	// Indices for facility and provider in the csv
	facilityIndex := 8
	providerIndex := 6

	// Map to store unique facilities and their providers
	facilityProviders := make(map[string]map[string]bool)
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

	return facilityProviders, providerFacilities
}
