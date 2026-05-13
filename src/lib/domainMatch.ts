// Groups of semantically related domain names.
// Any two domains in the same group are considered a match.
const DOMAIN_GROUPS: string[][] = [
  [
    "it & software", "information technology", "software", "technology",
    "it services", "digital", "ict", "e-governance", "software development",
    "cyber", "cybersecurity", "cloud", "data", "ai", "fintech",
  ],
  [
    "civil engineering", "civil & construction", "civil", "construction",
    "infrastructure", "building", "roads", "highways", "bridge",
    "structural", "urban development", "smart city", "public works",
    "water & sanitation", "sanitation", "drainage", "irrigation",
  ],
  [
    "education & training", "education", "training", "e-learning",
    "skilling", "skill development", "vocational", "academic",
  ],
  [
    "healthcare", "health", "medical", "pharma", "pharmaceutical",
    "hospital", "diagnostics", "life sciences", "biomedical",
    "health & wellness", "medicine",
  ],
  [
    "agriculture", "agri", "farming", "horticulture", "food processing",
    "food & agriculture", "agro", "dairy", "fisheries",
  ],
  [
    "manufacturing", "production", "fabrication", "industrial",
    "engineering", "mechanical", "textiles", "garments", "apparel",
  ],
  [
    "logistics & transport", "logistics", "transport", "transportation",
    "supply chain", "freight", "shipping", "warehousing",
  ],
  [
    "energy & environment", "energy", "environment", "renewable energy",
    "solar", "wind", "power", "electricity", "green", "sustainability",
  ],
  [
    "defence & security", "defence", "defense", "security",
    "military", "armed forces",
  ],
];

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function findGroup(domain: string): string[] | null {
  const d = normalize(domain);
  return DOMAIN_GROUPS.find((group) => group.some((g) => d.includes(g) || g.includes(d))) ?? null;
}

export function domainsMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);

  // Exact match
  if (na === nb) return true;

  // One contains the other
  if (na.includes(nb) || nb.includes(na)) return true;

  // Same group
  const groupA = findGroup(a);
  const groupB = findGroup(b);
  if (groupA && groupB && groupA === groupB) return true;
  if (groupA && groupB) {
    // Check overlap between groups (they might be different array refs but share entries)
    return groupA.some((g) => groupB.includes(g));
  }

  return false;
}
