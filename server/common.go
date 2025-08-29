package main

import (
	"fmt"
	"strings"
)

type CustomerMapping map[string]string

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
