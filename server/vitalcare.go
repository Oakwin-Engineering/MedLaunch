package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sort"
)

var CPT_CODE_MAPPING_VITALCARE = map[string]string{
	"99202": "New Patient",
	"99203": "New Patient",
	"99204": "New Patient",
	"99205": "New Patient",

	"99211": "Follow Up Patient",
	"99212": "Follow Up Patient",
	"99213": "Follow Up Patient",
	"99214": "Follow Up Patient",
	"99215": "Follow Up Patient",

	"99394": "Nurse Practitioner Well Visit",
	"99395": "Nurse Practitioner Well Visit",
	"99396": "Nurse Practitioner Well Visit",
	"99397": "Nurse Practitioner Well Visit",

	"99495": "Medicare Annual Wellness",
	"99496": "Medicare Annual Wellness",
}

// CPT category mappings for cleaner aggregation
var CPT_CATEGORIES = map[string]string{
	"New Patient":                   "PatientCountTotal",
	"Follow Up Patient":             "FollowUpPatientTotal",
	"Nurse Practitioner Well Visit": "NPWellnessVisitTotal",
	"Medicare Annual Wellness":      "MedicareAnnualWellnessTotal",
	"CPT Coding":                    "CPTCodingTotal",
}

// MetricBuilder helps build metrics consistently
type MetricBuilder struct {
	charges     []float64
	payments    []float64
	adjustments []float64
	rvus        []float64
	totalVisits []float64
	payroll     []float64
	cptData     map[string]map[string][]float64
}

type DataSources struct {
	units                    map[string]map[string]map[string]float64
	charges                  map[string]map[string]map[string]float64
	payments                 map[string]map[string]map[string]float64
	adjustments              map[string]map[string]map[string]float64
	uniqueCPTCodes           []string
	rvus                     map[string]map[string]int64
	totalVisits              map[string]map[string]int64
	payroll                  map[string]map[string]float64
	uniquePaylocityProviders []string
}

func newMetricBuilder() *MetricBuilder {
	return &MetricBuilder{
		charges:     make([]float64, 12),
		payments:    make([]float64, 12),
		adjustments: make([]float64, 12),
		rvus:        make([]float64, 12),
		totalVisits: make([]float64, 12),
		payroll:     make([]float64, 12),
		cptData:     make(map[string]map[string][]float64),
	}
}

func (mb *MetricBuilder) aggregate(other *MetricBuilder) {
	for i := 0; i < 12; i++ {
		mb.charges[i] += other.charges[i]
		mb.payments[i] += other.payments[i]
		mb.adjustments[i] += other.adjustments[i]
		mb.rvus[i] += other.rvus[i]
		mb.totalVisits[i] += other.totalVisits[i]
		mb.payroll[i] += other.payroll[i]
	}

	for code, data := range other.cptData {
		if _, ok := mb.cptData[code]; !ok {
			mb.cptData[code] = make(map[string][]float64)
			mb.cptData[code]["units"] = make([]float64, 12)
		}
		for i, unit := range data["units"] {
			mb.cptData[code]["units"][i] += unit
		}
	}
}

func (mb *MetricBuilder) buildNodeData() NodeData {
	// Calculate totals
	chargesTotal := sum(mb.charges)
	paymentsTotal := sum(mb.payments)
	adjustmentsTotal := sum(mb.adjustments)
	rvusTotal := sum(mb.rvus)
	totalVisitsTotal := sum(mb.totalVisits)
	payrollTotal := sum(mb.payroll)

	// Calculate OPM
	opmValues := make([]float64, 12)
	for i := 0; i < 12; i++ {
		if mb.payments[i] > 0 && mb.payroll[i] > 0 {
			opmValues[i] = mb.payments[i] - mb.payroll[i]
		}
	}
	opmTotal := sum(opmValues)

	// Calculate derived metrics
	rvuPerPatient := divideArrays(mb.rvus, mb.totalVisits)
	chargePerPatient := divideArrays(mb.charges, mb.totalVisits)
	paymentPercentOfCharges := percentageArrays(mb.payments, mb.charges)
	averageReceiptsPerPatient := divideArrays(mb.payments, mb.totalVisits)
	adjustmentPercentOfCharges := percentageArrays(mb.adjustments, mb.charges)

	// Build CPT metrics and category totals
	cptMetrics, categoryTotals := mb.buildCPTMetrics()

	return NodeData{
		CptCodes:                    cptMetrics,
		TotalVisits:                 createMetric("Total Visits", mb.totalVisits, totalVisitsTotal),
		CptCodingTotal:              categoryTotals["CPTCodingTotal"],
		PatientCountTotal:           categoryTotals["PatientCountTotal"],
		NPWellnessVisitTotal:        categoryTotals["NPWellnessVisitTotal"],
		MedicareAnnualWellnessTotal: categoryTotals["MedicareAnnualWellnessTotal"],
		FollowUpPatientTotal:        categoryTotals["FollowUpPatientTotal"],
		Charges:                     createMetric("Charges", mb.charges, chargesTotal),
		Payments:                    createMetric("Payments", mb.payments, paymentsTotal),
		Adjustments:                 createMetric("Adjustments", mb.adjustments, adjustmentsTotal),
		RVUs:                        createMetric("RVUs", mb.rvus, rvusTotal),
		Payroll:                     createMetric("Payroll", mb.payroll, payrollTotal),
		OperatingProfit:             createMetric("Operating Profit Margin", opmValues, opmTotal),
		RvuPerPatient:               createMetric("RVUs per Patient", rvuPerPatient, sumOrAverage(rvuPerPatient, totalVisitsTotal, rvusTotal)),
		ChargePerPatient:            createMetric("Charges per Patient", chargePerPatient, sumOrAverage(chargePerPatient, totalVisitsTotal, chargesTotal)),
		PaymentPercentOfCharges:     createMetric("Payment % of Charges", paymentPercentOfCharges, percentageValue(paymentsTotal, chargesTotal)),
		AverageReceiptsPerPatient:   createMetric("Average Receipts per Patient", averageReceiptsPerPatient, sumOrAverage(averageReceiptsPerPatient, totalVisitsTotal, paymentsTotal)),
		AdjustmentPercentOfCharges:  createMetric("Adjustments % of Charges", adjustmentPercentOfCharges, percentageValue(adjustmentsTotal, chargesTotal)),
	}
}

func (mb *MetricBuilder) buildCPTMetrics() ([]CptCodeMetric, map[string]Metric) {
	cptUnitsTotalSum := 0.0
	for _, data := range mb.cptData {
		cptUnitsTotalSum += sum(data["units"])
	}

	metrics := []CptCodeMetric{}
	categoryValues := make(map[string][]float64)
	totalVisitsByMonth := make([]float64, 12)

	// Initialize category arrays
	for _, category := range CPT_CATEGORIES {
		categoryValues[category] = make([]float64, 12)
	}

	for code, data := range mb.cptData {
		units := data["units"]
		unitsTotal := sum(units)

		for i, v := range units {
			totalVisitsByMonth[i] += v
		}

		label := CPT_CODE_MAPPING_VITALCARE[code]
		if label == "" {
			label = "CPT Coding"
		}

		// Aggregate by category
		if category, ok := CPT_CATEGORIES[label]; ok {
			for i, v := range units {
				categoryValues[category][i] += v
			}
		}

		metrics = append(metrics, CptCodeMetric{
			Code:   code,
			Values: units,
			Total:  unitsTotal,
			Coding: formatPercentage(unitsTotal, cptUnitsTotalSum),
			Label:  label,
		})
	}

	// Build category totals
	categoryTotals := make(map[string]Metric)
	categoryTotals["Total"] = createMetric("Total", totalVisitsByMonth, sum(totalVisitsByMonth))

	for _, key := range CPT_CATEGORIES {
		categoryTotals[key] = createMetric("Total", categoryValues[key], sum(categoryValues[key]))
	}

	return metrics, categoryTotals
}

func vitalCareTransform() ([]byte, error) {
	years, err := getYearDirectories("data")
	if err != nil {
		return nil, fmt.Errorf("failed to get year directories: %w", err)
	}

	allYearsData := make(map[string][]*Node)

	for _, year := range years {
		items, err := processYearData(year)
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

func processYearData(year string) ([]*Node, error) {
	// Load all data sources for the given year
	dataSources, err := loadDataSources(year)
	if err != nil {
		return nil, err
	}

	// Process provider locations
	locationProviderMap, uniqueProviders, err := processProviderLocationRelationshipVitalCare(fmt.Sprintf("data/%s/provider_location_relationship.csv", year))
	if err != nil {
		return nil, fmt.Errorf("failed to process provider location relationships: %w", err)
	}

	// Build name mappings for payroll
	namesMapping := MatchNames(uniqueProviders, dataSources.uniquePaylocityProviders)

	// Track provider occurrences for ID generation
	providerToLocationMap := buildProviderToLocationMap(locationProviderMap)

	var items []*Node

	// Process each location
	for location, providers := range locationProviderMap {
		locationNode := createLocationNode(location, providers, dataSources, namesMapping, providerToLocationMap)
		items = append(items, locationNode)
	}

	// Create "All Providers" aggregate node
	allProvidersNode := createAllProvidersNode(uniqueProviders, dataSources, namesMapping)
	items = append(items, allProvidersNode)

	// Sort items alphabetically, keeping "All Providers" at the top
	sortNodes(items)

	return items, nil
}

func loadDataSources(year string) (*DataSources, error) {
	ds := &DataSources{}
	var err error

	financialAnalysisFile := fmt.Sprintf("data/%s/financial_analysis.csv", year)
	rvuFile := fmt.Sprintf("data/%s/rvu.csv", year)
	payrollFile := fmt.Sprintf("data/%s/payroll.csv", year)

	ds.units, err = processUnitsVitalCare(financialAnalysisFile)
	if err != nil {
		return nil, fmt.Errorf("failed to process units: %w", err)
	}

	ds.charges, err = processChargesVitalCare(financialAnalysisFile)
	if err != nil {
		return nil, fmt.Errorf("failed to process charges: %w", err)
	}

	ds.payments, err = processPaymentsVitalCare(financialAnalysisFile)
	if err != nil {
		return nil, fmt.Errorf("failed to process payments: %w", err)
	}

	ds.adjustments, err = processContractualAdjustmentsVitalCare(financialAnalysisFile)
	if err != nil {
		return nil, fmt.Errorf("failed to process adjustments: %w", err)
	}

	ds.uniqueCPTCodes, err = getUniqueCPTCodesVitalCare(financialAnalysisFile)
	if err != nil {
		return nil, fmt.Errorf("failed to get unique CPT codes: %w", err)
	}

	ds.rvus, err = processRVUsVitalCare(rvuFile)
	if err != nil {
		return nil, fmt.Errorf("failed to process RVUs: %w", err)
	}

	ds.totalVisits, err = processTotalVisitsVitalCare(rvuFile)
	if err != nil {
		return nil, fmt.Errorf("failed to process total visits: %w", err)
	}

	ds.payroll, ds.uniquePaylocityProviders, err = processPayrollVitalCare(payrollFile)
	if err != nil {
		return nil, fmt.Errorf("failed to process payroll: %w", err)
	}

	return ds, nil
}

func createLocationNode(location string, providers []string, ds *DataSources, namesMapping map[string]string, providerToLocationMap map[string][]string) *Node {
	locationNode := &Node{
		ID:       slugify(location),
		Label:    location,
		IconType: "clinic",
		Children: []*Node{},
	}

	locationBuilder := newMetricBuilder()
	providerOccurrences := make(map[string]int)

	for _, providerName := range providers {
		providerOccurrences[providerName]++
		occurrence := getProviderOccurrence(providerName, location, providerToLocationMap)

		providerID := generateProviderID(providerName, occurrence, providerToLocationMap)

		// Build provider metrics
		providerBuilder := newMetricBuilder()
		processProviderFinancials(providerBuilder, providerName, ds)
		processProviderRVUsAndVisits(providerBuilder, providerName, ds)
		processProviderPayroll(providerBuilder, providerName, ds, namesMapping)

		// Create provider node with built data
		providerNode := &Node{
			ID:       providerID,
			Label:    providerName,
			IconType: "person",
			Data:     providerBuilder.buildNodeData(),
		}

		// Aggregate provider metrics to location
		locationBuilder.aggregate(providerBuilder)
		locationNode.Children = append(locationNode.Children, providerNode)
	}

	locationNode.Data = locationBuilder.buildNodeData()
	return locationNode
}

func createAllProvidersNode(uniqueProviders []string, ds *DataSources, namesMapping map[string]string) *Node {
	builder := newMetricBuilder()

	for _, providerName := range uniqueProviders {
		providerBuilder := newMetricBuilder()
		processProviderFinancials(providerBuilder, providerName, ds)
		processProviderRVUsAndVisits(providerBuilder, providerName, ds)
		processProviderPayroll(providerBuilder, providerName, ds, namesMapping)
		builder.aggregate(providerBuilder)
	}

	return &Node{
		ID:       "all-providers",
		Label:    "All Providers",
		IconType: "clinic",
		Data:     builder.buildNodeData(),
	}
}

func processProviderFinancials(builder *MetricBuilder, providerName string, ds *DataSources) {
	for _, cptCode := range ds.uniqueCPTCodes {
		cptUnitsValues := make([]float64, 12)
		dataFound := false

		for i, month := range months {
			// Process units
			if monthUnits, ok := ds.units[month]; ok {
				if cptUnits, ok := monthUnits[cptCode]; ok {
					if val, ok := cptUnits[providerName]; ok && val != 0 {
						cptUnitsValues[i] = val
						dataFound = true
					}
				}
			}

			// Process charges, payments, adjustments
			addMonthlyValue(&builder.charges[i], ds.charges, month, cptCode, providerName)
			addMonthlyValue(&builder.payments[i], ds.payments, month, cptCode, providerName)
			addMonthlyValue(&builder.adjustments[i], ds.adjustments, month, cptCode, providerName)
		}

		if dataFound {
			if _, ok := builder.cptData[cptCode]; !ok {
				builder.cptData[cptCode] = make(map[string][]float64)
			}
			builder.cptData[cptCode]["units"] = cptUnitsValues
		}
	}
}

func processProviderRVUsAndVisits(builder *MetricBuilder, providerName string, ds *DataSources) {
	for i, month := range months {
		if monthRVUs, ok := ds.rvus[month]; ok {
			if val, ok := monthRVUs[providerName]; ok {
				builder.rvus[i] = float64(val)
			}
		}
		if monthTotalVisits, ok := ds.totalVisits[month]; ok {
			if val, ok := monthTotalVisits[providerName]; ok {
				builder.totalVisits[i] = float64(val)
			}
		}
	}
}

func processProviderPayroll(builder *MetricBuilder, providerName string, ds *DataSources, namesMapping map[string]string) {
	for i, month := range months {
		if payrollData, exists := ds.payroll[month]; exists {
			if payrollValue, ok := payrollData[namesMapping[providerName]]; ok {
				builder.payroll[i] = payrollValue
			}
		}
	}
}

// Helper functions
func buildProviderToLocationMap(locationProviderMap map[string][]string) map[string][]string {
	providerToLocationMap := make(map[string][]string)
	for loc, provs := range locationProviderMap {
		for _, p := range provs {
			providerToLocationMap[p] = append(providerToLocationMap[p], loc)
		}
	}
	return providerToLocationMap
}

func getProviderOccurrence(providerName, location string, providerToLocationMap map[string][]string) int {
	if len(providerToLocationMap[providerName]) > 1 {
		for i, l := range providerToLocationMap[providerName] {
			if l == location {
				return i + 1
			}
		}
	}
	return 1
}

func generateProviderID(providerName string, occurrence int, providerToLocationMap map[string][]string) string {
	providerID := slugify(providerName)
	if len(providerToLocationMap[providerName]) > 1 {
		providerID = fmt.Sprintf("%s_%d", providerID, occurrence)
	}
	return providerID
}

func addMonthlyValue(target *float64, data map[string]map[string]map[string]float64, month, cptCode, providerName string) {
	if monthData, ok := data[month]; ok {
		if cptData, ok := monthData[cptCode]; ok {
			if val, ok := cptData[providerName]; ok && val != 0 {
				*target += val
			}
		}
	}
}

func createMetric(label string, values []float64, total float64) Metric {
	return Metric{
		Label:  label,
		Values: values,
		Total:  total,
		Coding: "-",
	}
}

func sum(values []float64) float64 {
	total := 0.0
	for _, v := range values {
		total += v
	}
	return total
}

func divideArrays(numerator, denominator []float64) []float64 {
	result := make([]float64, len(numerator))
	for i := range numerator {
		if denominator[i] > 0 {
			result[i] = numerator[i] / denominator[i]
		}
	}
	return result
}

func percentageArrays(numerator, denominator []float64) []float64 {
	result := make([]float64, len(numerator))
	for i := range numerator {
		if denominator[i] > 0 {
			result[i] = (numerator[i] / denominator[i]) * 100
		}
	}
	return result
}

func percentageValue(numerator, denominator float64) float64 {
	if denominator > 0 {
		return (numerator / denominator) * 100
	}
	return 0
}

func sumOrAverage(values []float64, divisor, numerator float64) float64 {
	if divisor > 0 {
		return numerator / divisor
	}
	return 0
}

func formatPercentage(value, total float64) string {
	if total > 0 {
		return fmt.Sprintf("%.2f%%", (value/total)*100)
	}
	return "0.00%"
}

func sortNodes(items []*Node) {
	sort.Slice(items, func(i, j int) bool {
		if items[i].Label == "All Providers" {
			return true
		}
		if items[j].Label == "All Providers" {
			return false
		}
		return items[i].Label < items[j].Label
	})
}

func getYearDirectories(basePath string) ([]string, error) {
	files, err := os.ReadDir(basePath)
	if err != nil {
		return nil, err
	}

	var years []string
	for _, file := range files {
		if file.IsDir() {
			years = append(years, file.Name())
		}
	}
	return years, nil
}
