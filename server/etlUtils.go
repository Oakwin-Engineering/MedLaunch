package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"
	"time"
)

// Generic function to process charges from CSV and return total amounts by key
func processCSV(filePath string, keyIdx, amountIdx int) (map[string]float64, error) {
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

// Process visits by clinic CSV and return total encounters by facility
func processVisitsByClinic(filePath string) (map[string]float64, error) {
	return processCSV(filePath, 0, 3) // facility_name at index 0, encounters_billed at index 3
}

// Process visits by provider CSV and return total encounters by provider
func processVisitsByProvider(filePath string) (map[string]float64, error) {
	return processCSV(filePath, 0, 1) // provider_name at index 0, encounters_billed at index 1
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
func processProviderFacilityRelationships(filePath string) (map[string]map[string]bool, map[string][]string) {
	// Read and parse the CSV file
	file, err := os.Open(filePath)
	if err != nil {
		return nil, nil
	}
	defer file.Close()

	// Create CSV reader
	csvReader := csv.NewReader(file)

	// Skip header row
	_, err = csvReader.Read()
	if err != nil {
		return nil, nil
	}

	// Indices for facility and provider in the csv
	facilityIndex := 7
	providerIndex := 5

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

func processADPProviderPayrollMonthly(filePath string) (map[string]map[string]float64, string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, "", fmt.Errorf("error opening CSV file: %v", err)
	}
	defer file.Close()

	csvReader := csv.NewReader(file)

	// Skip header
	_, err = csvReader.Read()
	if err != nil {
		return nil, "", fmt.Errorf("error reading CSV header: %v", err)
	}

	// Initialize result map: month -> provider -> total earnings
	monthlyData := make(map[string]map[string]float64)

	// Read and process each record
	for {
		record, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue
		}

		// Extract data from record
		name := strings.Trim(record[0], "\"") // Provider name
		payDate := record[5]                  // Pay date
		grossPay := record[6]                 // Gross pay

		// Parse the pay date
		date, err := time.Parse("01/02/2006", payDate)
		if err != nil {
			continue
		}

		// Get month name from the common months array
		month := months[date.Month()-1] // Month() returns 1-12, so we subtract 1 for 0-based index

		// Clean and parse gross pay
		grossPay = strings.Trim(grossPay, "\"")
		grossPay = strings.ReplaceAll(grossPay, ",", "")
		payAmount, err := strconv.ParseFloat(grossPay, 64)
		if err != nil {
			continue
		}

		// Initialize month map if it doesn't exist
		if _, exists := monthlyData[month]; !exists {
			monthlyData[month] = make(map[string]float64)
		}

		// Add pay amount to provider's total for the month
		monthlyData[month][name] += payAmount
	}

	// Create slice of unique provider names
	var uniqueProviders string
	providerSet := make(map[string]bool)

	// Collect unique provider names from all months
	for _, providers := range monthlyData {
		for provider := range providers {
			if !providerSet[provider] {
				providerSet[provider] = true
				uniqueProviders += provider
			}
		}
	}

	return monthlyData, uniqueProviders, nil
}
