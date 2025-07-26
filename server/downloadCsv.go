package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"os/exec"
	"time"

	"cloud.google.com/go/storage"
)

// Add logging and a loading and print out success/failure. The CMD already returns the loading and status
func downloadEntireBucket(bucket string, topFolder string) error {
	cmd := exec.Command("gcloud", "storage", "cp", "--recursive", fmt.Sprintf("gs://%s/%s", bucket, topFolder), ".")

	if err := cmd.Run(); err != nil {
		log.Fatal(err)
		return err
	}
	return nil
}

// downloadFileIntoMemory downloads an object.
func downloadFileIntoMemory(w io.Writer, bucket, object string) ([]byte, error) {
	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("storage.NewClient: %w", err)
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(ctx, time.Second*50)
	defer cancel()

	rc, err := client.Bucket(bucket).Object(object).NewReader(ctx)
	if err != nil {
		return nil, fmt.Errorf("Object(%q).NewReader: %w", object, err)
	}
	defer rc.Close()

	data, err := io.ReadAll(rc)
	if err != nil {
		return nil, fmt.Errorf("io.ReadAll: %w", err)
	}
	fmt.Fprintf(w, "Blob %v downloaded.\n", object)
	return data, nil
}
