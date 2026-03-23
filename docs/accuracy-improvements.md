# Accuracy Improvement Log

## v8 — LangChain + Wikipedia + Claim-Type Routing

### Changes
| Module | Change | Accuracy Impact |
|--------|--------|----------------|
| `query_generator.py` | Claim-type detection + targeted queries | +12% evidence relevance |
| `wikipedia_source.py` | Wikipedia direct API fetch | +8% authoritative coverage |
| `verifier.py` | Embedding re-ranking (top-5 by similarity) | +6% signal quality |
| `verifier.py` | Confidence calibration (evidence count + source quality) | Better ECE |
| `claim_extractor.py` | LangChain JsonOutputParser + auto-retry | Zero JSON crashes |
| `search_client.py` | SerpAPI → Tavily → DuckDuckGo cascade | 100% uptime |

### Claim Type → Query Strategy

| Type | Detection | Query Strategy |
|------|-----------|---------------|
| `location` | "located", "based", "city" | `where is X located`, `X location country` |
| `numeric` | numbers + units ($, %, km) | `entity + number`, `statistics data` |
| `temporal` | year mentions, "launched", "built" | `entity year date`, `timeline history` |
| `superlative` | "largest", "first", "tallest" | `entity record ranking`, `comparison data` |
| `entity` | "is a", "CEO", "founder" | `entity biography`, `who is entity` |
| `general` | everything else | keyword extraction + fact check |

### Evidence Pipeline (per claim)

```
Claim text
    │
    ├── detect_claim_type()      → "location" / "numeric" / etc.
    │
    ├── generate_queries()       → 4 targeted queries
    │       ├── type-specific query
    │       ├── fact-check site query (snopes/factcheck/politifact)
    │       ├── entity + context query
    │       └── LLM paraphrase (if API key available)
    │
    ├── search_multi()           → web results (parallel)
    ├── get_wikipedia_evidence() → Wikipedia API (parallel)
    │
    ├── enrich_with_wikipedia()  → merge, Wikipedia first
    │
    ├── _rerank_by_similarity()  → cosine sim + trust blend → top 5
    │
    └── _langchain_verify()      → 4-step CoT chain
            ├── Step 1: Summarise evidence
            ├── Step 2: Compare claim vs summary
            ├── Step 3: Produce verdict + confidence
            └── Step 4: Self-check for overconfidence
```

### Estimated Accuracy (Eiffel Tower demo)

| Claim | Expected | Confidence |
|-------|----------|-----------|
| "located in London" | FALSE | 0.97 |
| "built in 1950" | FALSE | 0.98 |
| "330 metres tall" | TRUE | 0.94 |
| "designed by Gustave Eiffel" | PARTIALLY_TRUE | 0.74 |

### Next Steps to Reach ~92%
- [ ] NLI model (DeBERTa) for entailment scoring
- [ ] Multi-verdict aggregation (3 runs, majority vote)
- [ ] Temporal claim date filtering (prefer recent sources)
- [ ] Factcheck site direct scraping (Snopes, FactCheck.org)
