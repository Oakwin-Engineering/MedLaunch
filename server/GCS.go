package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"time"

	"cloud.google.com/go/storage"
	"google.golang.org/api/iterator"
)

// downloadBucket downloads all objects under a given prefix (folder) from a GCS bucket
func downloadBucket(bucket string) error {
	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		return fmt.Errorf("storage.NewClient: %w", err)
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(ctx, time.Second*300) // Longer timeout for multiple files
	defer cancel()

	const localDestDir = "data"

	// Remove the data directory to ensure a clean download
	if err := os.RemoveAll(localDestDir); err != nil {
		return fmt.Errorf("failed to remove existing data directory: %w", err)
	}

	// Create base directory
	if err := os.MkdirAll(localDestDir, 0755); err != nil {
		return fmt.Errorf("os.MkdirAll for %s: %w", localDestDir, err)
	}

	// List all objects in the bucket.
	it := client.Bucket(bucket).Objects(ctx, &storage.Query{})

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

		// Construct the full local path for the file.
		localPath := filepath.Join(localDestDir, attrs.Name)

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

// uploadFileToBucket uploads a single file to a GCS bucket, preserving its path.
// It creates the bucket if it doesn't exist.
func uploadFileToBucket(bucketName, objectName string, data []byte) error {
	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		return fmt.Errorf("storage.NewClient: %w", err)
	}
	defer client.Close()

	bucket := client.Bucket(bucketName)

	// Check if the bucket exists. If not, create it.
	if _, err := bucket.Attrs(ctx); err != nil {
		if errors.Is(err, storage.ErrBucketNotExist) {
			log.Printf("Bucket %s does not exist, creating it...", bucketName)
			PROJECT_ID := os.Getenv("PROJECT_ID")
			if err := bucket.Create(ctx, PROJECT_ID, nil); err != nil {
				return fmt.Errorf("failed to create bucket: %w", err)
			}
		} else {
			return fmt.Errorf("failed to get bucket attributes: %w", err)
		}
	}

	// Upload the object.
	obj := bucket.Object(objectName)
	wc := obj.NewWriter(ctx)
	if _, err := wc.Write(data); err != nil {
		wc.Close() // Close writer on error
		return fmt.Errorf("failed to write data to object %s: %w", objectName, err)
	}

	// Close the writer to finalize the upload.
	if err := wc.Close(); err != nil {
		return fmt.Errorf("failed to close writer for object %s: %w", objectName, err)
	}

	return nil
}

// deleteLocalData deletes the specified local directory and all its contents.
func deleteLocalData(path string) error {
	log.Printf("Attempting to delete local data directory: %s", path)
	err := os.RemoveAll(path)
	if err != nil {
		return fmt.Errorf("failed to delete directory %s: %w", path, err)
	}
	log.Printf("Successfully deleted local data directory: %s", path)
	return nil
}
