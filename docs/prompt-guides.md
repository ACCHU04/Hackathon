# Prompt Guides

## 1. Claim Extraction Prompt

### System Prompt

```
You are an expert fact-checking assistant. Your task is to read the provided article text and decompose it into a list of discrete, atomic, verifiable factual claims.

Rules:
- Each claim must be a single, self-contained statement that can be independently verified against external sources.
- Do NOT include opinions, predictions, or normative statements (e.g., "X should do Y").
- Do NOT merge multiple facts into one claim.
- Preserve the original wording as closely as possible.
- For each claim, record the character offsets [start, end] of the exact span in the original text that gave rise to the claim.
- Output ONLY a valid JSON array. No markdown, no preamble, no explanation.

Output schema:
[
  {
    "id": "c1",
    "text": "<verifiable claim as a declarative sentence>",
    "original_span": [<start_char_offset>, <end_char_offset>]
  },
  ...
]
```

### User Prompt Template

```
Article text:
\"\"\"
{article_text}
\"\"\"

Extract all verifiable factual claims. Return only the JSON array.
```

---

## 2. Few-Shot Examples

### Example A — Science article

**Input text:**
> "NASA's James Webb Space Telescope, launched on December 25, 2021, has captured images of galaxies formed just 300 million years after the Big Bang. The telescope cost approximately $10 billion to develop and operates at –233 °C."

**Expected output:**
```json
[
  {
    "id": "c1",
    "text": "NASA's James Webb Space Telescope was launched on December 25, 2021.",
    "original_span": [6, 65],
    "claim_type": "verifiable_fact"
  },
  {
    "id": "c2",
    "text": "The James Webb Space Telescope has captured images of galaxies formed 300 million years after the Big Bang.",
    "original_span": [66, 155],
    "claim_type": "verifiable_fact"
  },
  {
    "id": "c3",
    "text": "The James Webb Space Telescope cost approximately $10 billion to develop.",
    "original_span": [156, 213],
    "claim_type": "verifiable_fact"
  },
  {
    "id": "c4",
    "text": "The James Webb Space Telescope operates at −233 °C.",
    "original_span": [214, 251],
    "claim_type": "verifiable_fact"
  }
]
```

---

### Example B — Political / current-events article

**Input text:**
> "The United States has the world's largest economy with a GDP of $25.46 trillion as of 2022. The country's unemployment rate fell to 3.4% in January 2023, the lowest since 1969. Analysts believe further rate hikes are inevitable."

**Expected output:**
```json
[
  {
    "id": "c1",
    "text": "The United States has the world's largest economy.",
    "original_span": [0, 49],
    "claim_type": "verifiable_fact"
  },
  {
    "id": "c2",
    "text": "The GDP of the United States was $25.46 trillion as of 2022.",
    "original_span": [50, 104],
    "claim_type": "verifiable_fact"
  },
  {
    "id": "c3",
    "text": "The US unemployment rate fell to 3.4% in January 2023.",
    "original_span": [105, 164],
    "claim_type": "verifiable_fact"
  },
  {
    "id": "c4",
    "text": "A 3.4% unemployment rate is the lowest in the US since 1969.",
    "original_span": [164, 201],
    "claim_type": "verifiable_fact"
  }
]
```

> ⚠️ Note: "Analysts believe further rate hikes are inevitable" is classified as **opinion/prediction** and is intentionally excluded.

---

### Example C — Health article (opinion vs. fact distinction)

**Input text:**
> "Pfizer's COVID-19 vaccine demonstrated 95% efficacy in clinical trials published in the New England Journal of Medicine in December 2020. Experts say vaccination is the best tool humanity has. The vaccine requires two doses administered 21 days apart."

**Expected output:**
```json
[
  {
    "id": "c1",
    "text": "Pfizer's COVID-19 vaccine demonstrated 95% efficacy in clinical trials.",
    "original_span": [0, 70],
    "claim_type": "verifiable_fact"
  },
  {
    "id": "c2",
    "text": "The clinical trial results were published in the New England Journal of Medicine in December 2020.",
    "original_span": [71, 155],
    "claim_type": "verifiable_fact"
  },
  {
    "id": "c3",
    "text": "Pfizer's COVID-19 vaccine requires two doses administered 21 days apart.",
    "original_span": [205, 263],
    "claim_type": "verifiable_fact"
  }
]
```

> ⚠️ "Vaccination is the best tool humanity has" is **opinion** — excluded.

---

## 3. Prompt Design Rationale

| Design Choice | Reason |
|---------------|--------|
| **Structured JSON-only output** | Eliminates parsing errors; enforced via `response_format={"type":"json_object"}` in OpenAI API |
| **Few-shot examples in prompt** | Anchors the model on what "atomic" and "verifiable" mean; reduces over-splitting or over-merging |
| **Opinion vs. fact tagging** | Allows downstream UI to optionally display or filter non-verifiable statements |
| **Character offset recording** | Enables the frontend to highlight the source span in the original text, improving explainability |
| **"No preamble" instruction** | Prevents models from outputting explanatory text before the JSON array |
| **Chain-of-thought (optional)** | For harder ambiguous claims, a two-pass approach can be used: first extract, then self-review each claim for atomicity |

---

## 4. Verification Prompt *(stub — future)*

When the verifier is implemented, it will use:

```
System: You are a fact-checking agent. You are given a single claim and a set of evidence passages retrieved from the web. Your task is to determine whether the claim is supported or contradicted by the evidence.

Verdict options:
- TRUE: the evidence strongly supports the claim
- FALSE: the evidence directly contradicts the claim
- PARTIALLY_TRUE: the evidence partially supports the claim with important caveats
- UNVERIFIABLE: the evidence is insufficient or not relevant

Output JSON: { "verdict": "...", "confidence": 0.0-1.0, "reasoning": "...", "citations": ["url1", "url2"] }
```
