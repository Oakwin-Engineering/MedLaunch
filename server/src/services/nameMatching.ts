// Name represents a parsed name with first, last, and middle parts
interface Name {
  first: string;
  last: string;
  middle: string;
}

// Match represents a potential match between two names, with a similarity score
interface Match {
  name1: string;
  name2: string;
  jaroScore: number;
}

/**
 * Calculates the Jaro similarity between two strings
 */
function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Find transpositions
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions / 2) / matches) /
    3.0
  );
}

/**
 * Calculates the Jaro-Winkler similarity between two strings
 * Returns a value between 0 and 1, where 1 is an exact match
 */
function jaroWinkler(
  s1: string,
  s2: string,
  options?: { caseSensitive?: boolean }
): number {
  const caseSensitive = options?.caseSensitive ?? true;

  let str1 = s1;
  let str2 = s2;

  if (!caseSensitive) {
    str1 = s1.toLowerCase();
    str2 = s2.toLowerCase();
  }

  const jaroScore = jaroSimilarity(str1, str2);

  // Find common prefix up to 4 characters
  let prefixLength = 0;
  const maxPrefix = Math.min(4, Math.min(str1.length, str2.length));

  for (let i = 0; i < maxPrefix; i++) {
    if (str1[i] === str2[i]) {
      prefixLength++;
    } else {
      break;
    }
  }

  // Jaro-Winkler formula: jw = j + (p * l * (1 - j))
  // where p = scaling factor (0.1), l = prefix length
  const scalingFactor = 0.1;
  return jaroScore + prefixLength * scalingFactor * (1 - jaroScore);
}

/**
 * Parses a string into a Name object
 * Handles formats like "Last, First Middle" and "First Middle Last"
 */
function parseName(fullName: string): Name {
  fullName = fullName.trim();

  if (fullName.includes(",")) {
    const parts = fullName.split(",");
    const lastName = parts[0].trim();
    const firstMiddle = parts[1].trim();
    const nameParts = firstMiddle.split(/\s+/);
    const firstName = nameParts[0];
    const middleName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    return { first: firstName, last: lastName, middle: middleName };
  } else {
    const parts = fullName.split(/\s+/);
    if (parts.length === 0) {
      return { first: "", last: "", middle: "" };
    }
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    const middleName = parts.length > 2 ? parts.slice(1, -1).join(" ") : "";
    return { first: firstName, last: lastName, middle: middleName };
  }
}

/**
 * Performs fuzzy matching between two lists of names
 * Uses Jaro-Winkler similarity algorithm
 */
export function matchNames(
  list1: string[],
  list2: string[]
): Record<string, string> {
  const potentialMatches: Match[] = [];

  for (const name1Str of list1) {
    const name1 = parseName(name1Str);
    let bestMatch: Match | null = null;

    for (const name2Str of list2) {
      const name2 = parseName(name2Str);

      // Calculate similarity using Jaro-Winkler algorithm
      const jaroScore = jaroWinkler(
        `${name1.first} ${name1.last}`,
        `${name2.first} ${name2.last}`,
        { caseSensitive: false }
      );

      if (jaroScore >= 0.8) {
        const match: Match = {
          name1: name1Str,
          name2: name2Str,
          jaroScore,
        };

        if (!bestMatch || match.jaroScore > bestMatch.jaroScore) {
          bestMatch = match;
        }
      }
    }

    if (bestMatch) {
      potentialMatches.push(bestMatch);
    }
  }

  // Sort by score to get the best matches
  potentialMatches.sort((a, b) => b.jaroScore - a.jaroScore);

  // Create the final mapping, ensuring one-to-one mapping
  const matches: Record<string, string> = {};
  const used = new Set<string>();

  for (const match of potentialMatches) {
    if (!used.has(match.name1) && !used.has(match.name2)) {
      if (process.env.LOG_MODE === "debug") {
        console.log(
          `Match Found: ${match.name1} -> ${
            match.name2
          } (Jaro Score: ${match.jaroScore.toFixed(4)})`
        );
      }
      matches[match.name1] = match.name2;
      used.add(match.name1);
      used.add(match.name2);
    }
  }

  return matches;
}
