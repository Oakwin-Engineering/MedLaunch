package main

import (
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
	"strings"
	"time"
)

// Node represents a facility or provider in the hierarchy
type Node struct {
	ID       string   `json:"id"`
	Label    string   `json:"label"`
	IconType string   `json:"iconType"`
	Data     NodeData `json:"data"`
	Children []*Node  `json:"children,omitempty"`
}

// NodeData holds the structured metrics for a node.
type NodeData struct {
	CptCodes                   []CptCodeMetric `json:"cptCodes"`
	Total                      Metric          `json:"total"`
	TotalVisits                Metric          `json:"totalVisits"`
	Charges                    Metric          `json:"charges"`
	Payments                   Metric          `json:"payments"`
	RVUs                       Metric          `json:"rvus"`
	Payroll                    Metric          `json:"payroll"`
	Adjustments                Metric          `json:"adjustments"`
	OperatingProfit            Metric          `json:"operatingProfit"`
	RvuPerPatient              Metric          `json:"rvuPerPatient"`
	ChargePerPatient           Metric          `json:"chargePerPatient"`
	PaymentPercentOfCharges    Metric          `json:"paymentPercentOfCharges"`
	AverageReceiptsPerPatient  Metric          `json:"averageReceiptsPerPatient"`
	AdjustmentPercentOfCharges Metric          `json:"adjustmentPercentOfCharges"`
}

// CptCodeMetric represents a CPT code's metrics.
type CptCodeMetric struct {
	Code   string    `json:"code"`
	Values []float64 `json:"values"`
	Total  float64   `json:"total"`
	Coding string    `json:"coding"`
}

// Metric represents a single metric with a label, values, total, and coding.
type Metric struct {
	Label  string    `json:"label"`
	Values []float64 `json:"values"`
	Total  float64   `json:"total"`
	Coding string    `json:"coding"`
}

func transformData(clientName string) ([]byte, error) {
	switch clientName {
	case "uhealth":
		return uHealthTransform()
	case "vitalcare":
		return vitalCareTransform()
	default:
		return nil, errors.New("no customer name sent in")
	}
}

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

func processADPProviderPayrollMonthly(filePath string) (map[string]map[string]float64, []string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, nil, fmt.Errorf("error opening CSV file: %v", err)
	}
	defer file.Close()

	csvReader := csv.NewReader(file)

	// Skip header
	_, err = csvReader.Read()
	if err != nil {
		return nil, nil, fmt.Errorf("error reading CSV header: %v", err)
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
	var uniqueProviders []string
	providerSet := make(map[string]bool)

	// Collect unique provider names from all months
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

// processFinancialDataVitalCare reads a CSV file and processes financial data, returning a map of data aggregated by month and provider.
func processFinancialDataVitalCare(filePath string, amountIdx int) (map[string]map[string]int64, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("error opening financial analysis file: %v", err)
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.FieldsPerRecord = -1 // Disable field count check

	// Skip header
	if _, err := r.Read(); err != nil {
		return nil, fmt.Errorf("error reading CSV header: %v", err)
	}

	data := make(map[string]map[string]int64)

	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("error reading CSV record: %v", err)
		}

		providerName := strings.TrimSpace(record[0])
		dateStr := record[1]
		amountStr := record[amountIdx]

		// Extract month from "Month_YYYY" format
		parts := strings.Split(dateStr, "_")
		if len(parts) != 2 {
			continue // Skip records with invalid month format
		}
		month := strings.ToLower(parts[0])

		floatAmount, err := strconv.ParseFloat(amountStr, 64)
		if err != nil {
			log.Printf("Could not parse amount: %s", amountStr)
			continue
		}
		amount := int64(floatAmount)

		if _, ok := data[month]; !ok {
			data[month] = make(map[string]int64)
		}

		data[month][providerName] += amount
	}

	return data, nil
}

func processFinancialAnalysis(filePath string, amountIdx int) (map[string]map[string]map[string]float64, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("error opening financial analysis file: %v", err)
	}
	defer f.Close()

	r := csv.NewReader(f)
	// Skip header
	if _, err := r.Read(); err != nil {
		return nil, fmt.Errorf("error reading CSV header: %v", err)
	}

	// month -> cptCode -> provider -> amount
	data := make(map[string]map[string]map[string]float64)

	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue // Skip malformed lines
		}

		providerName := strings.TrimSpace(record[0])
		monthStr := strings.TrimSpace(record[1])
		cptCode := strings.TrimSpace(record[2])
		amountStr := record[amountIdx]

		// Extract month from "Month_YYYY" format
		parts := strings.Split(monthStr, "_")
		if len(parts) != 2 {
			continue // Skip records with invalid month format
		}
		month := strings.ToLower(parts[0])

		amount, err := strconv.ParseFloat(strings.TrimSpace(amountStr), 64)
		if err != nil {
			continue // Skip invalid amounts
		}

		if _, ok := data[month]; !ok {
			data[month] = make(map[string]map[string]float64)
		}
		if _, ok := data[month][cptCode]; !ok {
			data[month][cptCode] = make(map[string]float64)
		}

		data[month][cptCode][providerName] += amount
	}

	return data, nil
}

// processRVUsVitalCare reads the RVU data from the specified CSV file and aggregates it by month and provider.
func processRVUsVitalCare(filePath string) (map[string]map[string]int64, error) {
	return processFinancialDataVitalCare(filePath, 7) // RVUs are in column index 8
}

// processTotalVisitsVitalCare reads the Total Visits data from the specified CSV file and aggregates it by month and provider.
func processTotalVisitsVitalCare(filePath string) (map[string]map[string]int64, error) {
	return processFinancialDataVitalCare(filePath, 6) // Total Visits are in column index 7
}

func processChargesVitalCare(filePath string) (map[string]map[string]map[string]float64, error) {
	return processFinancialAnalysis(filePath, 4) // Billed Charge at index 5
}

func processPaymentsVitalCare(filePath string) (map[string]map[string]map[string]float64, error) {
	return processFinancialAnalysis(filePath, 7) // Payment at index 8
}

func processContractualAdjustmentsVitalCare(filePath string) (map[string]map[string]map[string]float64, error) {
	return processFinancialAnalysis(filePath, 11) // Contractual Adjustment at index 12
}

func processUnitsVitalCare(filePath string) (map[string]map[string]map[string]float64, error) {
	return processFinancialAnalysis(filePath, 17) // Units at index 18
}

func processPayrollVitalCare(filePath string) (map[string]map[string]float64, []string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, nil, fmt.Errorf("error opening payroll file: %v", err)
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.FieldsPerRecord = -1 // Disable field count check

	// Skip the first 4 header lines
	for i := 0; i < 4; i++ {
		if _, err := r.Read(); err != nil {
			return nil, nil, fmt.Errorf("error reading CSV header: %v", err)
		}
	}

	data := make(map[string]map[string]float64)
	var currentEmployee string
	employeeSet := make(map[string]struct{})

	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Printf("Error reading CSV record: %v", err)
			continue
		}

		if len(record) < 15 {
			continue // Skip incomplete records
		}

		// Employee name is in column 5 (index 4). If it's not empty, update current employee.
		if strings.TrimSpace(record[4]) != "" {
			currentEmployee = strings.Trim(strings.TrimSpace(record[4]), "\"")
			employeeSet[currentEmployee] = struct{}{}
		}

		if currentEmployee == "" {
			continue // Skip if we haven't identified an employee yet
		}

		// Check date is in column 11 (index 10)
		dateStr := strings.TrimSpace(record[10])
		// Net pay is in column 15 (index 14)
		netPayStr := strings.TrimSpace(record[14])

		if dateStr == "" || netPayStr == "" {
			continue
		}

		// Parse date to get month
		parsedTime, err := time.Parse("01/02/2006", dateStr)
		if err != nil {
			log.Printf("Could not parse date: %s", dateStr)
			continue
		}
		month := strings.ToLower(parsedTime.Month().String())

		// Parse net pay
		netPay, err := strconv.ParseFloat(netPayStr, 64)
		if err != nil {
			log.Printf("Could not parse net pay: %s", netPayStr)
			continue
		}

		if _, ok := data[month]; !ok {
			data[month] = make(map[string]float64)
		}

		data[month][currentEmployee] += netPay
	}

	var uniqueEmployees []string
	for employee := range employeeSet {
		uniqueEmployees = append(uniqueEmployees, strings.TrimSpace(employee))
	}

	return data, uniqueEmployees, nil
}

func getUniqueCPTCodes(filePath string) ([]string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("error opening financial analysis file: %v", err)
	}
	defer f.Close()

	r := csv.NewReader(f)
	// Skip header
	if _, err := r.Read(); err != nil {
		return nil, fmt.Errorf("error reading CSV header: %v", err)
	}

	cptCodeSet := make(map[string]struct{})
	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue // Skip malformed lines
		}

		cptCode := record[2]
		cptCodeSet[cptCode] = struct{}{}
	}

	uniqueCPTCodes := make([]string, 0, len(cptCodeSet))
	for code := range cptCodeSet {
		uniqueCPTCodes = append(uniqueCPTCodes, code)
	}

	return uniqueCPTCodes, nil
}

func processProviderLocationRelationshipVitalCare(filePath string) (map[string][]string, []string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		// Handle error, e.g., log or return err
		return nil, nil, errors.New("failed opening provider location relationship file")
	}
	defer f.Close() // Ensure the file is closed when the function exits

	r := csv.NewReader(f)

	// Skip header row
	_, err = r.Read()
	if err != nil {
		return nil, nil, fmt.Errorf("error reading CSV header: %v", err)
	}

	locationProviderRelationships := make(map[string][]string)
	providerSet := make(map[string]struct{}) // Use a map to store unique provider names

	for {
		record, err := r.Read()
		if err == io.EOF {
			break // End of file
		}
		if err != nil {
			return nil, nil, errors.New("failed reading provider location relationship file")
		}

		providerName := strings.TrimSpace(record[0])
		locationName := strings.TrimSpace(record[1])

		locationProviderRelationships[locationName] = append(locationProviderRelationships[locationName], providerName)
		providerSet[providerName] = struct{}{}
	}

	// Convert the set of providers to a slice
	var uniqueProviders []string
	for provider := range providerSet {
		uniqueProviders = append(uniqueProviders, strings.TrimSpace(provider))
	}

	return locationProviderRelationships, uniqueProviders, nil
}
