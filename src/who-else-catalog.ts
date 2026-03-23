import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Load the master "who else?" catalog from data/who-else-list.txt
// Each line is "X who else?" — we strip the suffix to get the canonical name.
// ---------------------------------------------------------------------------

let _entries: string[] | null = null;

function loadCatalog(): string[] {
  if (_entries) return _entries;

  const filePath = path.join(process.cwd(), "data", "who-else-list.txt");
  const raw = fs.readFileSync(filePath, "utf-8");
  _entries = raw
    .split("\n")
    .map((line) => line.replace(/ who else\?$/i, "").trim())
    .filter(Boolean);
  return _entries;
}

/** All catalog entry names (e.g. "Hotel", "Museum", "Public transport"). */
export function getCatalogEntries(): string[] {
  return loadCatalog();
}

// ---------------------------------------------------------------------------
// Intent matching — finds catalog entries relevant to the user's message
// ---------------------------------------------------------------------------

export interface CatalogMatch {
  name: string; // canonical name from catalog, e.g. "Hotel"
  label: string; // "Hotel who else?"
  confidence: number; // 0-100
  matchedPhrase: string; // what in the user text triggered this match
}

// Common words to ignore when doing keyword matching
const STOP_WORDS = new Set([
  "i", "me", "my", "we", "our", "a", "an", "the", "and", "or", "to", "in",
  "for", "of", "on", "at", "is", "am", "are", "was", "be", "do", "it",
  "so", "up", "if", "no", "not", "but", "that", "this", "with", "from",
  "need", "want", "looking", "find", "get", "also", "really", "very",
  "much", "some", "going", "go", "would", "like", "can", "could",
  "should", "will", "just", "have", "had", "has", "been", "day", "days",
]);

// Map common user phrases → catalog entry names for fuzzy matching
const PHRASE_ALIASES: Record<string, string[]> = {
  "place to stay": ["Hotel", "Holiday rental", "Short-term stay"],
  "somewhere to stay": ["Hotel", "Holiday rental"],
  "accommodation": ["Hotel", "Holiday rental"],
  "museum guide": ["Museum", "Guided tour"],
  "visitors guide": ["Visitors guide", "Guided tour"],
  "city guide": ["City guide", "Guided tour"],
  "transport ticket": ["Public transport", "Transport ticket"],
  "public transport ticket": ["Public transport", "Transport ticket"],
  "bus ticket": ["Public transport", "Bus shuttle"],
  "train ticket": ["Public transport"],
  "apartment": ["Apartment"],
  "flat": ["Apartment", "Flat-share"],
  "plumber": ["Plumber"],
  "electrician": ["Electrician"],
  "doctor": ["Doctor"],
  "dentist": ["Dentist"],
  "restaurant": ["Restaurant"],
  "dinner": ["Restaurant"],
  "hotel": ["Hotel"],
  "taxi": ["Taxi"],
  "rental car": ["Car rental"],
  "bike": ["Bike rental", "Cycle-shop"],
};

/**
 * Matches user text against the who-else catalog.
 * Uses three strategies:
 *   1. Phrase alias mapping (highest confidence)
 *   2. Direct substring match (catalog entry name found in text)
 *   3. Keyword overlap (for multi-word entries)
 */
export function matchIntentsFromCatalog(text: string): CatalogMatch[] {
  const entries = loadCatalog();
  const lower = text.toLowerCase();
  const matches = new Map<string, CatalogMatch>();

  // --- Strategy 1: Phrase aliases ---
  for (const [phrase, targets] of Object.entries(PHRASE_ALIASES)) {
    if (lower.includes(phrase)) {
      for (const target of targets) {
        // Verify the target actually exists in catalog
        const found = entries.find((e) => e.toLowerCase() === target.toLowerCase());
        if (found && !matches.has(found)) {
          matches.set(found, {
            name: found,
            label: `${found} who else?`,
            confidence: 90,
            matchedPhrase: phrase,
          });
        }
      }
    }
  }

  // --- Strategy 2: Direct substring match (word-boundary aware) ---
  const inputWords = lower
    .split(/\W+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  for (const entry of entries) {
    if (matches.has(entry)) continue;
    const entryLower = entry.toLowerCase();

    // Skip very short entries (1-2 chars) to avoid false positives
    if (entryLower.length < 3) continue;

    // Use word-boundary regex to avoid "sport" matching inside "transport"
    const pattern = new RegExp(`\\b${entryLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (pattern.test(lower)) {
      matches.set(entry, {
        name: entry,
        label: `${entry} who else?`,
        confidence: 85,
        matchedPhrase: entryLower,
      });
    }
  }

  // --- Strategy 3: Keyword overlap for MULTI-WORD entries only ---
  for (const entry of entries) {
    if (matches.has(entry)) continue;
    const entryWords = entry
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    // Only use keyword overlap for entries with 2+ meaningful words
    // Single-word entries must match via Strategy 2 (word-boundary)
    if (entryWords.length < 2) continue;

    // Require exact word matches only (no prefix matching)
    const overlap = entryWords.filter((ew) =>
      inputWords.some((iw) => iw === ew)
    );

    // Require ALL entry words to match for high quality
    if (overlap.length === entryWords.length) {
      matches.set(entry, {
        name: entry,
        label: `${entry} who else?`,
        confidence: 80,
        matchedPhrase: overlap.join(" "),
      });
    }
  }

  // Sort by confidence descending, deduplicate overlapping concepts
  const sorted = Array.from(matches.values()).sort(
    (a, b) => b.confidence - a.confidence
  );

  return deduplicateMatches(sorted);
}

/**
 * Remove near-duplicate matches (e.g. both "Hotel" and "Holiday rental"
 * for "place to stay" — keep the highest confidence one unless they are
 * clearly distinct concepts).
 */
function deduplicateMatches(matches: CatalogMatch[]): CatalogMatch[] {
  const kept: CatalogMatch[] = [];
  const seenPhrases = new Set<string>();

  for (const m of matches) {
    // If the same phrase already produced a higher-confidence match, skip
    if (seenPhrases.has(m.matchedPhrase)) continue;
    kept.push(m);
    seenPhrases.add(m.matchedPhrase);
  }

  return kept;
}

// Simple emoji mapping for common intent types
const EMOJI_MAP: Record<string, string> = {
  hotel: "🏨", apartment: "🏢", house: "🏡", room: "🚪",
  museum: "🖼️", gallery: "🎨", theater: "🎭", cinema: "🎬",
  concert: "🎵", festival: "🎉", restaurant: "🍽️",
  taxi: "🚕", bus: "🚌", train: "🚆", scooter: "🛵",
  doctor: "🏥", dentist: "🦷", pharmacy: "💊",
  plumber: "🔩", electrician: "⚡", carpenter: "🪚",
  bike: "🚲", car: "🚗", parking: "🅿️",
  yoga: "🧘", fitness: "💪", dance: "💃",
  tutor: "📖", school: "🏫", babysitter: "👶",
  lawyer: "⚖️", insurance: "🛡️",
  "public transport": "🚌", "transport ticket": "🎫",
  "holiday rental": "🏖️", "guided tour": "🗺️",
  "visitors guide": "📍", "city guide": "🗺️",
  "tour guide": "🗺️",
};

/** Get a reasonable emoji for a catalog entry. */
export function getEmojiForEntry(name: string): string {
  const lower = name.toLowerCase();
  // Direct match
  if (EMOJI_MAP[lower]) return EMOJI_MAP[lower];
  // Partial match
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return emoji;
  }
  return "🔍";
}
