package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

type CustomerMapping map[string]string

// Array of months used for data processing
var months = []string{"january", "february", "march", "april", "may", "june",
	"july", "august", "september", "october", "november", "december"}

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

func loadCustomerMapping() (CustomerMapping, error) {
	data, err := os.ReadFile("customerIdMapping.json")
	if err != nil {
		return nil, fmt.Errorf("error reading customer mapping: %v", err)
	}

	var mapping CustomerMapping
	if err := json.Unmarshal(data, &mapping); err != nil {
		return nil, fmt.Errorf("error parsing customer mapping: %v", err)
	}

	return mapping, nil
}

func getBucketName(customerId string) (string, error) {
	mapping, err := loadCustomerMapping()
	if err != nil {
		return "", err
	}

	bucketName, exists := mapping[customerId]
	if !exists {
		return "", fmt.Errorf("no bucket mapping found for customer ID: %s", customerId)
	}

	return bucketName, nil
}
