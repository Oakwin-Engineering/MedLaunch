package main

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"
)

func vitalCareTransform() ([]byte, error) {
	// File paths
	financialAnalysisPath := "data/financial_analysis.csv"
	providerLocationPath := "data/provider_location_relationship.csv"
	rvuPath := "data/rvu.csv"
	payrollPath := "data/payroll.csv"

	// Process financial data
	units, err := processUnitsVitalCare(financialAnalysisPath)
	if err != nil {
		return nil, fmt.Errorf("failed to process units: %w", err)
	}

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

	payroll, uniquePaylocityProviders, err := processPayrollVitalCare(payrollPath)
	if err != nil {
		return nil, fmt.Errorf("failed to process payroll: %w", err)
	}

	// Process provider-location relationships
	locationProviderMap, uniqueProviders, err := processProviderLocationRelationshipVitalCare(providerLocationPath)
	if err != nil {
		return nil, fmt.Errorf("failed to process provider location relationships: %w", err)
	}

	var uniqueProvidersString string
	for _, provider := range uniqueProviders {
		uniqueProvidersString += "[" + strings.TrimSpace(provider) + "]"
	}
	namesMapping, err := matchProviderNames("List 1: "+uniqueProvidersString+"List 2: "+uniquePaylocityProviders, false)
	if err != nil {
		fmt.Printf("Error matching provider names: %v\n", err)
		return nil, fmt.Errorf("failed to match provider names: %v", err)
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
		locationPayrollValues := make([]float64, 12)
		locationOPMValues := make([]float64, 12)

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
			providerPayrollValues := make([]float64, 12)
			providerOPMValues := make([]float64, 12)

			for _, cptCode := range uniqueCPTCodes {
				cptUnitsValues := make([]float64, 12)
				dataFound := false

				for i, month := range months {
					if monthUnits, ok := units[month]; ok {
						if cptUnits, ok := monthUnits[cptCode]; ok {
							if val, ok := cptUnits[providerName]; ok && val != 0 {
								cptUnitsValues[i] = val
								dataFound = true
							}
						}
					}
					if monthCharges, ok := charges[month]; ok {
						if cptCharges, ok := monthCharges[cptCode]; ok {
							if val, ok := cptCharges[providerName]; ok && val != 0 {
								providerChargesValues[i] += val
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
						providerCptData[cptCode]["units"] = make([]float64, 12)
					}
					providerCptData[cptCode]["units"] = cptUnitsValues
				}
			}

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

				// Get payroll
				if payrollData, exists := payroll[month]; exists {
					if payrollValue, ok := payrollData[namesMapping[providerName]]; ok {
						providerPayrollValues[i] = payrollValue
					}
				}

				// Get operating profit margin
				if providerPaymentsValues[i] > 0 && providerPayrollValues[i] > 0 {
					providerOPMValues[i] = providerPaymentsValues[i] - providerPayrollValues[i]
				} else {
					providerOPMValues[i] = 0
				}
			}

			// Aggregate provider CPT data to location
			for cptCode, data := range providerCptData {
				if _, ok := locationCptData[cptCode]; !ok {
					locationCptData[cptCode] = make(map[string][]float64)
					locationCptData[cptCode]["units"] = make([]float64, 12)
				}
				for i, unit := range data["units"] {
					locationCptData[cptCode]["units"][i] += unit
				}
			}

			// Aggregate provider data to location
			for i := 0; i < 12; i++ {
				locationChargesValues[i] += providerChargesValues[i]
				locationPaymentsValues[i] += providerPaymentsValues[i]
				locationAdjustmentsValues[i] += providerAdjustmentsValues[i]
				locationRvusValues[i] += providerRvusValues[i]
				locationTotalVisitsValues[i] += providerTotalVisitsValues[i]
				locationPayrollValues[i] += providerPayrollValues[i]
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
			providerPayrollTotal := 0.0
			for _, v := range providerPayrollValues {
				providerPayrollTotal += v
			}
			providerOPMTotal := 0.0
			for _, v := range providerOPMValues {
				providerOPMTotal += v
			}

			providerCptUnitsTotalSum := 0.0
			for _, data := range providerCptData {
				for _, v := range data["units"] {
					providerCptUnitsTotalSum += v
				}
			}

			providerCptCodeMetrics := []CptCodeMetric{}
			providerTotalVisitsByMonth := make([]float64, 12)

			for code, data := range providerCptData {
				cptUnitsTotal := 0.0
				for i, v := range data["units"] {
					cptUnitsTotal += v
					providerTotalVisitsByMonth[i] += v
				}

				codingPercentage := 0.0
				if providerCptUnitsTotalSum > 0 {
					codingPercentage = (cptUnitsTotal / providerCptUnitsTotalSum) * 100
				}

				providerCptCodeMetrics = append(providerCptCodeMetrics, CptCodeMetric{
					Code:   code,
					Values: data["units"],
					Total:  cptUnitsTotal,
					Coding: fmt.Sprintf("%.2f%%", codingPercentage),
				})
			}

			providerNode.Data = NodeData{
				CptCodes: providerCptCodeMetrics,
				Total: Metric{
					Label:  "Total",
					Values: providerTotalVisitsByMonth,
					Total:  providerCptUnitsTotalSum,
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
				Payroll: Metric{
					Label:  "Payroll",
					Values: providerPayrollValues,
					Total:  providerPayrollTotal,
					Coding: "-",
				},
				OperatingProfit: Metric{
					Label:  "Operating Profit Margin",
					Values: providerOPMValues,
					Total:  providerOPMTotal,
					Coding: "-",
				},
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
		locationPayrollTotal := 0.0
		for _, v := range locationPayrollValues {
			locationPayrollTotal += v
		}

		for i := 0; i < 12; i++ {
			if locationPaymentsValues[i] > 0 && locationPayrollValues[i] > 0 {
				locationOPMValues[i] = locationPaymentsValues[i] - locationPayrollValues[i]
			} else {
				locationOPMValues[i] = 0
			}
		}

		locationOPMTotal := 0.0
		for _, v := range locationOPMValues {
			locationOPMTotal += v
		}

		locationCptUnitsTotalSum := 0.0
		for _, data := range locationCptData {
			for _, v := range data["units"] {
				locationCptUnitsTotalSum += v
			}
		}

		locationCptCodeMetrics := []CptCodeMetric{}
		locationTotalVisitsByMonth := make([]float64, 12)

		for code, data := range locationCptData {
			cptUnitsTotal := 0.0
			for i, v := range data["units"] {
				cptUnitsTotal += v
				locationTotalVisitsByMonth[i] += v
			}

			codingPercentage := 0.0
			if locationCptUnitsTotalSum > 0 {
				codingPercentage = (cptUnitsTotal / locationCptUnitsTotalSum) * 100
			}

			locationCptCodeMetrics = append(locationCptCodeMetrics, CptCodeMetric{
				Code:   code,
				Values: data["units"],
				Total:  cptUnitsTotal,
				Coding: fmt.Sprintf("%.2f%%", codingPercentage),
			})
		}

		locationNode.Data = NodeData{
			CptCodes: locationCptCodeMetrics,
			Total: Metric{
				Label:  "Total",
				Values: locationTotalVisitsByMonth,
				Total:  locationCptUnitsTotalSum,
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
			Payroll: Metric{
				Label:  "Payroll",
				Values: locationPayrollValues,
				Total:  locationPayrollTotal,
				Coding: "-",
			},
			OperatingProfit: Metric{
				Label:  "Operating Profit Margin",
				Values: locationOPMValues,
				Total:  locationOPMTotal,
				Coding: "-",
			},
		}
		items = append(items, locationNode)
	}

	// Create "All Providers" aggregate node
	allProvidersNode := &Node{
		ID:       "all-providers",
		Label:    "All Providers",
		IconType: "clinic",
		Children: []*Node{},
	}

	// Aggregate data for all unique providers
	allProvidersChargesValues := make([]float64, 12)
	allProvidersPaymentsValues := make([]float64, 12)
	allProvidersAdjustmentsValues := make([]float64, 12)
	allProvidersRvusValues := make([]float64, 12)
	allProvidersTotalVisitsValues := make([]float64, 12)
	allProvidersCptData := make(map[string]map[string][]float64)
	allProvidersPayrollValues := make([]float64, 12)
	allProvidersOPMValues := make([]float64, 12)

	for _, providerName := range uniqueProviders {
		// Process RVUs and Total Visits once per provider for all months
		for i, month := range months {
			if monthRVUs, ok := rvus[month]; ok {
				if val, ok := monthRVUs[providerName]; ok {
					allProvidersRvusValues[i] += float64(val)
				}
			}
			if monthTotalVisits, ok := totalVisits[month]; ok {
				if val, ok := monthTotalVisits[providerName]; ok {
					allProvidersTotalVisitsValues[i] += float64(val)
				}
			}

			// Get payroll
			if payrollData, exists := payroll[month]; exists {
				if payrollValue, ok := payrollData[namesMapping[providerName]]; ok {
					allProvidersPayrollValues[i] += payrollValue
				}
			}
		}

		for _, cptCode := range uniqueCPTCodes {
			cptUnitsValues := make([]float64, 12)
			dataFound := false

			for i, month := range months {
				if monthUnits, ok := units[month]; ok {
					if cptUnits, ok := monthUnits[cptCode]; ok {
						if val, ok := cptUnits[providerName]; ok && val != 0 {
							cptUnitsValues[i] = val
							dataFound = true
						}
					}
				}
				if monthCharges, ok := charges[month]; ok {
					if cptCharges, ok := monthCharges[cptCode]; ok {
						if val, ok := cptCharges[providerName]; ok && val != 0 {
							allProvidersChargesValues[i] += val
						}
					}
				}
				if monthPayments, ok := payments[month]; ok {
					if cptPayments, ok := monthPayments[cptCode]; ok {
						if val, ok := cptPayments[providerName]; ok {
							allProvidersPaymentsValues[i] += val
						}
					}
				}
				if monthAdjustments, ok := adjustments[month]; ok {
					if cptAdjustments, ok := monthAdjustments[cptCode]; ok {
						if val, ok := cptAdjustments[providerName]; ok {
							allProvidersAdjustmentsValues[i] += val
						}
					}
				}
			}

			// Calculate monthly OPM for all providers
			for i := 0; i < 12; i++ {
				if allProvidersPaymentsValues[i] > 0 && allProvidersPayrollValues[i] > 0 {
					allProvidersOPMValues[i] = allProvidersPaymentsValues[i] - allProvidersPayrollValues[i]
				} else {
					allProvidersOPMValues[i] = 0
				}
			}

			if dataFound {
				if _, ok := allProvidersCptData[cptCode]; !ok {
					allProvidersCptData[cptCode] = make(map[string][]float64)
					allProvidersCptData[cptCode]["units"] = make([]float64, 12)
				}
				for i, unit := range cptUnitsValues {
					allProvidersCptData[cptCode]["units"][i] += unit
				}
			}
		}
	}

	// Build NodeData for all providers
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

	allProvidersPayrollTotal := 0.0
	for _, v := range allProvidersPayrollValues {
		allProvidersPayrollTotal += v
	}

	allProvidersOPMTotal := 0.0
	for _, v := range allProvidersOPMValues {
		allProvidersOPMTotal += v
	}

	allProvidersCptUnitsTotalSum := 0.0
	for _, data := range allProvidersCptData {
		for _, v := range data["units"] {
			allProvidersCptUnitsTotalSum += v
		}
	}

	allProvidersCptCodeMetrics := []CptCodeMetric{}
	allProvidersTotalVisitsByMonth := make([]float64, 12)

	for code, data := range allProvidersCptData {
		cptUnitsTotal := 0.0
		for i, v := range data["units"] {
			cptUnitsTotal += v
			allProvidersTotalVisitsByMonth[i] += v
		}

		codingPercentage := 0.0
		if allProvidersCptUnitsTotalSum > 0 {
			codingPercentage = (cptUnitsTotal / allProvidersCptUnitsTotalSum) * 100
		}

		allProvidersCptCodeMetrics = append(allProvidersCptCodeMetrics, CptCodeMetric{
			Code:   code,
			Values: data["units"],
			Total:  cptUnitsTotal,
			Coding: fmt.Sprintf("%.2f%%", codingPercentage),
		})
	}

	allProvidersNode.Data = NodeData{
		CptCodes: allProvidersCptCodeMetrics,
		Total: Metric{
			Label:  "Total",
			Values: allProvidersTotalVisitsByMonth,
			Total:  allProvidersCptUnitsTotalSum,
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
