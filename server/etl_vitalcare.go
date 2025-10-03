package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
	"strings"
	"time"
)

// processFinancialDataVitalCare reads a CSV file and processes financial data for VitalCare.
func processFinancialDataVitalCare(filePath string, amountIdx int) (map[string]map[string]int64, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("error opening financial analysis file: %v", err)
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.FieldsPerRecord = -1

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

		parts := strings.Split(dateStr, "_")
		if len(parts) != 2 {
			continue
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

// processFinancialAnalysisVitalCare processes financial analysis data for VitalCare.
func processFinancialAnalysisVitalCare(filePath string, amountIdx int) (map[string]map[string]map[string]float64, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("error opening financial analysis file: %v", err)
	}
	defer f.Close()

	r := csv.NewReader(f)
	if _, err := r.Read(); err != nil {
		return nil, fmt.Errorf("error reading CSV header: %v", err)
	}

	data := make(map[string]map[string]map[string]float64)

	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue
		}

		providerName := strings.TrimSpace(record[0])
		monthStr := strings.TrimSpace(record[1])
		cptCode := strings.TrimSpace(record[2])
		amountStr := record[amountIdx]

		parts := strings.Split(monthStr, "_")
		if len(parts) != 2 {
			continue
		}
		month := strings.ToLower(parts[0])

		amount, err := strconv.ParseFloat(strings.TrimSpace(amountStr), 64)
		if err != nil {
			continue
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

// processRVUsVitalCare reads RVU data for VitalCare.
func processRVUsVitalCare(filePath string) (map[string]map[string]int64, error) {
	return processFinancialDataVitalCare(filePath, 7)
}

// processTotalVisitsVitalCare reads total visits data for VitalCare.
func processTotalVisitsVitalCare(filePath string) (map[string]map[string]int64, error) {
	return processFinancialDataVitalCare(filePath, 6)
}

// processChargesVitalCare processes charges data for VitalCare.
func processChargesVitalCare(filePath string) (map[string]map[string]map[string]float64, error) {
	return processFinancialAnalysisVitalCare(filePath, 4)
}

// processPaymentsVitalCare processes payments data for VitalCare.
func processPaymentsVitalCare(filePath string) (map[string]map[string]map[string]float64, error) {
	return processFinancialAnalysisVitalCare(filePath, 7)
}

// processContractualAdjustmentsVitalCare processes contractual adjustments for VitalCare.
func processContractualAdjustmentsVitalCare(filePath string) (map[string]map[string]map[string]float64, error) {
	return processFinancialAnalysisVitalCare(filePath, 11)
}

// processUnitsVitalCare processes units data for VitalCare.
func processUnitsVitalCare(filePath string) (map[string]map[string]map[string]float64, error) {
	return processFinancialAnalysisVitalCare(filePath, 17)
}

// processPayrollVitalCare processes payroll data for VitalCare.
func processPayrollVitalCare(filePath string) (map[string]map[string]float64, []string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, nil, fmt.Errorf("error opening payroll file: %v", err)
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.FieldsPerRecord = -1

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
			continue
		}

		if strings.TrimSpace(record[4]) != "" {
			currentEmployee = strings.Trim(strings.TrimSpace(record[4]), "\"")
			employeeSet[currentEmployee] = struct{}{}
		}

		if currentEmployee == "" {
			continue
		}

		dateStr := strings.TrimSpace(record[10])
		netPayStr := strings.TrimSpace(record[14])

		if dateStr == "" || netPayStr == "" {
			continue
		}

		parsedTime, err := time.Parse("01/02/2006", dateStr)
		if err != nil {
			log.Printf("Could not parse date: %s", dateStr)
			continue
		}
		month := strings.ToLower(parsedTime.Month().String())

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

// getUniqueCPTCodesVitalCare gets unique CPT codes for VitalCare.
func getUniqueCPTCodesVitalCare(filePath string) ([]string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("error opening financial analysis file: %v", err)
	}
	defer f.Close()

	r := csv.NewReader(f)
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
			continue
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

// processProviderLocationRelationshipVitalCare processes provider-location relationships for VitalCare.
func processProviderLocationRelationshipVitalCare(filePath string) (map[string][]string, []string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, nil, fmt.Errorf("failed opening provider location relationship file: %w", err)
	}
	defer f.Close()

	r := csv.NewReader(f)

	_, err = r.Read()
	if err != nil {
		return nil, nil, fmt.Errorf("error reading CSV header: %v", err)
	}

	locationProviderRelationships := make(map[string][]string)
	providerSet := make(map[string]struct{}) // Use a map to store unique provider names

	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, nil, fmt.Errorf("failed reading provider location relationship file: %w", err)
		}

		providerName := strings.TrimSpace(record[0])
		locationName := strings.TrimSpace(record[1])

		locationProviderRelationships[locationName] = append(locationProviderRelationships[locationName], providerName)
		providerSet[providerName] = struct{}{}
	}

	var uniqueProviders []string
	for provider := range providerSet {
		uniqueProviders = append(uniqueProviders, strings.TrimSpace(provider))
	}

	return locationProviderRelationships, uniqueProviders, nil
}
