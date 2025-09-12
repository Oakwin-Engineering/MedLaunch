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
  "Abdul Kawa": "Kawa, Abdul",
  "Alfonso Brochero": "Brochero, Alfonso D",
  "Amanda Crews": "Crews, Amanda A",
  "Amy Daniels": "Daniels, Amy K",
  "Amy Reedy": "Reedy, Amy Michelle",
  "Angelia Moore": "Moore, Angelia Renee",
  "Anthony Patriarco": "Patriarco, Anthony Gerard",
  "Anthony Slonim": "Slonim, Anthony D.",
  "Aparna Ranjan": "Ranjan, Aparna",
  "April Ruffin": "Rivers, Rebecca",
  "Benjamin Davis": "Davis, Benjamin Cameron",
  "Bridgette Smoot": "Smoot, Bridgette M",
  "Cathy Arney": "Arney, Cathy",
  "Charles Moon": "Moon, Charles Keith",
  "Charles Welly": "Welly, Charles W",
  "Chinedum Ikwueme": "Ikwueme, Chinedum Rosemary",
  "Christie York": "York, Christie Leigh",
  "Christina Bowen": "Bowen, Christina",
  "Cody Hughes": "Hughes, Cody",
  "Craig Hayek": "Cary, Cassie A",
  "Cristin Bradley": "Bradley, Cristin",
  "Crystal Moss": "Moss, Crystal",
  "Daleen Lewis": "Lewis, Daleen Lynn",
  "Darleen Hoffert": "Hoffert, Darleen Cheryl",
  "Dawn Shire Crawford": "Crawford, Dawn",
  "Deborah Mahoney": "Mahoney, Deborah",
  "Deborah Parsons": "Parsons, Deborah Anne",
  "Desirae Downs": "Downs, Desirae",
  "Diane Blair": "Blair, Diane W",
  "Elizabeth Draper": "Draper, Elizabeth A",
  "Ellen Landreth": "Landreth, Ellen",
  "Gene Bailey Jr.": "Bailey, Gene Arnold",
  "Gina Martin": "Martin, Gina",
  "Indre Malaiskaite": "Malaiskaite, Indre",
  "Isabelle Tubbs": "Tubbs, Isabelle Dyer",
  "Isai Cruz": "Cruz, Isai",
  "Jacqueline Griffin": "Griffin, Jacqueline",
  "James Bates": "Bates, James Myrick",
  "Jayme Kressen": "Kressen, Jayme Lynn",
  "Jenna Holt": "Holt, Jenna",
  "Jennifer Davis": "Davis, Jennifer",
  "Jennifer Horne": "Horne, Jennifer",
  "Jeremy Whited": "Whited, Jeremy Shaun",
  "Jill Garrett": "Garrett, Jill",
  "Jingwen Mu": "Mu, Jingwen",
  "Johnee Nedrick": "Nedrick, Johnee",
  "Kara Waldrop": "Waldrop, Kara",
  "Karen Vickers": "Vickers, Karen Watson",
  "Katrina Griffin": "Griffin, Katrina",
  "Kayla Tomlin": "Tomlin, Kayla",
  "Khoi Nguyen": "Nguyen, Khoi An Tho",
  "Kimberly Williams": "Williams, Kimberly A.",
  "Kira Derby": "Derby, Kira",
  "Kreig Spahn": "Spahn, Kreig A.",
  "Krystal Woodson": "Woodson, Krystal",
  "Laszlo Vecsei": "Vecsei, Laszlo",
  "Lisa Coleman": "Coleman, Lisa",
  "Lisa Reedy": "Reedy, Lisa M",
  "Lori Fuquay": "Fuquay, Lori Dillard",
  "Mariana Herrera": "Herrera, Mariana",
  "Mary Catherine Prickett": "Prickett, Mary Catherine",
  "May Anderson": "Anderson, May A.C.",
  "Megan Osborne": "Osborne, Megan Lea",
  "Meladie Mitchell": "Mitchell, Meladie Sharie",
  "Melissa Aguilar": "Aguilar, Melissa Ann",
  "Miranda Fields": "Fields, Miranda C",
  "Mitchell Guanzon": "Guanzon, Mitchell Josef",
  "Molly Vaughan": "Vaughan, Molly E",
  "Natasha Estep": "Estep, Natasha Brittney",
  "Neil Schwartzman": "Schwartzman, Neil R",
  "Nikita Blakeney-Williams": "Blakeney-Williams, Nikita",
  "Pamela Scholl": "Scholl, Pamela J",
  "Rebecca Green": "Green, Rebecca J",
  "Sandra Kolb": "Kolb, Sandra",
  "Sarah Tiesing": "Tiesing, Sarah Willis",
  "Sarah Wells": "Wells, Sarah A",
  "Saree Allen": "Allen, Saree Nicole",
  "Shannon Hill": "Hill, Shannon",
  "Shanthi Rondot": "Rondot, Shanthi",
  "Shelly Bass": "Bass, Shelly",
  "Steven Tatum": "Tatum, Steven Douglas",
  "Tammi Hampton": "Hampton, Tammi Parker",
  "Taneisha Gayles": "Gayles, Taneisha Patrice",
  "Tennillya Pearce": "Pearce, Tennillya",
  "Tiffany Curry": "Curry, Tiffany Y",
  "Tiffany Douglas": "Douglas, Tiffany Farris",
  "Tiffany English": "English, Tiffany",
  "Timothy Mckernan": "McKernan, Timothy B",
  "Tracy Goen": "Goen, Tracy H",
  "Trixy Headden": "Headden, Trixy",
  "Zachary Page": "Page, Zachary Lee"
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
		"gemini-2.5-flash",
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
