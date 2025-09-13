package main

import (
	"sort"
	"strings"

	"github.com/adrg/strutil"
	"github.com/adrg/strutil/metrics"
)

// Name represents a parsed name with first, last, and middle parts.

type Name struct {
	First  string
	Last   string
	Middle string
}

// parseName parses a string into a Name struct.
// It handles formats like "Last, First Middle" and "First Middle Last".
func parseName(fullName string) Name {
	fullName = strings.TrimSpace(fullName)
	if strings.Contains(fullName, ",") {
		parts := strings.Split(fullName, ",")
		lastName := strings.TrimSpace(parts[0])
		firstMiddle := strings.TrimSpace(parts[1])
		nameParts := strings.Fields(firstMiddle)
		firstName := nameParts[0]
		var middleName string
		if len(nameParts) > 1 {
			middleName = strings.Join(nameParts[1:], " ")
		}
		return Name{First: firstName, Last: lastName, Middle: middleName}
	} else {
		parts := strings.Fields(fullName)
		if len(parts) == 0 {
			return Name{}
		}
		firstName := parts[0]
		lastName := parts[len(parts)-1]
		var middleName string
		if len(parts) > 2 {
			middleName = strings.Join(parts[1:len(parts)-1], " ")
		}
		return Name{First: firstName, Last: lastName, Middle: middleName}
	}
}

// Match represents a potential match between two names, with a similarity score.
type Match struct {
	Name1     string
	Name2     string
	Score     float64
	JaroScore float64
}

// MatchNames performs fuzzy matching between two lists of names.
func MatchNames(list1, list2 []string) map[string]string {
	var potentialMatches []Match

	jaro := metrics.NewJaro()
	jaro.CaseSensitive = false

	for _, name1Str := range list1 {
		name1 := parseName(name1Str)
		var bestMatch *Match

		for _, name2Str := range list2 {
			name2 := parseName(name2Str)

			jaroScore := strutil.Similarity(name1.First+" "+name1.Last, name2.First+" "+name2.Last, jaro)

			if jaroScore > 0.8 {
				match := Match{
					Name1:     name1Str,
					Name2:     name2Str,
					JaroScore: jaroScore,
				}

				if bestMatch == nil || match.JaroScore > bestMatch.JaroScore {
					bestMatch = &match
				}
			}
		}

		if bestMatch != nil {
			potentialMatches = append(potentialMatches, *bestMatch)
		}
	}

	// Sort by score to get the best matches
	sort.Slice(potentialMatches, func(i, j int) bool {
		return potentialMatches[i].JaroScore > potentialMatches[j].JaroScore
	})

	// Create the final mapping, ensuring one-to-one mapping
	matches := make(map[string]string)
	used := make(map[string]bool)
	for _, match := range potentialMatches {
		if !used[match.Name1] && !used[match.Name2] {
			matches[match.Name1] = match.Name2
			used[match.Name1] = true
			used[match.Name2] = true
		}
	}

	return matches
}
