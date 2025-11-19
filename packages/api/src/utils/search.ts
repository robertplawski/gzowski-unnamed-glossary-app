/**
 * Enhanced Search Algorithm for Glossary Entries
 *
 * Implements a multi-tier scoring system with:
 * - Exact match prioritization (100 points)
 * - Prefix matching with word boundaries (80 points)
 * - Full-word phrase matching (60 points)
 * - Substring matching with restrictions (40 points)
 * - Fuzzy matching with Levenshtein distance (20 points)
 * - Semantic expansion using definitions (15 points)
 * - Short word/phrase handling (<4 characters)
 * - Word boundary enforcement using regex \b
 * - Logarithmic decay for long text matches
 * - Performance optimizations with caching
 */

// Scoring constants
const SCORES = {
  EXACT_MATCH: 100,
  PREFIX_MATCH: 80,
  FULL_WORD_PHRASE: 60,
  SUBSTRING_MATCH: 40,
  FUZZY_MATCH: 20,
  SEMANTIC_MATCH: 15,
} as const;

// Search configuration
const SEARCH_CONFIG = {
  MAX_FUZZY_DISTANCE: 2,
  SHORT_WORD_THRESHOLD: 4,
  MIN_WORD_LENGTH: 2,
  MAX_RESULTS: 100,
  FUZZY_LENGTH_MULTIPLIERS: {
    2: 0, // No fuzzy matching for 2-letter words
    3: 1, // 1 edit max for 3-letter words
    4: 1, // 1 edit max for 4-letter words
    default: 2, // 2 edits max for longer words
  },
} as const;

export interface SearchResult<T = any> {
  entry: T;
  score: number;
  matchType: string;
  matchedFields: string[];
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  includeFuzzy?: boolean;
  includeSemantic?: boolean;
}

export interface SearchStats {
  totalResults: number;
  averageScore: number;
  matchTypeDistribution: Record<string, number>;
  queryLength: number;
  executionTime: number;
}

// Simple LRU cache for search results to improve performance
class SearchCache {
  private cache = new Map<
    string,
    { results: SearchResult[]; timestamp: number }
  >();
  private maxSize = 100; // Maximum number of cached queries
  private ttl = 5 * 60 * 1000; // 5 minutes TTL

  get(key: string): SearchResult[] | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if cached item is still valid
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.results;
  }

  set(key: string, results: SearchResult[]): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (!oldestKey) {
        return;
      }
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      results,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

const searchCache = new SearchCache();

/**
 * Calculate Levenshtein distance between two strings
 * Measures the minimum number of single-character edits (insertions, deletions, or substitutions)
 * required to change one word into the other
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  // If one string is empty, return the length of the other
  if (str1.length === 0) return str2.length;
  if (str2.length === 0) return str1.length;

  // Initialize the matrix
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Check for exact match (case-insensitive)
 */
function hasExactMatch(text: string, query: string): boolean {
  return text.toLowerCase() === query.toLowerCase();
}

/**
 * Check for prefix match with word boundary enforcement
 * Ensures the query matches at the beginning of a word
 */
function hasPrefixMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Use word boundary to ensure prefix matching at word starts
  const prefixRegex = new RegExp(`\\b${escapeRegExp(lowerQuery)}`, "i");
  return prefixRegex.test(lowerText);
}

/**
 * Check for whole word match using word boundaries
 * Prevents matching embedded substrings
 */
function hasWholeWordMatch(text: string, query: string): boolean {
  const lowerQuery = query.toLowerCase();

  // Use word boundaries to match complete words only
  const wordRegex = new RegExp(`\\b${escapeRegExp(lowerQuery)}\\b`, "i");
  return wordRegex.test(text.toLowerCase());
}

/**
 * Check for substring match
 * For short queries, applies additional restrictions to avoid noise
 */
function hasSubstringMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Basic substring check
  if (!lowerText.includes(lowerQuery)) {
    return false;
  }

  // For short queries, ensure meaningful matches
  if (query.length < SEARCH_CONFIG.SHORT_WORD_THRESHOLD) {
    const words = lowerText.split(/\s+/);
    // Check if the query appears as a meaningful part of words
    return words.some((word) => {
      // Allow substring if it's at the start/end or creates a meaningful variation
      return (
        word.startsWith(lowerQuery) ||
        word.endsWith(lowerQuery) ||
        (word.includes(lowerQuery) && word.length <= query.length + 3)
      );
    });
  }

  return true;
}

/**
 * Calculate fuzzy match score based on Levenshtein distance
 * Returns score proportional to similarity (0 if no good match)
 */
function calculateFuzzyScore(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Determine maximum allowed edit distance based on query length
  const maxDistance = SEARCH_CONFIG.FUZZY_LENGTH_MULTIPLIERS[
    lowerQuery.length <= 4 ? lowerQuery.length : "default"
  ] as number;

  if (maxDistance === 0) return 0; // No fuzzy matching for very short queries

  // Check individual words for fuzzy matches
  const words = lowerText.split(/\s+/);
  let bestScore = 0;

  for (const word of words) {
    const distance = levenshteinDistance(word, lowerQuery);
    if (distance <= maxDistance) {
      // Calculate score based on similarity (inverse of distance)
      const similarity =
        1 - distance / Math.max(word.length, lowerQuery.length);
      const score = SCORES.FUZZY_MATCH * similarity;
      bestScore = Math.max(bestScore, score);
    }
  }

  return bestScore;
}

/**
 * Extract synonyms and related terms from entry definitions
 * This is a simplified implementation - can be enhanced with NLP libraries
 */
function extractSemanticTerms(entry: Record<string, any>): string[] {
  const terms: string[] = [];

  // Extract from translation field
  if (entry.translation) {
    // Simple synonym extraction: split by common delimiters
    const translationTerms = entry.translation
      .split(/[,;\/\(\)]/)
      .map((term) => term.trim().toLowerCase())
      .filter((term) => term.length > 2 && term.length < 20);
    terms.push(...translationTerms);
  }

  // Extract from example field (look for definitions in parentheses)
  if (entry.example) {
    const definitionMatch = entry.example.match(/\(([^)]+)\)/g);
    if (definitionMatch) {
      definitionMatch.forEach((match) => {
        const cleanTerm = match.replace(/[()]/g, "").trim().toLowerCase();
        if (cleanTerm.length > 2 && cleanTerm.length < 30) {
          terms.push(cleanTerm);
        }
      });
    }
  }

  return [...new Set(terms)]; // Remove duplicates
}

/**
 * Calculate semantic match score
 */
function calculateSemanticScore(
  entry: Record<string, any>,
  query: string,
): number {
  const semanticTerms = extractSemanticTerms(entry);
  const lowerQuery = query.toLowerCase();

  // Check if query matches any semantic terms
  const hasSemanticMatch = semanticTerms.some(
    (term) => term.includes(lowerQuery) || lowerQuery.includes(term),
  );

  return hasSemanticMatch ? SCORES.SEMANTIC_MATCH : 0;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Analyze entry against query and return comprehensive match information
 * Implements the multi-tier scoring system with all specified requirements
 */
export function analyzeEntryMatch(
  entry: Record<string, any>,
  query: string,
  options: { includeFuzzy?: boolean; includeSemantic?: boolean } = {},
): { score: number; matchType: string; matchedFields: string[] } {
  const lowerQuery = query.toLowerCase();
  let totalScore = 0;
  const matchedFields: string[] = [];
  let primaryMatchType = "no_match";

  // Define searchable fields in order of importance (weights)
  const searchableFields = [
    { field: "word", weight: 1.0 },
    { field: "translation", weight: 0.8 },
    { field: "partOfSpeech", weight: 0.6 },
    { field: "pronunciation", weight: 0.5 },
    { field: "example", weight: 0.4 },
    { field: "notes", weight: 0.3 },
  ];

  // Track scores by match type for better classification
  const matchTypeScores: Record<string, number> = {};

  for (const { field, weight } of searchableFields) {
    const fieldValue = entry[field];
    if (!fieldValue || typeof fieldValue !== "string") continue;

    let fieldScore = 0;
    let fieldMatchType = "";

    // 1. Exact match (highest priority - 100 points)
    if (hasExactMatch(fieldValue, query)) {
      fieldScore = SCORES.EXACT_MATCH * weight;
      fieldMatchType = "exact";
      matchedFields.push(field);
    }
    // 2. Prefix match with word boundaries (80 points)
    else if (hasPrefixMatch(fieldValue, query)) {
      fieldScore = SCORES.PREFIX_MATCH * weight;
      fieldMatchType = "prefix";
      matchedFields.push(field);
    }
    // 3. Whole word match with word boundaries (60 points)
    else if (hasWholeWordMatch(fieldValue, query)) {
      fieldScore = SCORES.FULL_WORD_PHRASE * weight;
      fieldMatchType = "whole_word";
      matchedFields.push(field);
    }
    // 4. Substring match with restrictions for short queries (40 points)
    else if (hasSubstringMatch(fieldValue, query)) {
      // Special handling for short queries to avoid noise
      if (query.length < SEARCH_CONFIG.SHORT_WORD_THRESHOLD) {
        // Apply stricter criteria for short queries
        const words = fieldValue.toLowerCase().split(/\s+/);
        const hasMeaningfulSubstring = words.some((word) => {
          return (
            word.startsWith(lowerQuery) ||
            word.endsWith(lowerQuery) ||
            (word.includes(lowerQuery) &&
              Math.abs(word.length - query.length) <= 3)
          );
        });

        if (hasMeaningfulSubstring) {
          fieldScore = SCORES.SUBSTRING_MATCH * weight * 0.7; // Reduced score for short queries
          fieldMatchType = "substring_restricted";
          matchedFields.push(field);
        }
      } else {
        fieldScore = SCORES.SUBSTRING_MATCH * weight;
        fieldMatchType = "substring";
        matchedFields.push(field);
      }
    }
    // 5. Fuzzy match (if enabled and no better match found - 20 points max)
    else if (options.includeFuzzy && fieldScore === 0) {
      const fuzzyScore = calculateFuzzyScore(fieldValue, query);
      if (fuzzyScore > 0) {
        fieldScore = fuzzyScore * weight;
        fieldMatchType = "fuzzy";
        matchedFields.push(field);
      }
    }

    // Apply logarithmic decay for very long texts to prevent noise
    if (fieldValue.length > 100 && fieldScore > 0) {
      const decayFactor = Math.log(100) / Math.log(fieldValue.length);
      fieldScore *= decayFactor;
    }

    // Track scores by match type
    if (fieldMatchType) {
      matchTypeScores[fieldMatchType] =
        (matchTypeScores[fieldMatchType] || 0) + fieldScore;
    }

    totalScore += fieldScore;
  }

  // 6. Semantic matching (if enabled - 15 points max)
  if (options.includeSemantic && totalScore === 0) {
    const semanticScore = calculateSemanticScore(entry, query);
    if (semanticScore > 0) {
      totalScore += semanticScore;
      matchTypeScores["semantic"] = semanticScore;
      matchedFields.push("semantic");
    }
  }

  // Determine primary match type based on highest scoring match
  if (totalScore > 0) {
    const sortedMatchTypes = Object.entries(matchTypeScores).sort(
      ([, a], [, b]) => b - a,
    );
    primaryMatchType = sortedMatchTypes[0]?.[0] || "unknown";
  }

  return {
    score: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
    matchType: primaryMatchType,
    matchedFields: [...new Set(matchedFields)], // Remove duplicates
  };
}

/**
 * Enhanced search function with comprehensive scoring and ranking
 * Includes caching for improved performance
 */
export function performEnhancedSearch<T extends Record<string, any>>(
  entries: T[],
  query: string,
  options: SearchOptions = {},
): SearchResult<T>[] {
  const {
    limit = SEARCH_CONFIG.MAX_RESULTS,
    offset = 0,
    includeFuzzy = true,
    includeSemantic = true,
  } = options;

  if (!query || query.trim().length === 0) {
    return entries.map((entry) => ({
      entry,
      score: 0,
      matchType: "no_query",
      matchedFields: [],
    }));
  }

  const trimmedQuery = query.trim();

  // Create cache key based on query and options
  const cacheKey = `${trimmedQuery.toLowerCase()}_${includeFuzzy}_${includeSemantic}_${limit}_${offset}`;

  // Check cache first (only for queries longer than 2 characters to avoid excessive caching)
  if (trimmedQuery.length > 2) {
    const cachedResults = searchCache.get(cacheKey);
    if (cachedResults) {
      return cachedResults as SearchResult<T>[];
    }
  }

  // Analyze all entries with the enhanced algorithm
  const analyzedResults: SearchResult<T>[] = entries.map((entry) => {
    const analysis = analyzeEntryMatch(entry, trimmedQuery, {
      includeFuzzy,
      includeSemantic,
    });

    return {
      entry,
      ...analysis,
    };
  });

  // Filter out non-matching entries and sort by score (descending)
  const matchingResults = analyzedResults
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);

  // Apply pagination
  const startIndex = offset;
  const endIndex = offset + limit;

  const finalResults = matchingResults.slice(startIndex, endIndex);

  // Cache the results (only for queries longer than 2 characters)
  if (trimmedQuery.length > 2) {
    searchCache.set(cacheKey, finalResults);
  }

  return finalResults;
}

/**
 * Get search statistics for debugging and analysis
 */
export function getSearchStats<T>(
  searchResults: SearchResult<T>[],
): SearchStats {
  if (searchResults.length === 0) {
    return {
      totalResults: 0,
      averageScore: 0,
      matchTypeDistribution: {},
      queryLength: 0,
      executionTime: 0,
    };
  }

  const totalScore = searchResults.reduce(
    (sum, result) => sum + result.score,
    0,
  );
  const averageScore = totalScore / searchResults.length;

  // Count match types
  const matchTypeDistribution: Record<string, number> = {};
  searchResults.forEach((result) => {
    matchTypeDistribution[result.matchType] =
      (matchTypeDistribution[result.matchType] || 0) + 1;
  });

  return {
    totalResults: searchResults.length,
    averageScore: Math.round(averageScore * 100) / 100,
    matchTypeDistribution,
    queryLength: 0, // Will be set by caller if needed
    executionTime: 0, // Will be set by caller if needed
  };
}

/**
 * Get cache statistics for performance monitoring
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
  ttl: number;
} {
  return {
    size: searchCache.size,
    maxSize: 100,
    ttl: 5 * 60 * 1000, // 5 minutes in milliseconds
  };
}

/**
 * Clear search cache (useful for testing or memory management)
 */
export function clearSearchCache(): void {
  searchCache.clear();
}

export default {
  performEnhancedSearch,
  analyzeEntryMatch,
  getSearchStats,
  levenshteinDistance,
};

