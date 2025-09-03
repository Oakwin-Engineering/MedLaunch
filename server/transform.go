package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"sort"
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
	CptCodes        []CptCodeMetric `json:"cptCodes"`
	Total           Metric          `json:"total"`
	TotalVisits     Metric          `json:"totalVisits"`
	Charges         Metric          `json:"charges"`
	Payments        Metric          `json:"payments"`
	RVUs            Metric          `json:"rvus"`
	Payroll         Metric          `json:"payroll"`
	OperatingProfit Metric          `json:"operatingProfit"`
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

func uHealthTransform() ([]byte, error) {
	fmt.Println("Transforming data...")
	// Initialize maps to store merged relationships
	mergedFacilityProviders := make(map[string]map[string]bool)
	mergedProviderFacilities := make(map[string][]string)
	var allProvidersConcat string

	// Process each month's data, build nav bar.
	for _, month := range months {
		allDataPath := fmt.Sprintf("data/%s_all_data.csv", month)

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

	providersPayrollPath := "data/adp.csv"

	// Process payroll data and get provider names from ADP system
	monthlyProviderPayrolls, uniqueADPProviderNames, err := processADPProviderPayrollMonthly(providersPayrollPath)
	if err != nil {
		fmt.Printf("Error processing ADP payroll data: %v\n", err)
		return nil, fmt.Errorf("failed to process ADP payroll data: %v", err)
	}

	// Match provider names between Athelas system and ADP payroll system
	namesMapping, err := matchProviderNames("List 1: "+allProvidersConcat+"List 2: "+uniqueADPProviderNames, true)
	if err != nil {
		fmt.Printf("Error matching provider names: %v\n", err)
		return nil, fmt.Errorf("failed to match provider names: %v", err)
	}

	// Process each month's data
	for _, month := range months {
		// Generate file paths for this month
		chargesByClinicPath := fmt.Sprintf("data/%s_charges_by_clinic.csv", month)
		chargesByProviderPath := fmt.Sprintf("data/%s_charges_by_provider_top.csv", month)
		collectionsByFacilityPath := fmt.Sprintf("data/%s_collections_by_facility.csv", month)
		collectionsByProviderPath := fmt.Sprintf("data/%s_collections_by_provider.csv", month)
		cptCodesByProviderPath := fmt.Sprintf("data/%s_charges_by_provider_bottom.csv", month)

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
			Data:     NodeData{},
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

			// Calculate total visits for future % calculation
			for _, values := range codesValues {
				total := 0.0
				for _, v := range values {
					total += v
				}
				totalVisitsSum += total
			}

			// Create CPT code metrics
			cptCodeMetrics := []CptCodeMetric{}
			for code, values := range codesValues {
				total := 0.0
				for i, v := range values {
					total += v
					totalVisitsByMonth[i] += v
				}
				cptCodeMetrics = append(cptCodeMetrics, CptCodeMetric{
					Code:   code,
					Values: values,
					Total:  total,
					Coding: fmt.Sprintf("%d%%", int((total/totalVisitsSum)*100)),
				})
			}

			// Build the structured data for the provider node
			providerData := NodeData{
				CptCodes: cptCodeMetrics,
				Total: Metric{
					Label:  "Total",
					Values: totalVisitsByMonth,
					Total:  totalVisitsSum,
					Coding: "-",
				},
				TotalVisits: Metric{
					Label:  "Total Visits",
					Values: visitsValues,
					Total:  visitsTotal,
					Coding: "-",
				},
				Charges: Metric{
					Label:  "Charges",
					Values: chargesValues,
					Total:  chargesTotal,
					Coding: "-",
				},
				Payments: Metric{
					Label:  "Payments",
					Values: collectionsValues,
					Total:  collectionsTotal,
					Coding: "-",
				},
				RVUs: Metric{
					Label:  "RVUs",
					Values: make([]float64, 12),
					Total:  0,
					Coding: "-",
				},
				Payroll: Metric{
					Label:  "Payroll",
					Values: payrollValues,
					Total:  payrollTotal,
					Coding: "-",
				},
				OperatingProfit: Metric{
					Label:  "Operating Profit Margin",
					Values: OPMValues,
					Total:  OPMTotal,
					Coding: "-",
				},
			}

			facilityNode.Children = append(facilityNode.Children, &Node{
				ID:       providerID,
				Label:    provider,
				IconType: "person",
				Data:     providerData,
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

		facilityCptCodeMetrics := []CptCodeMetric{}
		for code, values := range facilityCodeValues {
			total := 0.0
			for i, v := range values {
				total += v
				totalVisitsByMonth[i] += v
			}

			facilityCptCodeMetrics = append(facilityCptCodeMetrics, CptCodeMetric{
				Code:   code,
				Values: values,
				Total:  total,
				Coding: fmt.Sprintf("%d%%", int((total/totalVisitsSum)*100)),
			})
		}

		facilityNode.Data = NodeData{
			CptCodes: facilityCptCodeMetrics,
			Total: Metric{
				Label:  "Total",
				Values: totalVisitsByMonth,
				Total:  totalVisitsSum,
				Coding: "-",
			},
			TotalVisits: Metric{
				Label:  "Total Visits",
				Values: facilityVisitsValues,
				Total:  facilityVisitsTotal,
				Coding: "-",
			},
			Charges: Metric{
				Label:  "Charges",
				Values: facilityChargesValues,
				Total:  facilityChargesTotal,
				Coding: "-",
			},
			Payments: Metric{
				Label:  "Payments",
				Values: facilityCollectionsValues,
				Total:  facilityCollectionsTotal,
				Coding: "-",
			},
			RVUs: Metric{
				Label:  "RVUs",
				Values: make([]float64, 12),
				Total:  0,
				Coding: "-",
			},
			Payroll: Metric{
				Label:  "Payroll",
				Values: facilityPayrollValues,
				Total:  facilityPayrollTotal,
				Coding: "-",
			},
			OperatingProfit: Metric{
				Label:  "Operating Profit Margin",
				Values: facilityOPMValues,
				Total:  facilityOPMTotal,
				Coding: "-",
			},
		}

		items = append(items, facilityNode)
	}

	// Create "All Providers" aggregate node
	allProvidersNode := &Node{
		ID:       "all-providers",
		Label:    "All Providers",
		IconType: "clinic",
		Children: []*Node{}, // Empty as requested
	}

	// Aggregate data for all unique providers
	allProvidersChargesValues := make([]float64, 12)
	allProvidersCollectionsValues := make([]float64, 12)
	allProvidersVisitsValues := make([]float64, 12)
	allProvidersPayrollValues := make([]float64, 12)
	allProvidersOPMValues := make([]float64, 12)
	allProvidersCodeValues := make(map[string][]float64)

	// Get a list of all unique provider names
	uniqueProviders := make([]string, 0, len(mergedProviderFacilities))
	for provider := range mergedProviderFacilities {
		uniqueProviders = append(uniqueProviders, provider)
	}

	for _, provider := range uniqueProviders {
		for i, month := range months {
			// Aggregate charges
			if monthData, exists := monthlyProviderTotals[month]; exists {
				if total, ok := monthData[provider]; ok {
					allProvidersChargesValues[i] += total
				}
			}
			// Aggregate collections
			if monthData, exists := monthlyProviderCollections[month]; exists {
				if total, ok := monthData[provider]; ok {
					allProvidersCollectionsValues[i] += total
				}
			}
			// Aggregate visits
			if monthData, exists := monthlyProviderVisits[month]; exists {
				if total, ok := monthData[provider]; ok {
					allProvidersVisitsValues[i] += total
				}
			}
			// Aggregate payroll
			if payroll, exists := monthlyProviderPayrolls[month][namesMapping[provider]]; exists {
				allProvidersPayrollValues[i] += payroll
			}
			// Aggregate codes
			if monthData, exists := monthlyProviderCodes[month]; exists {
				if providerData, ok := monthData[provider]; ok {
					for code, count := range providerData {
						if _, exists := allProvidersCodeValues[code]; !exists {
							allProvidersCodeValues[code] = make([]float64, 12)
						}
						allProvidersCodeValues[code][i] += float64(count)
					}
				}
			}
		}
	}

	// Calculate monthly OPM for all providers
	for i := 0; i < 12; i++ {
		if allProvidersCollectionsValues[i] > 0 && allProvidersPayrollValues[i] > 0 {
			allProvidersOPMValues[i] = allProvidersCollectionsValues[i] - allProvidersPayrollValues[i]
		} else {
			allProvidersOPMValues[i] = 0
		}
	}

	// Calculate totals for all providers
	allProvidersChargesTotal := 0.0
	allProvidersCollectionsTotal := 0.0
	allProvidersVisitsTotal := 0.0
	allProvidersPayrollTotal := 0.0
	allProvidersOPMTotal := 0.0

	for i := 0; i < 12; i++ {
		allProvidersChargesTotal += allProvidersChargesValues[i]
		allProvidersCollectionsTotal += allProvidersCollectionsValues[i]
		allProvidersVisitsTotal += allProvidersVisitsValues[i]
		allProvidersPayrollTotal += allProvidersPayrollValues[i]
		allProvidersOPMTotal += allProvidersOPMValues[i]
	}

	// Calculate total visits for CPT codes for percentage calculation
	var allProvidersTotalVisitsSum float64
	for _, values := range allProvidersCodeValues {
		total := 0.0
		for _, v := range values {
			total += v
		}
		allProvidersTotalVisitsSum += total
	}

	// Add CPT code metrics
	allProvidersCptCodeMetrics := []CptCodeMetric{}
	allProvidersTotalVisitsByMonth := make([]float64, 12)
	for code, values := range allProvidersCodeValues {
		total := 0.0
		for i, v := range values {
			total += v
			allProvidersTotalVisitsByMonth[i] += v
		}

		codingPercentage := 0
		if allProvidersTotalVisitsSum > 0 {
			codingPercentage = int((total / allProvidersTotalVisitsSum) * 100)
		}

		allProvidersCptCodeMetrics = append(allProvidersCptCodeMetrics, CptCodeMetric{
			Code:   code,
			Values: values,
			Total:  total,
			Coding: fmt.Sprintf("%d%%", codingPercentage),
		})
	}

	allProvidersNode.Data = NodeData{
		CptCodes: allProvidersCptCodeMetrics,
		Total: Metric{
			Label:  "Total",
			Values: allProvidersTotalVisitsByMonth,
			Total:  allProvidersTotalVisitsSum,
			Coding: "-",
		},
		TotalVisits: Metric{
			Label:  "Total Visits",
			Values: allProvidersVisitsValues,
			Total:  allProvidersVisitsTotal,
			Coding: "-",
		},
		Charges: Metric{
			Label:  "Charges",
			Values: allProvidersChargesValues,
			Total:  allProvidersChargesTotal,
			Coding: "-",
		},
		Payments: Metric{
			Label:  "Payments",
			Values: allProvidersCollectionsValues,
			Total:  allProvidersCollectionsTotal,
			Coding: "-",
		},
		RVUs: Metric{
			Label:  "RVUs",
			Values: make([]float64, 12),
			Total:  0,
			Coding: "-",
		},
		Payroll: Metric{
			Label:  "Payroll",
			Values: allProvidersPayrollValues,
			Total:  allProvidersPayrollTotal,
			Coding: "-",
		},
		OperatingProfit: Metric{
			Label:  "Operating Profit Margin",
			Values: allProvidersOPMValues,
			Total:  allProvidersOPMTotal,
			Coding: "-",
		},
	}
	items = append(items, allProvidersNode)

	// Sort facilities alphabetically by label, keeping "All Providers" at the beginning
	sort.Slice(items, func(i, j int) bool {
		if items[i].Label == "All Providers" {
			return true // "All Providers" comes first
		}
		if items[j].Label == "All Providers" {
			return false // "All Providers" comes first
		}
		return items[i].Label < items[j].Label // otherwise, sort alphabetically
	})

	// Marshal the data to JSON
	jsonData, err := json.Marshal(items)
	if err != nil {
		return nil, fmt.Errorf("error marshaling JSON: %v", err)
	}

	return jsonData, nil
}

func vitalCareTransform() ([]byte, error) {
	// File paths
	financialAnalysisPath := "data/financial_analysis.csv"
	providerLocationPath := "data/provider_location_relationship.csv"
	rvuPath := "data/rvu.csv"

	// Process financial data
	charges, err := processChargesVitalCare(financialAnalysisPath)
	if err != nil {
		return nil, fmt.Errorf("failed to process charges: %w", err)
	}

	payments, err := processPaymentsVitalCare(financialAnalysisPath)
	if err != nil {
		return nil, fmt.Errorf("failed to process payments: %w", err)
	}
	adjustments, err := processContractualAdjustmentsVitalCare(financialAnalysisPath)
	if err != nil {
		return nil, fmt.Errorf("failed to process contractual adjustments: %w", err)
	}
	uniqueCPTCodes, err := getUniqueCPTCodes(financialAnalysisPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get unique CPT codes: %w", err)
	}

	rvus, err := processRVUsVitalCare(rvuPath)
	if err != nil {
		return nil, fmt.Errorf("failed to process RVUs: %w", err)
	}

	totalVisits, err := processTotalVisitsVitalCare(rvuPath)
	if err != nil {
		return nil, fmt.Errorf("failed to process total visits: %w", err)
	}

	// Process provider-location relationships
	locationProviderMap, uniqueProviders, err := processProviderLocationRelationshipVitalCare(providerLocationPath)
	if err != nil {
		return nil, fmt.Errorf("failed to process provider location relationships: %w", err)
	}

	var items []*Node

	// Create a reverse map for provider to locations
	providerToLocationMap := make(map[string][]string)
	for loc, provs := range locationProviderMap {
		for _, p := range provs {
			providerToLocationMap[p] = append(providerToLocationMap[p], loc)
		}
	}

	// Map to track provider occurrences across all locations
	providerOccurrences := make(map[string]int)

	// Create nodes for each location
	for location, providers := range locationProviderMap {
		locationNode := &Node{
			ID:       slugify(location),
			Label:    location,
			IconType: "clinic",
			Children: []*Node{},
		}

		locationChargesValues := make([]float64, 12)
		locationPaymentsValues := make([]float64, 12)
		locationAdjustmentsValues := make([]float64, 12)
		locationRvusValues := make([]float64, 12)
		locationTotalVisitsValues := make([]float64, 12)
		locationCptData := make(map[string]map[string][]float64)

		for _, providerName := range providers {
			// Get occurrence number for this provider
			providerOccurrences[providerName]++
			occurrence := 1

			// If provider appears in multiple locations, find which occurrence this is
			if len(providerToLocationMap[providerName]) > 1 {
				for i, l := range providerToLocationMap[providerName] {
					if l == location {
						occurrence = i + 1
						break
					}
				}
			}

			// Create provider ID with occurrence number if needed
			providerID := slugify(providerName)
			if len(providerToLocationMap[providerName]) > 1 {
				providerID = fmt.Sprintf("%s_%d", providerID, occurrence)
			}

			providerNode := &Node{
				ID:       providerID,
				Label:    providerName,
				IconType: "person",
			}

			providerChargesValues := make([]float64, 12)
			providerPaymentsValues := make([]float64, 12)
			providerAdjustmentsValues := make([]float64, 12)
			providerRvusValues := make([]float64, 12)
			providerTotalVisitsValues := make([]float64, 12)
			providerCptData := make(map[string]map[string][]float64)

			// Process RVUs and Total Visits once per provider for all months
			for i, month := range months {
				if monthRVUs, ok := rvus[month]; ok {
					if val, ok := monthRVUs[providerName]; ok {
						providerRvusValues[i] = float64(val)
					}
				}
				if monthTotalVisits, ok := totalVisits[month]; ok {
					if val, ok := monthTotalVisits[providerName]; ok {
						providerTotalVisitsValues[i] = float64(val)
					}
				}
			}

			for _, cptCode := range uniqueCPTCodes {
				cptChargesValues := make([]float64, 12)
				dataFound := false

				for i, month := range months {
					if monthCharges, ok := charges[month]; ok {
						if cptCharges, ok := monthCharges[cptCode]; ok {
							if val, ok := cptCharges[providerName]; ok && val != 0 {
								cptChargesValues[i] = val
								providerChargesValues[i] += val
								dataFound = true
							}
						}
					}
					if monthPayments, ok := payments[month]; ok {
						if cptPayments, ok := monthPayments[cptCode]; ok {
							if val, ok := cptPayments[providerName]; ok {
								providerPaymentsValues[i] += val
							}
						}
					}
					if monthAdjustments, ok := adjustments[month]; ok {
						if cptAdjustments, ok := monthAdjustments[cptCode]; ok {
							if val, ok := cptAdjustments[providerName]; ok {
								providerAdjustmentsValues[i] += val
							}
						}
					}
				}

				if dataFound {
					if _, ok := providerCptData[cptCode]; !ok {
						providerCptData[cptCode] = make(map[string][]float64)
						providerCptData[cptCode]["charges"] = make([]float64, 12)
					}
					providerCptData[cptCode]["charges"] = cptChargesValues
				}
			}

			// Aggregate provider CPT data to location
			for cptCode, data := range providerCptData {
				if _, ok := locationCptData[cptCode]; !ok {
					locationCptData[cptCode] = make(map[string][]float64)
					locationCptData[cptCode]["charges"] = make([]float64, 12)
				}
				for i, charge := range data["charges"] {
					locationCptData[cptCode]["charges"][i] += charge
				}
			}

			// Aggregate provider data to location
			for i := 0; i < 12; i++ {
				locationChargesValues[i] += providerChargesValues[i]
				locationPaymentsValues[i] += providerPaymentsValues[i]
				locationAdjustmentsValues[i] += providerAdjustmentsValues[i]
				locationRvusValues[i] += providerRvusValues[i]
				locationTotalVisitsValues[i] += providerTotalVisitsValues[i]
			}

			// Build NodeData for provider
			providerChargesTotal := 0.0
			for _, v := range providerChargesValues {
				providerChargesTotal += v
			}
			providerPaymentsTotal := 0.0
			for _, v := range providerPaymentsValues {
				providerPaymentsTotal += v
			}
			providerRvusTotal := 0.0
			for _, v := range providerRvusValues {
				providerRvusTotal += v
			}
			providerTotalVisitsTotal := 0.0
			for _, v := range providerTotalVisitsValues {
				providerTotalVisitsTotal += v
			}

			providerCptChargesTotalSum := 0.0
			for _, data := range providerCptData {
				for _, v := range data["charges"] {
					providerCptChargesTotalSum += v
				}
			}

			providerCptCodeMetrics := []CptCodeMetric{}
			providerTotalVisitsByMonth := make([]float64, 12)

			for code, data := range providerCptData {
				cptChargesTotal := 0.0
				for i, v := range data["charges"] {
					cptChargesTotal += v
					providerTotalVisitsByMonth[i] += v
				}

				codingPercentage := 0
				if providerCptChargesTotalSum > 0 {
					codingPercentage = int((cptChargesTotal / providerCptChargesTotalSum) * 100)
				}

				providerCptCodeMetrics = append(providerCptCodeMetrics, CptCodeMetric{
					Code:   code,
					Values: data["charges"],
					Total:  cptChargesTotal,
					Coding: fmt.Sprintf("%d%%", codingPercentage),
				})
			}

			providerNode.Data = NodeData{
				CptCodes: providerCptCodeMetrics,
				Total: Metric{
					Label:  "Total",
					Values: providerTotalVisitsByMonth,
					Total:  providerCptChargesTotalSum,
					Coding: "-",
				},
				TotalVisits: Metric{
					Label:  "Total Visits",
					Values: providerTotalVisitsValues,
					Total:  providerTotalVisitsTotal,
					Coding: "-",
				},
				Charges: Metric{
					Label:  "Charges",
					Values: providerChargesValues,
					Total:  providerChargesTotal,
					Coding: "-",
				},
				Payments: Metric{
					Label:  "Payments",
					Values: providerPaymentsValues,
					Total:  providerPaymentsTotal,
					Coding: "-",
				},
				RVUs: Metric{
					Label:  "RVUs",
					Values: providerRvusValues,
					Total:  providerRvusTotal,
					Coding: "-",
				},
				Payroll:         Metric{Label: "Payroll"},
				OperatingProfit: Metric{Label: "Operating Profit Margin"},
			}
			locationNode.Children = append(locationNode.Children, providerNode)
		}

		// Build NodeData for location
		locationChargesTotal := 0.0
		for _, v := range locationChargesValues {
			locationChargesTotal += v
		}
		locationPaymentsTotal := 0.0
		for _, v := range locationPaymentsValues {
			locationPaymentsTotal += v
		}
		locationRvusTotal := 0.0
		for _, v := range locationRvusValues {
			locationRvusTotal += v
		}
		locationTotalVisitsTotal := 0.0
		for _, v := range locationTotalVisitsValues {
			locationTotalVisitsTotal += v
		}

		locationCptChargesTotalSum := 0.0
		for _, data := range locationCptData {
			for _, v := range data["charges"] {
				locationCptChargesTotalSum += v
			}
		}

		locationCptCodeMetrics := []CptCodeMetric{}
		locationTotalVisitsByMonth := make([]float64, 12)

		for code, data := range locationCptData {
			cptChargesTotal := 0.0
			for i, v := range data["charges"] {
				cptChargesTotal += v
				locationTotalVisitsByMonth[i] += v
			}

			codingPercentage := 0
			if locationCptChargesTotalSum > 0 {
				codingPercentage = int((cptChargesTotal / locationCptChargesTotalSum) * 100)
			}

			locationCptCodeMetrics = append(locationCptCodeMetrics, CptCodeMetric{
				Code:   code,
				Values: data["charges"],
				Total:  cptChargesTotal,
				Coding: fmt.Sprintf("%d%%", codingPercentage),
			})
		}

		locationNode.Data = NodeData{
			CptCodes: locationCptCodeMetrics,
			Total: Metric{
				Label:  "Total",
				Values: locationTotalVisitsByMonth,
				Total:  locationCptChargesTotalSum,
				Coding: "-",
			},
			TotalVisits: Metric{
				Label:  "Total Visits",
				Values: locationTotalVisitsValues,
				Total:  locationTotalVisitsTotal,
				Coding: "-",
			},
			Charges: Metric{
				Label:  "Charges",
				Values: locationChargesValues,
				Total:  locationChargesTotal,
				Coding: "-",
			},
			Payments: Metric{
				Label:  "Payments",
				Values: locationPaymentsValues,
				Total:  locationPaymentsTotal,
				Coding: "-",
			},
			RVUs: Metric{
				Label:  "RVUs",
				Values: locationRvusValues,
				Total:  locationRvusTotal,
				Coding: "-",
			},
			Payroll:         Metric{Label: "Payroll"},
			OperatingProfit: Metric{Label: "Operating Profit Margin"},
		}
		items = append(items, locationNode)
	}

	// Create "All Providers" aggregate node
	allProvidersNode := &Node{
		ID:       "all-providers",
		Label:    "All Providers",
		IconType: "clinic",
	}

	allProvidersChargesValues := make([]float64, 12)
	allProvidersPaymentsValues := make([]float64, 12)
	allProvidersAdjustmentsValues := make([]float64, 12)
	allProvidersRvusValues := make([]float64, 12)
	allProvidersTotalVisitsValues := make([]float64, 12)
	allProvidersCptData := make(map[string]map[string][]float64)

	for _, providerName := range uniqueProviders {
		for i, month := range months {
			// Aggregate Charges, Payments, and Adjustments
			for _, cptCode := range uniqueCPTCodes {
				if monthCharges, ok := charges[month]; ok {
					if cptCharges, ok := monthCharges[cptCode]; ok {
						if val, ok := cptCharges[providerName]; ok && val != 0 {
							allProvidersChargesValues[i] += val
							if _, ok := allProvidersCptData[cptCode]; !ok {
								allProvidersCptData[cptCode] = make(map[string][]float64)
								allProvidersCptData[cptCode]["charges"] = make([]float64, 12)
							}
							allProvidersCptData[cptCode]["charges"][i] += val
						}
					}
				}
			}
			if monthPayments, ok := payments[month]; ok {
				for _, cptMap := range monthPayments {
					if val, ok := cptMap[providerName]; ok {
						allProvidersPaymentsValues[i] += val
					}
				}
			}
			if monthAdjustments, ok := adjustments[month]; ok {
				for _, cptMap := range monthAdjustments {
					if val, ok := cptMap[providerName]; ok {
						allProvidersAdjustmentsValues[i] += val
					}
				}
			}
		}
	}

	// Aggregate RVUs and Total Visits for "All Providers"
	for i, month := range months {
		if monthRVUs, ok := rvus[month]; ok {
			for _, rvuVal := range monthRVUs {
				allProvidersRvusValues[i] += float64(rvuVal)
			}
		}
		if monthTotalVisits, ok := totalVisits[month]; ok {
			for _, visitVal := range monthTotalVisits {
				allProvidersTotalVisitsValues[i] += float64(visitVal)
			}
		}
	}

	// Build NodeData for All Providers
	allProvidersChargesTotal := 0.0
	for _, v := range allProvidersChargesValues {
		allProvidersChargesTotal += v
	}
	allProvidersPaymentsTotal := 0.0
	for _, v := range allProvidersPaymentsValues {
		allProvidersPaymentsTotal += v
	}
	allProvidersRvusTotal := 0.0
	for _, v := range allProvidersRvusValues {
		allProvidersRvusTotal += v
	}
	allProvidersTotalVisitsTotal := 0.0
	for _, v := range allProvidersTotalVisitsValues {
		allProvidersTotalVisitsTotal += v
	}

	allProvidersCptChargesTotalSum := 0.0
	for _, data := range allProvidersCptData {
		for _, v := range data["charges"] {
			allProvidersCptChargesTotalSum += v
		}
	}

	allProvidersCptCodeMetrics := []CptCodeMetric{}
	allProvidersTotalVisitsByMonth := make([]float64, 12)

	for code, data := range allProvidersCptData {
		cptChargesTotal := 0.0
		for i, v := range data["charges"] {
			cptChargesTotal += v
			allProvidersTotalVisitsByMonth[i] += v
		}

		codingPercentage := 0
		if allProvidersCptChargesTotalSum > 0 {
			codingPercentage = int((cptChargesTotal / allProvidersCptChargesTotalSum) * 100)
		}

		allProvidersCptCodeMetrics = append(allProvidersCptCodeMetrics, CptCodeMetric{
			Code:   code,
			Values: data["charges"],
			Total:  cptChargesTotal,
			Coding: fmt.Sprintf("%d%%", codingPercentage),
		})
	}

	allProvidersNode.Data = NodeData{
		CptCodes: allProvidersCptCodeMetrics,
		Total: Metric{
			Label:  "Total",
			Values: allProvidersTotalVisitsByMonth,
			Total:  allProvidersCptChargesTotalSum,
			Coding: "-",
		},
		TotalVisits: Metric{
			Label:  "Total Visits",
			Values: allProvidersTotalVisitsValues,
			Total:  allProvidersTotalVisitsTotal,
			Coding: "-",
		},
		Charges: Metric{
			Label:  "Charges",
			Values: allProvidersChargesValues,
			Total:  allProvidersChargesTotal,
			Coding: "-",
		},
		Payments: Metric{
			Label:  "Payments",
			Values: allProvidersPaymentsValues,
			Total:  allProvidersPaymentsTotal,
			Coding: "-",
		},
		RVUs: Metric{
			Label:  "RVUs",
			Values: allProvidersRvusValues,
			Total:  allProvidersRvusTotal,
			Coding: "-",
		},
		Payroll:         Metric{Label: "Payroll"},
		OperatingProfit: Metric{Label: "Operating Profit Margin"},
	}
	items = append(items, allProvidersNode)

	// Sort items alphabetically, keeping "All Providers" at the top
	sort.Slice(items, func(i, j int) bool {
		if items[i].Label == "All Providers" {
			return true
		}
		if items[j].Label == "All Providers" {
			return false
		}
		return items[i].Label < items[j].Label
	})

	return json.Marshal(items)
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
