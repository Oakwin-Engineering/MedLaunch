package main

import (
	"fmt"
	"strings"
)

type CustomerMapping map[string]string

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
	CptCodes                    []CptCodeMetric `json:"cptCodes"`
	CptCodingTotal              Metric          `json:"cptCodingTotal"`
	TotalVisits                 Metric          `json:"totalVisits"`
	PatientCountTotal           Metric          `json:"patientCountTotal"`
	NPWellnessVisitTotal        Metric          `json:"npWellnessVisitTotal"`
	MedicareAnnualWellnessTotal Metric          `json:"medicareAnnualWellnessTotal"`
	FollowUpPatientTotal        Metric          `json:"followUpPatientTotal"`

	Charges                    Metric `json:"charges"`
	Payments                   Metric `json:"payments"`
	RVUs                       Metric `json:"rvus"`
	Payroll                    Metric `json:"payroll"`
	Adjustments                Metric `json:"adjustments"`
	OperatingProfit            Metric `json:"operatingProfit"`
	RvuPerPatient              Metric `json:"rvuPerPatient"`
	ChargePerPatient           Metric `json:"chargePerPatient"`
	PaymentPercentOfCharges    Metric `json:"paymentPercentOfCharges"`
	AverageReceiptsPerPatient  Metric `json:"averageReceiptsPerPatient"`
	AdjustmentPercentOfCharges Metric `json:"adjustmentPercentOfCharges"`
}

// CptCodeMetric represents a CPT code's metrics.
type CptCodeMetric struct {
	Code   string    `json:"code"`
	Values []float64 `json:"values"`
	Total  float64   `json:"total"`
	Coding string    `json:"coding"`
	Label  string    `json:"label"`
}

// Metric represents a single metric with a label, values, total, and coding.
type Metric struct {
	Label  string    `json:"label"`
	Values []float64 `json:"values"`
	Total  float64   `json:"total"`
	Coding string    `json:"coding"`
}

// Array of months used for data processing
var months = []string{"january", "february", "march", "april", "may", "june",
	"july", "august", "september", "october", "november", "december"}

var customers = []string{"uhealth", "demo", "vitalcare"}

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

func getBucketName(customerId string) (string, error) {
	customerId = strings.ToLower(customerId)
	for _, customer := range customers {
		if customer == customerId {
			return customer, nil
		}
	}
	return "", fmt.Errorf("invalid customer ID: %s", customerId)
}
