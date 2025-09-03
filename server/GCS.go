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

	// Create base directory if it doesn't exist
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

// uploadDirectoryToBucket uploads a local directory to a GCS bucket.
func uploadDirectoryToBucket(bucketName, directoryPath string) error {
	return filepath.Walk(directoryPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			// Read file data
			data, err := os.ReadFile(path)
			if err != nil {
				return fmt.Errorf("failed to read file %s: %w", path, err)
			}

			// Get relative path for GCS object name
			relPath, err := filepath.Rel(directoryPath, path)
			if err != nil {
				return fmt.Errorf("failed to get relative path for %s: %w", path, err)
			}

			// Upload the file
			if err := uploadFileToBucket(bucketName, relPath, data); err != nil {
				return fmt.Errorf("failed to upload file %s: %w", relPath, err)
			}
			log.Printf("Successfully uploaded %s to %s", relPath, bucketName)
		}
		return nil
	})
}

// deleteLocalData deletes the specified local directory and all its contents.
// createBucket ensures a bucket exists, creating it if necessary.
func createBucket(bucketName string) error {
	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		return fmt.Errorf("storage.NewClient: %w", err)
	}
	defer client.Close()

	bucket := client.Bucket(bucketName)
	if _, err := bucket.Attrs(ctx); err != nil {
		if err == storage.ErrBucketNotExist {
			log.Printf("Bucket %s does not exist, creating it...", bucketName)
			projectID := os.Getenv("PROJECT_ID")
			if projectID == "" {
				return fmt.Errorf("PROJECT_ID environment variable not set")
			}
			if err := bucket.Create(ctx, projectID, nil); err != nil {
				return fmt.Errorf("failed to create bucket: %w", err)
			}
			log.Printf("Bucket %s created.", bucketName)
		} else {
			return fmt.Errorf("failed to get bucket attributes: %w", err)
		}
	}
	return nil
}

// clearBucket deletes all objects in a GCS bucket.
func clearBucket(bucketName string) error {
	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		return fmt.Errorf("storage.NewClient: %w", err)
	}
	defer client.Close()

	bucket := client.Bucket(bucketName)
	it := bucket.Objects(ctx, nil)
	for {
		attrs, err := it.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return fmt.Errorf("failed to list objects: %w", err)
		}
		if err := bucket.Object(attrs.Name).Delete(ctx); err != nil {
			// Log error but continue trying to delete other objects
			log.Printf("Warning: failed to delete object %s: %v", attrs.Name, err)
		}
	}
	log.Printf("All objects in bucket %s have been deleted.", bucketName)
	return nil
}

func deleteLocalData(path string) error {
	log.Printf("Attempting to delete local data directory: %s", path)
	err := os.RemoveAll(path)
	if err != nil {
		return fmt.Errorf("failed to delete directory %s: %w", path, err)
	}
	log.Printf("Successfully deleted local data directory: %s", path)
	return nil
}
