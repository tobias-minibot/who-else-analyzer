# Who Else? — Semantic Kernel Analyzer

The semantic kernel of things people ask about — mapped across 20 domains.

## What this is

A standalone visualization and analysis tool for the "Who Else?" catalog: 1,344 entries representing the full spectrum of things people search for, organized across 20 domains.

## Structure

```
who-else-analyzer/
  data/
    who-else-list.txt        # Master catalog — 1,344 entries
  src/
    who-else-visualization.html  # Interactive visualization (cloud, treemap, list)
    who-else-catalog.ts          # Catalog loader + intent matching engine
    WhoElseBar.tsx               # React UI component
    route.ts                     # API route (for integration)
  public/
    who-else-visualization.html  # Servable copy
  scripts/
    analyze-catalog.js           # Analysis utilities
  docs/
  config/
```

## Quick start

Open the visualization directly:
```bash
npm run dev
```

Or serve it locally:
```bash
npm run serve
```

Then open http://localhost:3001/who-else-visualization.html

## Domains (20)

Health & Medical, Mental Health & Wellness, Sports & Fitness, Arts & Crafts,
Music & Performance, Food & Drink, Home & Garden, Professional Services,
Education & Learning, Technology, Community & Social, Children & Family,
Animals & Pets, Environment & Sustainability, Transport & Mobility,
Events & Entertainment, Housing & Property, Trade & Repair,
Safety & Emergency, Government & Civic

## Relationship to UVI

This project was extracted from the Universal Voice Interface (UVI).
The catalog data and matching engine can be consumed by UVI or any
other system that needs intent-to-domain routing.
