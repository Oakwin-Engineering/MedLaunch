package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"sort"
)

type LocationMapping struct {
	State    string
	Division string
}

func loadStateDivisionMapping(path string) (map[string]LocationMapping, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}

	mapping := make(map[string]LocationMapping)
	for i, record := range records {
		if i == 0 { // Skip header
			continue
		}
		if len(record) >= 3 {
			state := record[0]
			division := record[1]
			location := record[2]
			if state != "" && division != "" && location != "" {
				mapping[location] = LocationMapping{
					State:    state,
					Division: division,
				}
			}
		}
	}

	return mapping, nil
}

func aggregateMetrics(charges, collections, visits, payroll, opm []float64, codes map[string][]float64) NodeData {
	chargesTotal := 0.0
	collectionsTotal := 0.0
	visitsTotal := 0.0
	payrollTotal := 0.0
	opmTotal := 0.0

	for i := 0; i < 12; i++ {
		chargesTotal += charges[i]
		collectionsTotal += collections[i]
		visitsTotal += visits[i]
		payrollTotal += payroll[i]
		opmTotal += opm[i]
	}

	totalVisitsByMonth := make([]float64, 12)
	totalVisitsSum := 0.0

	for _, values := range codes {
		total := 0.0
		for _, v := range values {
			total += v
		}
		totalVisitsSum += total
	}

	cptCodeMetrics := []CptCodeMetric{}
	for code, values := range codes {
		total := 0.0
		for i, v := range values {
			total += v
			totalVisitsByMonth[i] += v
		}

		codingPercentage := 0.0
		if totalVisitsSum > 0 {
			codingPercentage = (total / totalVisitsSum) * 100
		}

		cptCodeMetrics = append(cptCodeMetrics, CptCodeMetric{
			Code:   code,
			Values: values,
			Total:  total,
			Coding: fmt.Sprintf("%.2f%%", codingPercentage),
		})
	}

	return NodeData{
		CptCodes: cptCodeMetrics,
		Total: Metric{
			Label:  "Total",
			Values: totalVisitsByMonth,
			Total:  totalVisitsSum,
			Coding: "-",
		},
		TotalVisits: Metric{
			Label:  "Total Visits",
			Values: visits,
			Total:  visitsTotal,
			Coding: "-",
		},
		Charges: Metric{
			Label:  "Charges",
			Values: charges,
			Total:  chargesTotal,
			Coding: "-",
		},
		Payments: Metric{
			Label:  "Payments",
			Values: collections,
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
			Values: payroll,
			Total:  payrollTotal,
			Coding: "-",
		},
		OperatingProfit: Metric{
			Label:  "Operating Profit Margin",
			Values: opm,
			Total:  opmTotal,
			Coding: "-",
		},
	}
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

	// Load state and division mapping
	locationMapping, err := loadStateDivisionMapping("data/state_division_mapping.csv")
	if err != nil {
		return nil, fmt.Errorf("failed to load location mapping: %v", err)
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

	fmt.Println(namesMapping)

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

	// Create the final hierarchical structure
	states := make(map[string]map[string][]*Node)

	// Convert the map to our desired structure
	for facility, providers := range mergedFacilityProviders {
		mapping, ok := locationMapping[facility]
		if !ok {
			continue // Skip facilities not in the mapping file
		}

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
				codingPercentage := 0.0
				if totalVisitsSum > 0 {
					codingPercentage = (total / totalVisitsSum) * 100
				}
				cptCodeMetrics = append(cptCodeMetrics, CptCodeMetric{
					Code:   code,
					Values: values,
					Total:  total,
					Coding: fmt.Sprintf("%.2f%%", codingPercentage),
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

			codingPercentage := 0.0
			if totalVisitsSum > 0 {
				codingPercentage = (total / totalVisitsSum) * 100
			}

			facilityCptCodeMetrics = append(facilityCptCodeMetrics, CptCodeMetric{
				Code:   code,
				Values: values,
				Total:  total,
				Coding: fmt.Sprintf("%.2f%%", codingPercentage),
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

		// Add the facility node to the correct state and division
		if _, exists := states[mapping.State]; !exists {
			states[mapping.State] = make(map[string][]*Node)
		}
		states[mapping.State][mapping.Division] = append(states[mapping.State][mapping.Division], facilityNode)
	}

	var items []*Node

	// Build the final hierarchy and aggregate data upwards
	for stateName, divisions := range states {
		stateNode := &Node{
			ID:       slugify(stateName),
			Label:    stateName,
			IconType: "state",
			Children: []*Node{},
		}

		stateChargesValues := make([]float64, 12)
		stateCollectionsValues := make([]float64, 12)
		stateVisitsValues := make([]float64, 12)
		statePayrollValues := make([]float64, 12)
		stateOPMValues := make([]float64, 12)
		stateCodeValues := make(map[string][]float64)

		for divisionName, facilityNodes := range divisions {
			divisionNode := &Node{
				ID:       slugify(divisionName),
				Label:    divisionName,
				IconType: "division",
				Children: facilityNodes,
			}

			divisionChargesValues := make([]float64, 12)
			divisionCollectionsValues := make([]float64, 12)
			divisionVisitsValues := make([]float64, 12)
			divisionPayrollValues := make([]float64, 12)
			divisionOPMValues := make([]float64, 12)
			divisionCodeValues := make(map[string][]float64)

			for _, facilityNode := range facilityNodes {
				for i := 0; i < 12; i++ {
					divisionChargesValues[i] += facilityNode.Data.Charges.Values[i]
					divisionCollectionsValues[i] += facilityNode.Data.Payments.Values[i]
					divisionVisitsValues[i] += facilityNode.Data.TotalVisits.Values[i]
					divisionPayrollValues[i] += facilityNode.Data.Payroll.Values[i]
				}
				for _, cptCode := range facilityNode.Data.CptCodes {
					if _, exists := divisionCodeValues[cptCode.Code]; !exists {
						divisionCodeValues[cptCode.Code] = make([]float64, 12)
					}
					for i := 0; i < 12; i++ {
						divisionCodeValues[cptCode.Code][i] += cptCode.Values[i]
					}
				}
			}

			for i := 0; i < 12; i++ {
				if divisionCollectionsValues[i] > 0 && divisionPayrollValues[i] > 0 {
					divisionOPMValues[i] = divisionCollectionsValues[i] - divisionPayrollValues[i]
				} else {
					divisionOPMValues[i] = 0
				}
			}

			divisionNode.Data = aggregateMetrics(divisionChargesValues, divisionCollectionsValues, divisionVisitsValues, divisionPayrollValues, divisionOPMValues, divisionCodeValues)
			stateNode.Children = append(stateNode.Children, divisionNode)

			for i := 0; i < 12; i++ {
				stateChargesValues[i] += divisionChargesValues[i]
				stateCollectionsValues[i] += divisionCollectionsValues[i]
				stateVisitsValues[i] += divisionVisitsValues[i]
				statePayrollValues[i] += divisionPayrollValues[i]
			}
			for code, values := range divisionCodeValues {
				if _, exists := stateCodeValues[code]; !exists {
					stateCodeValues[code] = make([]float64, 12)
				}
				for i := 0; i < 12; i++ {
					stateCodeValues[code][i] += values[i]
				}
			}
		}

		for i := 0; i < 12; i++ {
			if stateCollectionsValues[i] > 0 && statePayrollValues[i] > 0 {
				stateOPMValues[i] = stateCollectionsValues[i] - statePayrollValues[i]
			} else {
				stateOPMValues[i] = 0
			}
		}

		stateNode.Data = aggregateMetrics(stateChargesValues, stateCollectionsValues, stateVisitsValues, statePayrollValues, stateOPMValues, stateCodeValues)
		items = append(items, stateNode)
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

		codingPercentage := 0.0
		if allProvidersTotalVisitsSum > 0 {
			codingPercentage = (total / allProvidersTotalVisitsSum) * 100
		}

		allProvidersCptCodeMetrics = append(allProvidersCptCodeMetrics, CptCodeMetric{
			Code:   code,
			Values: values,
			Total:  total,
			Coding: fmt.Sprintf("%.2f%%", codingPercentage),
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

	// Sort states, divisions, and facilities alphabetically
	sort.Slice(items, func(i, j int) bool {
		return items[i].Label < items[j].Label
	})

	for _, stateNode := range items {
		sort.Slice(stateNode.Children, func(i, j int) bool {
			return stateNode.Children[i].Label < stateNode.Children[j].Label
		})
		for _, divisionNode := range stateNode.Children {
			sort.Slice(divisionNode.Children, func(i, j int) bool {
				return divisionNode.Children[i].Label < divisionNode.Children[j].Label
			})
		}
	}

	// Prepend "All Providers" node to the beginning of the items slice
	items = append([]*Node{allProvidersNode}, items...)

	// Marshal the data to JSON
	jsonData, err := json.Marshal(items)
	if err != nil {
		return nil, fmt.Errorf("error marshaling JSON: %v", err)
	}

	return jsonData, nil
}
