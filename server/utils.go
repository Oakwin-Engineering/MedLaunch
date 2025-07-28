package main

import (
	"encoding/csv"
	"fmt"
	"io"
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
func processCharges(filePath string, keyIdx, amountIdx int) (map[string]float64, error) {
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
	return processCharges(filePath, 0, 2) // facility_name at index 0, insurance_billed_amount at index 2
}

// Process charges by provider CSV and return total insurance billed amounts by provider
func processChargesByProvider(filePath string) (map[string]float64, error) {
	return processCharges(filePath, 0, 4) // provider_name at index 0, insurance_billed_amount at index 4
}
