package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"slices"
)

func main() {
	file, err := os.Open("../data/april_all_data.csv")
	if err != nil {
		fmt.Println("Error opening file:", err)
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)

	_, err = reader.Read()
	if err != nil && err != io.EOF { // Check for actual errors, not just EOF on an empty file
		log.Fatalf("Error reading header: %v", err)
	}

	var names []string

	for {
		record, err := reader.Read()
		if err == csv.ErrFieldCount { // Handle potential field count errors
			fmt.Println("Field count error:", err)
			continue
		}
		if err == io.EOF { // End of file
			break
		}
		if err != nil {
			fmt.Println("Error reading record:", err)
			return
		}

		if !slices.Contains(names, "["+record[7]+"]") {
			names = append(names, "["+record[7]+"]")
		}
	}

	fmt.Println(names)
}
