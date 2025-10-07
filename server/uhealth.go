package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sort"
)

var CPT_CODE_MAPPING_UHEALTH = map[string]string{
	"": "",
}

type UHealthDataSources struct {
	monthlyFacilityTotals      map[string]map[string]float64
	monthlyProviderTotals      map[string]map[string]float64
	monthlyFacilityCollections map[string]map[string]float64
	monthlyProviderCollections map[string]map[string]float64
	monthlyProviderCodes       map[string]map[string]map[string]int
	monthlyFacilityVisits      map[string]map[string]float64
	monthlyProviderVisits      map[string]map[string]float64
	monthlyProviderPayrolls    map[string]map[string]float64
	uniqueADPProviderNames     []string
}

type UHealthMetricBuilder struct {
	charges     []float64
	collections []float64
	visits      []float64
	payroll     []float64
	codes       map[string][]float64
}

type LocationMapping struct {
	State    string
	Division string
}

func newUHealthMetricBuilder() *UHealthMetricBuilder {
	return &UHealthMetricBuilder{
		charges:     make([]float64, 12),
		collections: make([]float64, 12),
		visits:      make([]float64, 12),
		payroll:     make([]float64, 12),
		codes:       make(map[string][]float64),
	}
}

func (mb *UHealthMetricBuilder) aggregate(other *UHealthMetricBuilder) {
	for i := 0; i < 12; i++ {
		mb.charges[i] += other.charges[i]
		mb.collections[i] += other.collections[i]
		mb.visits[i] += other.visits[i]
		mb.payroll[i] += other.payroll[i]
	}

	for code, values := range other.codes {
		if _, ok := mb.codes[code]; !ok {
			mb.codes[code] = make([]float64, 12)
		}
		for i, v := range values {
			mb.codes[code][i] += v
		}
	}
}

func (mb *UHealthMetricBuilder) buildNodeData() NodeData {
	// Calculate totals
	chargesTotal := sum(mb.charges)
	collectionsTotal := sum(mb.collections)
	visitsTotal := sum(mb.visits)
	payrollTotal := sum(mb.payroll)

	// Calculate OPM
	opmValues := make([]float64, 12)
	for i := 0; i < 12; i++ {
		if mb.collections[i] > 0 && mb.payroll[i] > 0 {
			opmValues[i] = mb.collections[i] - mb.payroll[i]
		}
	}
	opmTotal := sum(opmValues)

	// Calculate derived metrics
	chargePerPatient := divideArrays(mb.charges, mb.visits)
	paymentPercentOfCharges := percentageArrays(mb.collections, mb.charges)
	averageReceiptsPerPatient := divideArrays(mb.collections, mb.visits)

	// Build CPT metrics
	cptMetrics, totalMetric := mb.buildCPTMetrics()

	return NodeData{
		CptCodes:                    cptMetrics,
		CptCodingTotal:              totalMetric,
		TotalVisits:                 createMetric("Total Visits", mb.visits, visitsTotal),
		Charges:                     createMetric("Charges", mb.charges, chargesTotal),
		Payments:                    createMetric("Payments", mb.collections, collectionsTotal),
		Payroll:                     createMetric("Payroll", mb.payroll, payrollTotal),
		OperatingProfit:             createMetric("Operating Profit", opmValues, opmTotal),
		ChargePerPatient:            createMetric("Charges per Patient", chargePerPatient, 0),
		PaymentPercentOfCharges:     createMetric("Payment % of Charges", paymentPercentOfCharges, 0),
		AverageReceiptsPerPatient:   createMetric("Average Receipts per Patient", averageReceiptsPerPatient, 0),
		RvuPerPatient:               createMetric("RVUs per Patient", []float64{}, 0),
		Adjustments:                 createMetric("Adjustments", []float64{}, 0),
		AdjustmentPercentOfCharges:  createMetric("Adjustments % of Charges", []float64{}, 0),
		RVUs:                        createMetric("RVUs", []float64{}, 0),
		PatientCountTotal:           createMetric("Total", []float64{}, 0),
		NPWellnessVisitTotal:        createMetric("Total", []float64{}, 0),
		MedicareAnnualWellnessTotal: createMetric("Total", []float64{}, 0),
		FollowUpPatientTotal:        createMetric("Total", []float64{}, 0),
	}
}

func (mb *UHealthMetricBuilder) buildCPTMetrics() ([]CptCodeMetric, Metric) {
	totalVisitsSum := 0.0
	for _, values := range mb.codes {
		totalVisitsSum += sum(values)
	}

	metrics := []CptCodeMetric{}
	totalVisitsByMonth := make([]float64, 12)

	for code, values := range mb.codes {
		codeTotal := sum(values)

		for i, v := range values {
			totalVisitsByMonth[i] += v
		}

		label := CPT_CODE_MAPPING_UHEALTH[code]
		if label == "" {
			label = "CPT Coding"
		}

		metrics = append(metrics, CptCodeMetric{
			Code:   code,
			Values: values,
			Total:  codeTotal,
			Coding: formatPercentage(codeTotal, totalVisitsSum),
			Label:  label,
		})
	}

	totalMetric := createMetric("Total", totalVisitsByMonth, totalVisitsSum)
	return metrics, totalMetric
}

func loadUHealthDataSources(year string) (*UHealthDataSources, error) {
	ds := &UHealthDataSources{
		monthlyFacilityTotals:      make(map[string]map[string]float64),
		monthlyProviderTotals:      make(map[string]map[string]float64),
		monthlyFacilityCollections: make(map[string]map[string]float64),
		monthlyProviderCollections: make(map[string]map[string]float64),
		monthlyProviderCodes:       make(map[string]map[string]map[string]int),
		monthlyFacilityVisits:      make(map[string]map[string]float64),
		monthlyProviderVisits:      make(map[string]map[string]float64),
	}

	// Process payroll data
	var err error
	ds.monthlyProviderPayrolls, ds.uniqueADPProviderNames, err = processADPProviderPayrollMonthlyUHealth(fmt.Sprintf("data/%s/adp.csv", year))
	if err != nil {
		return nil, fmt.Errorf("failed to process ADP payroll data: %w", err)
	}

	// Process each month's data
	for _, month := range months {
		// Generate file paths
		chargesByClinicPath := fmt.Sprintf("data/%s/%s_charges_by_clinic.csv", year, month)
		chargesByProviderPath := fmt.Sprintf("data/%s/%s_charges_by_provider_top.csv", year, month)
		collectionsByFacilityPath := fmt.Sprintf("data/%s/%s_collections_by_facility.csv", year, month)
		collectionsByProviderPath := fmt.Sprintf("data/%s/%s_collections_by_provider.csv", year, month)
		cptCodesByProviderPath := fmt.Sprintf("data/%s/%s_charges_by_provider_bottom.csv", year, month)

		// Load all data for this month
		if facilityTotals, err := processChargesByClinicUHealth(chargesByClinicPath); err == nil {
			ds.monthlyFacilityTotals[month] = facilityTotals
		}
		if facilityVisits, err := processVisitsByClinicUHealth(chargesByClinicPath); err == nil {
			ds.monthlyFacilityVisits[month] = facilityVisits
		}
		if providerTotals, err := processChargesByProviderUHealth(chargesByProviderPath); err == nil {
			ds.monthlyProviderTotals[month] = providerTotals
		}
		if facilityCollections, err := processCollectionsByFacilityUHealth(collectionsByFacilityPath); err == nil {
			ds.monthlyFacilityCollections[month] = facilityCollections
		}
		if providerCollections, err := processCollectionsByProviderUHealth(collectionsByProviderPath); err == nil {
			ds.monthlyProviderCollections[month] = providerCollections
		}
		if providerCodes, err := processProviderCodeRelationshipsUHealth(cptCodesByProviderPath); err == nil {
			ds.monthlyProviderCodes[month] = providerCodes
		}
		if providerVisits, err := processVisitsByProviderUHealth(chargesByProviderPath); err == nil {
			ds.monthlyProviderVisits[month] = providerVisits
		}
	}

	return ds, nil
}

func createProviderNodeUHealth(provider string, ds *UHealthDataSources, namesMapping map[string]string) *UHealthMetricBuilder {
	builder := newUHealthMetricBuilder()

	for i, month := range months {
		// Get charges

		if monthData, exists := ds.monthlyProviderTotals[month]; exists {
			if total, ok := monthData[provider]; ok {
				builder.charges[i] = total
			}
		}
		// Get collections
		if monthData, exists := ds.monthlyProviderCollections[month]; exists {
			if total, ok := monthData[provider]; ok {
				builder.collections[i] = total
			}
		}
		// Get visits
		if monthData, exists := ds.monthlyProviderVisits[month]; exists {
			if total, ok := monthData[provider]; ok {
				builder.visits[i] = total
			}
		}
		// Get payroll
		if payroll, exists := ds.monthlyProviderPayrolls[month][namesMapping[provider]]; exists {
			builder.payroll[i] = payroll
		}
		// Get codes
		if monthData, exists := ds.monthlyProviderCodes[month]; exists {
			if providerData, ok := monthData[provider]; ok {
				for code, count := range providerData {
					if _, exists := builder.codes[code]; !exists {
						builder.codes[code] = make([]float64, 12)
					}
					builder.codes[code][i] = float64(count)
				}
			}
		}
	}

	return builder
}

func createFacilityNodeUHealth(facility string, providers map[string]bool, ds *UHealthDataSources, namesMapping map[string]string, providerToFacilityMap map[string][]string) *Node {
	facilityNode := &Node{
		ID:       slugify(facility),
		Label:    facility,
		IconType: "clinic",
		Children: []*Node{},
	}

	facilityBuilder := newUHealthMetricBuilder()
	providerOccurrences := make(map[string]int)

	// Process each provider
	for provider := range providers {
		providerOccurrences[provider]++
		occurrence := getFacilityOccurrence(provider, facility, providerToFacilityMap)
		providerID := generateProviderIDForFacility(provider, occurrence, providerToFacilityMap)

		// Build provider metrics
		providerBuilder := createProviderNodeUHealth(provider, ds, namesMapping)

		// Create provider node
		providerNode := &Node{
			ID:       providerID,
			Label:    provider,
			IconType: "person",
			Data:     providerBuilder.buildNodeData(),
		}

		// Aggregate to facility
		facilityBuilder.aggregate(providerBuilder)
		facilityNode.Children = append(facilityNode.Children, providerNode)
	}

	// Also add facility-level metrics directly from data sources
	for i, month := range months {
		if monthData, exists := ds.monthlyFacilityTotals[month]; exists {
			if total, ok := monthData[facility]; ok {
				facilityBuilder.charges[i] = total
			}
		}
		if monthData, exists := ds.monthlyFacilityCollections[month]; exists {
			if total, ok := monthData[facility]; ok {
				facilityBuilder.collections[i] = total
			}
		}
		if monthData, exists := ds.monthlyFacilityVisits[month]; exists {
			if total, ok := monthData[facility]; ok {
				facilityBuilder.visits[i] = total
			}
		}
	}

	facilityNode.Data = facilityBuilder.buildNodeData()
	return facilityNode
}

func getFacilityOccurrence(provider, facility string, providerToFacilityMap map[string][]string) int {
	if len(providerToFacilityMap[provider]) > 1 {
		for i, f := range providerToFacilityMap[provider] {
			if f == facility {
				return i + 1
			}
		}
	}
	return 1
}

func generateProviderIDForFacility(provider string, occurrence int, providerToFacilityMap map[string][]string) string {
	providerID := slugify(provider)
	if len(providerToFacilityMap[provider]) > 1 {
		providerID = fmt.Sprintf("%s_%d", providerID, occurrence)
	}
	return providerID
}

func processYearDataUHealth(year string) ([]*Node, error) {
	// Process provider-facility relationships
	mergedFacilityProviders := make(map[string]map[string]bool)
	mergedProviderFacilities := make(map[string][]string)

	for _, month := range months {
		allDataPath := fmt.Sprintf("data/%s/%s_all_data.csv", year, month)
		if _, err := os.Stat(allDataPath); os.IsNotExist(err) {
			continue
		}

		facilityProviders, providerFacilities := processProviderFacilityRelationshipsUHealth(allDataPath)
		if facilityProviders == nil || providerFacilities == nil {
			continue
		}

		// Merge relationships
		for facility, providers := range facilityProviders {
			if _, exists := mergedFacilityProviders[facility]; !exists {
				mergedFacilityProviders[facility] = make(map[string]bool)
			}
			for provider := range providers {
				mergedFacilityProviders[facility][provider] = true
			}
		}

		for provider, facilities := range providerFacilities {
			for _, facility := range facilities {
				if !contains(mergedProviderFacilities[provider], facility) {
					mergedProviderFacilities[provider] = append(mergedProviderFacilities[provider], facility)
				}
			}
		}
	}

	if len(mergedFacilityProviders) == 0 {
		return nil, fmt.Errorf("no data found to process for year %s", year)
	}

	// Load location mapping
	locationMapping, err := loadStateDivisionMapping(fmt.Sprintf("data/%s/state_division_mapping.csv", year))
	if err != nil {
		return nil, fmt.Errorf("failed to load location mapping: %v", err)
	}

	// Load all data sources
	ds, err := loadUHealthDataSources(year)
	if err != nil {
		return nil, err
	}

	// Get unique providers and match names
	uniqueAthelasProviders := make([]string, 0, len(mergedProviderFacilities))
	for provider := range mergedProviderFacilities {
		uniqueAthelasProviders = append(uniqueAthelasProviders, provider)
	}
	namesMapping := MatchNames(uniqueAthelasProviders, ds.uniqueADPProviderNames)

	// Build hierarchy
	states := make(map[string]map[string][]*Node)

	for facility, providers := range mergedFacilityProviders {
		mapping, ok := locationMapping[facility]
		if !ok {
			continue
		}

		facilityNode := createFacilityNodeUHealth(facility, providers, ds, namesMapping, mergedProviderFacilities)

		if _, exists := states[mapping.State]; !exists {
			states[mapping.State] = make(map[string][]*Node)
		}
		states[mapping.State][mapping.Division] = append(states[mapping.State][mapping.Division], facilityNode)
	}

	var items []*Node

	// Build state and division nodes with aggregation
	for stateName, divisions := range states {
		stateNode := &Node{
			ID:       slugify(stateName),
			Label:    stateName,
			IconType: "state",
			Children: []*Node{},
		}

		stateBuilder := newUHealthMetricBuilder()

		for divisionName, facilityNodes := range divisions {
			divisionNode := &Node{
				ID:       slugify(divisionName),
				Label:    divisionName,
				IconType: "division",
				Children: facilityNodes,
			}

			divisionBuilder := newUHealthMetricBuilder()

			// Aggregate facility data to division
			for _, facilityNode := range facilityNodes {
				for i := 0; i < 12; i++ {
					divisionBuilder.charges[i] += facilityNode.Data.Charges.Values[i]
					divisionBuilder.collections[i] += facilityNode.Data.Payments.Values[i]
					divisionBuilder.visits[i] += facilityNode.Data.TotalVisits.Values[i]
					divisionBuilder.payroll[i] += facilityNode.Data.Payroll.Values[i]
				}
				for _, cptCode := range facilityNode.Data.CptCodes {
					if _, exists := divisionBuilder.codes[cptCode.Code]; !exists {
						divisionBuilder.codes[cptCode.Code] = make([]float64, 12)
					}
					for i := 0; i < 12; i++ {
						divisionBuilder.codes[cptCode.Code][i] += cptCode.Values[i]
					}
				}
			}

			divisionNode.Data = divisionBuilder.buildNodeData()
			stateNode.Children = append(stateNode.Children, divisionNode)

			// Aggregate division to state
			stateBuilder.aggregate(divisionBuilder)
		}

		stateNode.Data = stateBuilder.buildNodeData()
		items = append(items, stateNode)
	}

	// Create "All Providers" node
	allProvidersBuilder := newUHealthMetricBuilder()

	for _, provider := range uniqueAthelasProviders {
		providerBuilder := createProviderNodeUHealth(provider, ds, namesMapping)
		allProvidersBuilder.aggregate(providerBuilder)
	}

	allProvidersNode := &Node{
		ID:       "all-providers",
		Label:    "All Providers",
		IconType: "clinic",
		Data:     allProvidersBuilder.buildNodeData(),
	}

	// Sort and prepend "All Providers"
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

	items = append([]*Node{allProvidersNode}, items...)

	return items, nil
}

func uHealthTransform() ([]byte, error) {
	years, err := getYearDirectories("data")
	if err != nil {
		return nil, fmt.Errorf("failed to get year directories: %w", err)
	}

	allYearsData := make(map[string][]*Node)

	for _, year := range years {
		items, err := processYearDataUHealth(year)
		if err != nil {
			return nil, fmt.Errorf("failed to process data for year %s: %w", year, err)
		}
		allYearsData[year] = items
	}

	dashboardData := map[string]interface{}{
		"providerRankings":    map[string]interface{}{},
		"providerPerformance": allYearsData,
		"financial":           map[string]interface{}{},
		"operational":         map[string]interface{}{},
		"clinical":            map[string]interface{}{},
	}

	return json.Marshal(dashboardData)
}
