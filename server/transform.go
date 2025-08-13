package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sort"
)

// Node represents a facility or provider in the hierarchy
type Node struct {
	ID       string       `json:"id"`
	Label    string       `json:"label"`
	IconType string       `json:"iconType"`
	Data     []MetricData `json:"data"`
	Children []*Node      `json:"children,omitempty"`
}

// MetricData represents metric information for a node
type MetricData struct {
	Section         string    `json:"section"`
	Type            string    `json:"type"`
	Label           string    `json:"label,omitempty"`
	Code            string    `json:"code,omitempty"`
	Values          []float64 `json:"values"`
	Total           float64   `json:"total"`
	Coding          string    `json:"coding"`
	ColorGroup      string    `json:"colorGroup"`
	IsCurrency      bool      `json:"isCurrency,omitempty"`
	IsSectionHeader bool      `json:"isSectionHeader,omitempty"`
}

// transformData processes all CSV files and returns the JSON data
func transformData() ([]byte, error) {
	fmt.Println("Transforming data...")
	// Initialize maps to store merged relationships
	mergedFacilityProviders := make(map[string]map[string]bool)
	mergedProviderFacilities := make(map[string][]string)
	var allProvidersConcat string

	// Process each month's data, build nav bar.
	for _, month := range months {
		allDataPath := fmt.Sprintf("data/athelas/%s/%s_all_data.csv", month, month)

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
			allProvidersConcat += "[" + provider + "]"
			for _, facility := range facilities {
				if !contains(mergedProviderFacilities[provider], facility) {
					mergedProviderFacilities[provider] = append(mergedProviderFacilities[provider], facility)
				}
			}
		}
	}

	// If no data was processed, return error
	if len(mergedFacilityProviders) == 0 || len(mergedProviderFacilities) == 0 {
		return nil, fmt.Errorf("no data found to process")
	}

	// Initialize maps to store data for each month
	monthlyFacilityTotals := make(map[string]map[string]float64)
	monthlyProviderTotals := make(map[string]map[string]float64)
	monthlyFacilityCollections := make(map[string]map[string]float64)
	monthlyProviderCollections := make(map[string]map[string]float64)
	monthlyProviderCodes := make(map[string]map[string]map[string]int)
	monthlyFacilityVisits := make(map[string]map[string]float64)
	monthlyProviderVisits := make(map[string]map[string]float64)

	providersPayrollPath := "data/adp/adp.csv"

	// Process payroll data and get provider names from ADP system
	monthlyProviderPayrolls, uniqueADPProviderNames, err := processADPProviderPayrollMonthly(providersPayrollPath)
	if err != nil {
		fmt.Printf("Error processing ADP payroll data: %v\n", err)
		return nil, fmt.Errorf("failed to process ADP payroll data: %v", err)
	}

	// Match provider names between Athelas system and ADP payroll system
	namesMapping, err := matchProviderNames("List 1: "+allProvidersConcat+"List 2: "+uniqueADPProviderNames, false)
	if err != nil {
		fmt.Printf("Error matching provider names: %v\n", err)
		return nil, fmt.Errorf("failed to match provider names: %v", err)
	}

	// Process each month's data
	for _, month := range months {
		// Generate file paths for this month
		chargesByClinicPath := fmt.Sprintf("data/athelas/%s/%s_charges_by_clinic.csv", month, month)
		chargesByProviderPath := fmt.Sprintf("data/athelas/%s/%s_charges_by_provider_top.csv", month, month)
		collectionsByFacilityPath := fmt.Sprintf("data/athelas/%s/%s_collections_by_facility.csv", month, month)
		collectionsByProviderPath := fmt.Sprintf("data/athelas/%s/%s_collections_by_provider.csv", month, month)
		cptCodesByProviderPath := fmt.Sprintf("data/athelas/%s/%s_charges_by_provider_bottom.csv", month, month)

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

		// Process visits for providers
		if providerVisits, err := processVisitsByProvider(chargesByProviderPath); err == nil {
			monthlyProviderVisits[month] = providerVisits
		}
	}

	// Map to track provider occurrences across all facilities
	providerOccurrences := make(map[string]int)

	// Create the final items slice
	var items []*Node

	// Convert the map to our desired structure
	for facility, providers := range mergedFacilityProviders {

		facilityNode := &Node{
			ID:       slugify(facility),
			Label:    facility,
			IconType: "clinic",
			Data:     nil,
			Children: []*Node{},
		}

		// Build facility metrics data
		facilityChargesValues := make([]float64, 12)
		facilityCollectionsValues := make([]float64, 12)
		facilityVisitsValues := make([]float64, 12)
		facilityCodeValues := make(map[string][]float64)
		facilityPayrollValues := make([]float64, 12)
		facilityOPMValues := make([]float64, 12)

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
			payrollValues := make([]float64, 12)
			OPMValues := make([]float64, 12)

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

				// Get payroll
				if payroll, exists := monthlyProviderPayrolls[month][namesMapping[provider]]; exists {
					payrollValues[i] = payroll
					facilityPayrollValues[i] += payroll
				}

				// Get operating profit margin
				if collectionsValues[i] == 0 || payrollValues[i] == 0 {
					OPMValues[i] = 0
				} else {
					OPMValues[i] = collectionsValues[i] - payrollValues[i]
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
			payrollTotal := 0.0
			OPMTotal := 0.0

			for _, v := range chargesValues {
				chargesTotal += v
			}
			for _, v := range collectionsValues {
				collectionsTotal += v
			}
			for _, v := range visitsValues {
				visitsTotal += v
			}
			for _, v := range payrollValues {
				payrollTotal += v
			}
			for _, v := range OPMValues {
				OPMTotal += v
			}

			// Calculate total visits across all CPT codes
			totalVisitsByMonth := make([]float64, 12)
			totalVisitsSum := 0.0

			// Initialize baseData with CPT codes first
			baseData := []MetricData{}

			// Calculate total visits for future % calcuation
			for _, values := range codesValues {
				total := 0.0
				for _, v := range values {
					total += v
				}
				totalVisitsSum += total
			}

			// Add code metrics and calculate totals
			for code, values := range codesValues {
				total := 0.0
				for i, v := range values {
					total += v
					totalVisitsByMonth[i] += v
				}

				baseData = append(baseData, MetricData{
					Section:    "CPT Codes",
					Type:       "data",
					Code:       code,
					Values:     values,
					Total:      total,
					Coding:     fmt.Sprintf("%d%%", int((total/totalVisitsSum)*100)),
					ColorGroup: "yellow",
				})
			}

			// Add total visits metric
			baseData = append(baseData, MetricData{
				Section:    "CPT Codes",
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
				ColorGroup:      "lightPink",
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

			baseData = append(baseData, MetricData{
				Section:         "Payroll",
				Type:            "data",
				Label:           "Payroll",
				Values:          payrollValues,
				Total:           payrollTotal,
				Coding:          "-",
				ColorGroup:      "orange",
				IsSectionHeader: true,
				IsCurrency:      true,
			})

			baseData = append(baseData, MetricData{
				Section:         "Operating Profit Margin",
				Type:            "data",
				Label:           "Operating Profit Margin",
				Values:          OPMValues,
				Total:           OPMTotal,
				Coding:          "-",
				ColorGroup:      "-",
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

			// Get operating profit margin
			if facilityCollectionsValues[i] == 0 || facilityPayrollValues[i] == 0 {
				facilityOPMValues[i] = 0
			} else {
				facilityOPMValues[i] = facilityCollectionsValues[i] - facilityPayrollValues[i]
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
		facilityPayrollTotal := 0.0
		facilityOPMTotal := 0.0

		for i := 0; i < 12; i++ {
			facilityChargesTotal += facilityChargesValues[i]
			facilityCollectionsTotal += facilityCollectionsValues[i]
			facilityVisitsTotal += facilityVisitsValues[i]
			facilityPayrollTotal += facilityPayrollValues[i]
			facilityOPMTotal += facilityOPMValues[i]
		}

		// Build facility metrics data
		facilityData := []MetricData{}

		// Add CPT code metrics first
		totalVisitsByMonth := make([]float64, 12)
		totalVisitsSum := 0.0

		for _, values := range facilityCodeValues {
			total := 0.0
			for _, v := range values {
				total += v
			}
			totalVisitsSum += total
		}

		for code, values := range facilityCodeValues {
			total := 0.0
			for i, v := range values {
				total += v
				totalVisitsByMonth[i] += v
			}
			totalVisitsSum += total

			facilityData = append(facilityData, MetricData{
				Section:    "CPT Codes",
				Type:       "data",
				Code:       code,
				Values:     values,
				Total:      total,
				Coding:     fmt.Sprintf("%d%%", int((total/totalVisitsSum)*100)),
				ColorGroup: "yellow",
			})
		}

		// Add total visits metric
		facilityData = append(facilityData, MetricData{
			Section:    "CPT Codes",
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
			Label:      "Total Visits",
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
			ColorGroup:      "lightPink",
			IsSectionHeader: true,
			IsCurrency:      true,
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
			IsCurrency:      true,
		})

		facilityData = append(facilityData, MetricData{
			Section:         "Payroll",
			Type:            "data",
			Label:           "Payroll",
			Values:          facilityPayrollValues,
			Total:           facilityPayrollTotal,
			Coding:          "-",
			ColorGroup:      "orange",
			IsSectionHeader: true,
			IsCurrency:      true,
		})

		facilityData = append(facilityData, MetricData{
			Section:         "Operating Profit Margin",
			Type:            "data",
			Label:           "Operating Profit Margin",
			Values:          facilityOPMValues,
			Total:           facilityOPMTotal,
			Coding:          "-",
			ColorGroup:      "-",
			IsSectionHeader: true,
			IsCurrency:      true,
		})

		facilityNode.Data = facilityData

		items = append(items, facilityNode)
	}

	// Sort facilities alphabetically by label
	sort.Slice(items, func(i, j int) bool {
		return items[i].Label < items[j].Label
	})

	// Marshal the data to JSON
	jsonData, err := json.Marshal(items)
	if err != nil {
		return nil, fmt.Errorf("error marshaling JSON: %v", err)
	}

	return jsonData, nil
}
