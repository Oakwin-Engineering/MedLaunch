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

// processCSVUHealth is a generic CSV processing function for UHealth data.
func processCSVUHealth(filePath string, keyIdx, amountIdx int) (map[string]float64, error) {
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

// processChargesByClinicUHealth processes charges by clinic for UHealth.
func processChargesByClinicUHealth(filePath string) (map[string]float64, error) {
	return processCSVUHealth(filePath, 0, 2) // facility_name at index 0, insurance_billed_amount at index 2
}

// processChargesByProviderUHealth processes charges by provider for UHealth.
func processChargesByProviderUHealth(filePath string) (map[string]float64, error) {
	return processCSVUHealth(filePath, 0, 4) // provider_name at index 0, insurance_billed_amount at index 4
}

// processCollectionsByFacilityUHealth processes collections by facility for UHealth.
func processCollectionsByFacilityUHealth(filePath string) (map[string]float64, error) {
	return processCSVUHealth(filePath, 0, 3) // facility_name at index 0, total_payments at index 3
}

// processCollectionsByProviderUHealth processes collections by provider for UHealth.
func processCollectionsByProviderUHealth(filePath string) (map[string]float64, error) {
	return processCSVUHealth(filePath, 0, 3) // provider_name at index 0, total_payments at index 3
}

// processVisitsByClinicUHealth processes visits by clinic for UHealth.
func processVisitsByClinicUHealth(filePath string) (map[string]float64, error) {
	return processCSVUHealth(filePath, 0, 3) // facility_name at index 0, encounters_billed at index 3
}

// processVisitsByProviderUHealth processes visits by provider for UHealth.
func processVisitsByProviderUHealth(filePath string) (map[string]float64, error) {
	return processCSVUHealth(filePath, 0, 1) // provider_name at index 0, encounters_billed at index 1
}

// processProviderCodeRelationshipsUHealth reads a CSV file and extracts provider-code relationships for UHealth.
func processProviderCodeRelationshipsUHealth(filePath string) (map[string]map[string]int, error) {
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

		if _, exists := providerCodes[provider]; !exists {
			providerCodes[provider] = make(map[string]int)
		}

		providerCodes[provider][code] = encountersBilled
	}

	return providerCodes, nil
}

// processProviderFacilityRelationshipsUHealth reads a CSV file and extracts provider-facility relationships for UHealth.
func processProviderFacilityRelationshipsUHealth(filePath string) (map[string]map[string]bool, map[string][]string) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, nil
	}
	defer file.Close()

	csvReader := csv.NewReader(file)

	_, err = csvReader.Read()
	if err != nil {
		return nil, nil
	}

	facilityIndex := 7
	providerIndex := 5

	facilityProviders := make(map[string]map[string]bool)
	providerFacilities := make(map[string][]string)

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

			if !contains(providerFacilities[provider], facility) {
				providerFacilities[provider] = append(providerFacilities[provider], facility)
			}
		}
	}

	return facilityProviders, providerFacilities
}

// processADPProviderPayrollMonthlyUHealth processes ADP payroll data for UHealth.
func processADPProviderPayrollMonthlyUHealth(filePath string) (map[string]map[string]float64, []string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, nil, fmt.Errorf("error opening CSV file: %v", err)
	}
	defer file.Close()

	csvReader := csv.NewReader(file)

	_, err = csvReader.Read()
	if err != nil {
		return nil, nil, fmt.Errorf("error reading CSV header: %v", err)
	}

	monthlyData := make(map[string]map[string]float64)

	for {
		record, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue
		}

		name := strings.Trim(record[0], "\"")
		payDate := record[5]
		grossPay := record[6]

		date, err := time.Parse("01/02/2006", payDate)
		if err != nil {
			continue
		}

		month := months[date.Month()-1]

		grossPay = strings.Trim(grossPay, "\"")
		grossPay = strings.ReplaceAll(grossPay, ",", "")
		payAmount, err := strconv.ParseFloat(grossPay, 64)
		if err != nil {
			continue
		}

		if _, exists := monthlyData[month]; !exists {
			monthlyData[month] = make(map[string]float64)
		}

		monthlyData[month][name] += payAmount
	}

	var uniqueProviders []string
	providerSet := make(map[string]bool)

	for _, providers := range monthlyData {
		for provider := range providers {
			if !providerSet[provider] {
				providerSet[provider] = true
				uniqueProviders = append(uniqueProviders, strings.TrimSpace(provider))
			}
		}
	}

	return monthlyData, uniqueProviders, nil
}
