package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"google.golang.org/genai"
)

const instruction string = `
I have two different lists of names in different formats within the same document. Please:

Parse and separate the two distinct name lists from the provided text.

Identify people who appear in both lists (same individuals with matching first and last names).

Return a JSON object containing only the matches.

Preserve the original name formatting from each list (don't standardize them).

Format the JSON as: {"name_from_list1": "name_from_list2"}.

The two lists may have different name formats (e.g., "Last, First Middle" vs "First Last"), different separators, or different structures. Focus on matching based on first and last names, being flexible with middle names/initials and minor variations.

Do not provide code or explanations - just return the raw JSON object.
`

func matchProviderNames(namesToMatch string, devMode bool) (map[string]string, error) {
	if devMode {
		var rawMap map[string]string
		response := `{
					"Alfonso Brochero": "Brochero, Alfonso D",
					"Lori Fuquay": "Fuquay, Lori Dillard",
					"Desirae Downs": "Downs, Desirae",
					"Amy Daniels": "Daniels, Amy K",
					"Kayla Tomlin": "Tomlin, Kayla",
					"Katrina Griffin": "Griffin, Katrina",
					"Amy Reedy": "Reedy, Amy Michelle",
					"Daleen Lewis": "Lewis, Daleen Lynn",
					"Dawn Shire Crawford": "Crawford, Dawn",
					"Tiffany Curry": "Curry, Tiffany Y",
					"Cristin Bradley": "Bradley, Cristin",
					"Anthony Patriarco": "Patriarco, Anthony Gerard",
					"Saree Allen": "Allen, Saree Nicole",
					"May Anderson": "Anderson, May A.C.",
					"Deborah Parsons": "Parsons, Deborah Anne",
					"Aparna Ranjan": "Ranjan, Aparna",
					"Meladie Mitchell": "Mitchell, Meladie Sharie",
					"Kara Waldrop": "Waldrop, Kara",
					"Jill Garrett": "Garrett, Jill",
					"Berna Jean Besana-Mirafuente": "Besana-Mirafuente, Berna Jean",
					"James Bates": "Bates, James Myrick",
					"Pamela Scholl": "Scholl, Pamela J",
					"Natasha Estep": "Estep, Natasha Brittney",
					"Mitchell Guanzon": "Guanzon, Mitchell Josef",
					"Isai Cruz": "Cruz, Isai",
					"Rebecca Green": "Green, Rebecca J",
					"Elizabeth Draper": "Draper, Elizabeth A",
					"Khoi Nguyen": "Nguyen, Khoi An Tho",
					"Deborah Mahoney": "Mahoney, Deborah",
					"Sandra Kolb": "Kolb, Sandra",
					"Angelia Moore": "Moore, Angelia Renee",
					"Tracy Goen": "Goen, Tracy H",
					"Jacqueline Griffin": "Griffin, Jacqueline",
					"Molly Vaughan": "Vaughan, Molly E",
					"Tiffany English": "English, Tiffany",
					"Shannon Hill": "Hill, Shannon",
					"Bridgette Smoot": "Smoot, Bridgette M",
					"Lisa Reedy": "Reedy, Lisa M",
					"Timothy Mckernan": "McKernan, Timothy B",
					"Christie York": "York, Christie Leigh",
					"Jennifer Horne": "Horne, Jennifer",
					"Shelly Bass": "Bass, Shelly",
					"Karen Vickers": "Vickers, Karen Watson",
					"Laszlo Vecsei": "Vecsei, Laszlo",
					"Jennifer Davis": "Davis, Jennifer",
					"Abdul Kawa": "Kawa, Abdul",
					"Kimberly Williams": "Williams, Kimberly A.",
					"Tiffany Douglas": "Douglas, Tiffany Farris",
					"Chinedum Ikwueme": "Ikwueme, Chinedum Rosemary",
					"Gina Martin": "Martin, Gina",
					"Mariana Herrera": "Herrera, Mariana",
					"Zachary Page": "Page, Zachary Lee",
					"Ellen Landreth": "Landreth, Ellen",
					"Sarah Wells": "Wells, Sarah A",
					"Taneisha Gayles": "Gayles, Taneisha Patrice",
					"Tennillya Pearce": "Pearce, Tennillya",
					"Krystal Woodson": "Woodson, Krystal",
					"Crystal Moss": "Moss, Crystal",
					"Kira Derby": "Derby, Kira",
					"Amanda Crews": "Crews, Amanda A",
					"Indre Malaiskaite": "Malaiskaite, Indre",
					"Jayme Kressen": "Kressen, Jayme Lynn",
					"Charles Moon": "Moon, Charles Keith",
					"Jeremy Whited": "Whited, Jeremy Shaun",
					"Johnee Nedrick": "Nedrick, Johnee",
					"Cathy Arney": "Arney, Cathy",
					"Charles Welly": "Welly, Charles W",
					"Miranda Fields": "Fields, Miranda C",
					"Jenna Holt": "Holt, Jenna",
					"Neil Schwartzman": "Schwartzman, Neil R",
					"Isabelle Tubbs": "Tubbs, Isabelle Dyer",
					"Trixy Headden": "Headden, Trixy",
					"Megan Osborne": "Osborne, Megan Lea",
					"Diane Blair": "Blair, Diane W",
					"Lisa Coleman": "Coleman, Lisa",
					"Shanthi Rondot": "Rondot, Shanthi",
					"Cody Hughes": "Hughes, Cody",
					"Mary Catherine Prickett": "Prickett, Mary Catherine",
					"Gene Bailey Jr.": "Bailey, Gene Arnold",
					"Jingwen Mu": "Mu, Jingwen",
					"Kreig Spahn": "Spahn, Kreig A.",
					"Anthony Slonim": "Slonim, Anthony D.",
					"Benjamin Davis": "Davis, Benjamin Cameron",
					"Tammi Hampton": "Hampton, Tammi Parker"
					}`

		if err := json.Unmarshal([]byte(response), &rawMap); err != nil {
			return nil, fmt.Errorf("failed to parse response: %v", err)
		}

		return rawMap, nil
	}

	ctx := context.Background()
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY not found")
	}

	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: apiKey,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create client: %v", err)
	}

	result, err := client.Models.GenerateContent(
		ctx,
		"gemini-2.5-pro",
		genai.Text(instruction+" "+namesToMatch),
		&genai.GenerateContentConfig{
			ResponseMIMEType: "application/json",
		},
	)

	if err != nil {
		return nil, fmt.Errorf("failed to generate content: %v", err)
	}

	// Parse the response into matches
	var rawMap map[string]string
	response := result.Text()

	if err := json.Unmarshal([]byte(response), &rawMap); err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	return rawMap, nil
}
