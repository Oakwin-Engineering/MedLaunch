package main

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"

	"cloud.google.com/go/storage"
)

const PROJECT_ID = "medlaunch-467015"

// TransformAndUploadADPCSV reads the CSV, extracts all unique provider names, marshals to JSON, and uploads to GCS
func TransformAndUploadADPCSV(csvPath string, bucketName string, objectName string) error {
	names, err := extractUniqueProviderNames(csvPath)
	if err != nil {
		return fmt.Errorf("failed to extract provider names: %w", err)
	}
	jsonBytes, err := json.Marshal(names)
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}
	if err := uploadToGCS(bucketName, objectName, jsonBytes); err != nil {
		return fmt.Errorf("failed to upload to GCS: %w", err)
	}
	return nil
}

// extractUniqueProviderNames reads the CSV and returns all unique values in the NAME column
func extractUniqueProviderNames(csvPath string) ([]string, error) {
	f, err := os.Open(csvPath)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	reader := csv.NewReader(f)
	reader.FieldsPerRecord = -1
	allRows, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}
	if len(allRows) < 2 {
		return nil, fmt.Errorf("CSV has no data rows")
	}
	headers := allRows[0]
	nameIdx := -1
	for i, h := range headers {
		if h == "NAME" {
			nameIdx = i
			break
		}
	}
	if nameIdx == -1 {
		return nil, fmt.Errorf("NAME column not found")
	}
	unique := make(map[string]struct{})
	for _, row := range allRows[1:] {
		if nameIdx < len(row) {
			unique[row[nameIdx]] = struct{}{}
		}
	}
	var names []string
	for name := range unique {
		names = append(names, name)
	}
	return names, nil
}

// uploadToGCS creates the bucket if needed and uploads the JSON
func uploadToGCS(bucketName, objectName string, data []byte) error {
	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		return err
	}
	defer client.Close()
	bucket := client.Bucket(bucketName)
	// Create bucket if it doesn't exist

	if err := bucket.Create(ctx, PROJECT_ID, nil); err != nil {
		if !isBucketExistsErr(err) {
			return err
		}
	}
	obj := bucket.Object(objectName)
	w := obj.NewWriter(ctx)
	if _, err := w.Write(data); err != nil {
		w.Close()
		return err
	}
	return w.Close()
}

// isBucketExistsErr checks if the error is 'bucket exists'
func isBucketExistsErr(err error) bool {
	return err != nil && (err.Error() == "googleapi: Error 409: You already own this bucket. Please select another name., conflict")
}
