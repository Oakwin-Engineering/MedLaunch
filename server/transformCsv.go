package main

import (
	"context"

	"cloud.google.com/go/storage"
)

const PROJECT_ID = "medlaunch-467015"

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
