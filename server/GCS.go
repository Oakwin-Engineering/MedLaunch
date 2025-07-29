package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"time"

	"cloud.google.com/go/storage"
	"google.golang.org/api/iterator"
)

const PROJECT_ID = "medlaunch-467015"

// downloadEntireBucket downloads all objects under a given prefix (folder) from a GCS bucket
func downloadEntireBucket(bucket string, topFolder string) error {
	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		return fmt.Errorf("storage.NewClient: %w", err)
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(ctx, time.Second*300) // Longer timeout for multiple files
	defer cancel()

	// Create base directory if it doesn't exist
	if err := os.MkdirAll(topFolder, 0755); err != nil {
		return fmt.Errorf("os.MkdirAll: %w", err)
	}

	// List all objects with the given prefix
	it := client.Bucket(bucket).Objects(ctx, &storage.Query{
		Prefix: topFolder + "/",
	})

	for {
		attrs, err := it.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return fmt.Errorf("Bucket(%q).Objects(): %w", bucket, err)
		}

		// Skip if this is a directory
		if attrs.Name[len(attrs.Name)-1] == '/' {
			continue
		}

		// Create the local directory structure
		localPath := attrs.Name
		dir := filepath.Dir(localPath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("os.MkdirAll: %w", err)
		}

		// Create the local file
		f, err := os.Create(localPath)
		if err != nil {
			return fmt.Errorf("os.Create(%q): %w", localPath, err)
		}

		// Download the object
		rc, err := client.Bucket(bucket).Object(attrs.Name).NewReader(ctx)
		if err != nil {
			f.Close()
			return fmt.Errorf("Object(%q).NewReader: %w", attrs.Name, err)
		}

		// Copy the content to the local file
		if _, err := io.Copy(f, rc); err != nil {
			f.Close()
			rc.Close()
			return fmt.Errorf("io.Copy: %w", err)
		}

		// Clean up
		if err := f.Close(); err != nil {
			rc.Close()
			return fmt.Errorf("f.Close: %w", err)
		}
		rc.Close()

		log.Printf("Downloaded: %s", localPath)
	}

	return nil
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
