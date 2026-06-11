<p align="center">
  <img src="./frontend/public/truthlens-logo.svg" width="480" alt="TruthLens"/>
</p>

<p align="center">
  <strong>AI-powered fact verification engine — extract, search, and verify claims against real-world sources in real time.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11%2B-00D4FF?style=flat-square&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/Node-18%2B-00D4FF?style=flat-square&logo=node.js&logoColor=white" alt="Node"/>
  <img src="https://img.shields.io/badge/FastAPI-0.111-00D4FF?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Next.js-14-00D4FF?style=flat-square&logo=next.js&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/LangChain-0.2-00D4FF?style=flat-square&logo=chainlink&logoColor=white" alt="LangChain"/>
  <img src="https://img.shields.io/badge/license-MIT-00D4FF?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/PRs-welcome-00FF88?style=flat-square" alt="PRs Welcome"/>
</p>

---

## Overview

TruthLens is an end-to-end fact-checking platform that takes an article URL, raw text, uploaded file, or voice recording and automatically:

1. **Extracts** atomic, verifiable claims using LLMs (GPT-4o / Gemini)
2. **Searches** for corroborating and contradicting evidence across Wikipedia, SerpAPI, DuckDuckGo, and Tavily
3. **Verifies** each claim as **True**, **False**, **Partially True**, or **Unverifiable** with confidence scores and citations
4. **Detects** AI-generated text and AI-manipulated media (deepfakes)
5. **Surfaces** conflicting evidence with "what would change this verdict" analysis

The entire pipeline streams live via Server-Sent Events, presenting results as they arrive — no polling, no waiting.

---

## Features

- **Claim Extraction** — Decomposes complex articles into discrete, atomic, verifiable statements via LangChain + GPT-4o with structured JSON output, auto-retry, and Pydantic validation
- **Evidence Retrieval** — Multi-provider search (SerpAPI, DuckDuckGo, Google CSE, Tavily) with automatic fallback chain; Wikipedia as a trusted primary source
- **Verification** — LLM-based reasoning with NLI model aggregation (`cross-encoder/nli-deberta-v3-small`) for entailment classification
- **AI Text Detection** — Heuristic + perplexity-based analysis to estimate the likelihood that input text is LLM-generated
- **Media Deepfake Detection** — Scans article images and audio for AI-generated or manipulated content (EXIF, spectral, compression analysis)
- **Conflict Detection** — Identifies contradictory evidence across sources and generates "what would change this verdict" scenarios
- **Follow-up Queries** — Ask natural-language questions about any claim and get instant LLM-powered answers
- **Multi-language UI** — English, Hindi, Tamil, Kannada, Telugu, German with RTL support
- **Voice Input** — Browser Speech-to-Text for hands-free analysis
- **File Upload** — PDF, DOCX, TXT, HTML, Markdown (up to 10 MB)
- **Live Streaming** — SSE pipeline shows progress: Extract → Search → Verify → Conflicts → AI Detect → Media Scan
- **Mock Mode** — Runs fully without API keys for development, testing, and demonstrations
- **Docker Compose** — One-command deployment with health checks and dependency orchestration

---

## Architecture

```
                          ┌───────────────────────────────────────┐
                          │          Next.js Frontend             │
                          │  Text/URL · File · Voice · i18n × 6  │
                          │  SSE Pipeline · Live Claim Cards      │
                          └──────────────┬────────────────────────┘
                                         │ POST /stream (SSE)
                                         ▼
              ┌──────────────────────────────────────────────────┐
              │                 FastAPI Backend                   │
              │                                                    │
              │  ┌──────────┐  ┌────────────┐  ┌──────────────┐  │
              │  │ /extract │  │ /verify    │  │ /full-report │  │
              │  │ /stream  │  │ /detect    │  │ /detect-text │  │
              │  │ /health  │  │ /detect-media  │ /full-report-v2│
              │  └────┬─────┘  └─────┬──────┘  └──────┬───────┘  │
              │       │              │                  │         │
              │       ▼              ▼                  ▼         │
              │  ┌────────────┐ ┌────────────┐ ┌──────────────┐  │
              │  │  fetcher   │ │   claim_   │ │  search_     │  │
              │  │  .py       │ │  extractor │ │  client.py   │  │
              │  │  newspaper │ │  .py       │ │  SerpAPI     │  │
              │  │  + readable│ │  LangChain │ │  DuckDuckGo  │  │
              │  │  + httpx   │ │  + GPT-4o  │ │  + Tavily    │  │
              │  └─────┬──────┘ └──────┬─────┘ └──────┬───────┘  │
              │        │              │                │         │
              │        ▼              ▼                ▼         │
              │  ┌────────────┐ ┌────────────┐ ┌──────────────┐  │
              │  │  verifier  │ │  evidence_ │ │  ai_detection│  │
              │  │  .py       │ │  index.py  │ │  .py         │  │
              │  │  LLM + NLI │ │  FAISS     │ │  perplexity  │  │
              │  │  agg.      │ │  + SBERT   │ │  + heuristic │  │
              │  └─────┬──────┘ └────────────┘ └──────────────┘  │
              │        │                                          │
              │        ▼                                          │
              │  ┌─────────────────────────────────────────────┐  │
              │  │  conflict_detector.py  ·  media_detection  │  │
              │  │  LangChain reflection  ·  EXIF/spectral    │  │
              │  └─────────────────────────────────────────────┘  │
              └─────────────────┬────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │  OpenAI API  │     │  SerpAPI /   │     │  Redis       │
  │  Gemini API  │     │  DuckDuckGo  │     │  (optional)  │
  └──────────────┘     │  / Tavily    │     └──────────────┘
                       └──────────────┘
```

### Data Flow

```
1. User submits URL / text / file / voice via frontend
2. Frontend POSTs to /stream (SSE) → FastAPI backend
3. If URL → fetcher.py downloads & extracts (newspaper3k / readability-lxml)
4. claim_extractor.py sends text → OpenAI GPT-4o with structured few-shot prompt
   → returns JSON array of atomic claims with character offsets
5. search_client.py generates search queries → queries SerpAPI / DuckDuckGo / Tavily
   → retrieves top-N URLs per claim
6. evidence_index.py encodes passages (sentence-transformers) → FAISS ANN search
7. verifier.py passes (claim, evidence) → LLM + NLI model → verdict + confidence + citations
8. conflict_detector.py analyzes evidence for contradictions → "what would change" scenarios
9. ai_detection.py evaluates text for AI-generated characteristics
10. media_detection.py scans images/audio for deepfake indicators
11. Results stream back via SSE → frontend renders live claim cards
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 + TypeScript + Tailwind CSS | Production-grade UI with SSE streaming |
| **Backend** | FastAPI + Pydantic + Uvicorn | Async API with auto-docs & validation |
| **LLM** | OpenAI GPT-4o / Google Gemini (LangChain) | Claim extraction, verification reasoning |
| **Search** | SerpAPI / DuckDuckGo / Tavily / Google CSE | Web evidence retrieval with automatic fallback |
| **Vector Store** | FAISS + sentence-transformers | Local ANN evidence index (zero-infra) |
| **NLI Model** | `cross-encoder/nli-deberta-v3-small` | Entailment classification for verdict scoring |
| **Content Extraction** | newspaper3k + readability-lxml + httpx | Article parsing from URLs |
| **Caching** | Redis (optional) | Avoid re-fetching identical content |
| **Deployment** | Docker Compose | Container orchestration with health checks |
| **AI Detection (text)** | Heuristic + perplexity analysis | LLM-generated text probability scoring |
| **AI Detection (media)** | EXIF / spectral / compression analysis | Deepfake image & audio detection |

---

## Quickstart

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional, for containerized deployment)
- OpenAI API key (optional — leave blank for mock mode)

### 1. Clone & configure

```bash
git clone https://github.com/ACCHU04/Hackathon.git
cd Hackathon
cp .env.example .env
# Edit .env and add your API keys (leave blank to run in mock mode)
```

### 2. Run the backend

```bash
cd backend
pip install -r ../requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check: `http://localhost:8000/health`

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open: `http://localhost:3000`

### 4. Docker Compose (recommended for deployment)

```bash
cp .env.example .env
docker compose up --build
```

| Service | URL |
|---------|-----|
| Backend | `http://localhost:8000` |
| Frontend | `http://localhost:3000` |
| API Docs | `http://localhost:8000/docs` |

### 5. Run tests

```bash
cd backend
pytest app/tests/ -v
```

---

## Demo Scenarios

| Demo | Input | Expected Outcome |
|------|-------|-----------------|
| **Eiffel Tower** | *"The Eiffel Tower is located in London and was built in 1950..."* | Claims flagged **False** (location + date) and **True** (height) with Wikipedia citations |
| **JWST Facts** | *"NASA's James Webb Space Telescope was launched on December 25, 2021..."* | Claims verified as **True** against NASA and space agency sources |
| **US Economy** | *"The US has the world's largest economy with a GDP of $25.46 trillion..."* | Mixed verdicts — **True** (GDP ranking), **Partially True** (rate projections) |

The frontend includes one-click demo loaders on the input panel.

---

## API Reference

### `GET /health`

Service liveness check.

```json
{ "status": "ok", "version": "0.1.0", "timestamp": 1717000000.0 }
```

### `POST /extract`

Extract atomic verifiable claims from article URL or text.

**Body:** `{ "url": "...", "text": "..." }` (provide at least one)

**Response:** `{ "article": {...}, "claims": [...], "meta": {...} }`

### `POST /verify`

Full pipeline: extract → search → verify → return verdicts.

**Body:** `{ "url": "...", "text": "..." }`

**Response:** `{ "article": {...}, "claims": [...], "verdicts": [...], "meta": {...} }`

### `POST /full-report`

Complete pipeline including conflict detection and AI text detection.

**Response:** `{ "article", "claims", "verdicts", "conflicts", "ai_detection", "meta" }`

### `POST /stream`

SSE streaming endpoint. Emits events:

| Event | Payload |
|-------|---------|
| `stage` | `{ stage, message }` |
| `claims` | `{ article, claims }` |
| `verdict` | `{ verdict }` |
| `conflict` | `{ conflict }` |
| `ai` | `{ detection }` |
| `media` | `{ media }` |
| `done` | `{ meta }` |
| `error` | `{ detail }` |

### `POST /detect`

AI-generated text detection only.

**Response:** `{ "article_title", "detection": {...} }`

### `POST /detect-text`

Enhanced AI detection with perplexity + LLM blend.

**Response:** `{ "article_title", "word_count", "detection": {...} }`

### `POST /detect-media`

AI-generated media (image/audio) detection from a URL.

**Response:** `{ "total_media", "images_analyzed", "audio_analyzed", "flagged_count", "aggregate_ai_score", "label", "items": [...] }`

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENAI_API_KEY` | — | OpenAI API access (leave blank for mock mode) |
| `OPENAI_MODEL` | `gpt-4o` | LLM model identifier |
| `GOOGLE_GEMINI_KEY` | — | Alternative LLM provider (Gemini) |
| `SERPAPI_KEY` | — | SerpAPI web search (leave blank to disable) |
| `GOOGLE_CSE_API_KEY` | — | Google Custom Search API key |
| `GOOGLE_CSE_CX` | — | Google Custom Search Engine ID |
| `TAVILY_API_KEY` | — | Tavily search API (alternative to SerpAPI) |
| `REDIS_URL` | `redis://localhost:6379/0` | Optional caching layer |
| `FAISS_INDEX_PATH` | `./data/faiss_index` | FAISS vector index persistence path |
| `BACKEND_HOST` | `0.0.0.0` | Backend host binding |
| `BACKEND_PORT` | `8000` | Backend port |
| `LOG_LEVEL` | `INFO` | Logging verbosity |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Frontend API target |

DuckDuckGo is always available as a free fallback search provider — no API key required.

---

## Project Structure

```
fact-claim-verifier/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application entry point
│   │   ├── api/
│   │   │   ├── schema.py           # Pydantic request/response models
│   │   │   └── endpoints.py        # Route handlers (extract, verify, stream, detect...)
│   │   ├── services/
│   │   │   ├── fetcher.py          # Article download (newspaper3k / readability-lxml)
│   │   │   ├── claim_extractor.py  # LangChain claim extraction with auto-retry
│   │   │   ├── search_client.py    # Multi-provider search abstraction
│   │   │   ├── evidence_index.py   # FAISS vector store for evidence
│   │   │   ├── verifier.py         # LLM + NLI verdict generation
│   │   │   ├── conflict_detector.py # Contradiction analysis
│   │   │   ├── ai_detection.py     # AI-generated text detection
│   │   │   ├── media_detection.py  # Deepfake image/audio detection
│   │   │   ├── query_generator.py  # Search query formulation
│   │   │   ├── wikipedia_source.py # Wikipedia trusted source interface
│   │   │   ├── llm_provider.py     # LLM provider abstraction
│   │   │   ├── caching.py          # Redis caching layer
│   │   │   └── readability.py      # Text readability utilities
│   │   ├── models/
│   │   │   ├── nli.py              # NLI model wrapper
│   │   │   └── embeddings.py       # Sentence transformer embeddings
│   │   └── tests/
│   │       ├── test_claim_extractor.py
│   │       ├── test_query_generator.py
│   │       ├── test_wikipedia_source.py
│   │       ├── test_media_detection.py
│   │       ├── test_ai_detection.py
│   │       └── __init__.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── truthlens.html          # Standalone HTML UI
│   │   ├── truthlens-app.js        # Full UI application logic
│   │   ├── truthlens-logo.svg      # Brand logo
│   │   └── globals.css             # Global styles
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.tsx           # Redirect to standalone UI
│   │   │   ├── reports.tsx         # Reports page
│   │   │   ├── docs.tsx            # Documentation page
│   │   │   ├── demo.tsx            # Demo page
│   │   │   ├── _app.tsx            # App wrapper
│   │   │   └── _document.tsx       # HTML document
│   │   ├── components/
│   │   │   ├── Header.tsx          # Navigation header
│   │   │   ├── ClaimCard.tsx       # Individual claim display
│   │   │   ├── ClaimList.tsx       # Claim list container
│   │   │   ├── AccuracyMeter.tsx   # Accuracy ring visualization
│   │   │   ├── Pipeline.tsx        # Pipeline progress bar
│   │   │   ├── StreamLog.tsx       # SSE event logger
│   │   │   └── Ticker.tsx          # Live ticker
│   │   └── styles/
│   │       └── globals.css
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
├── docs/
│   ├── prompt-guides.md
│   ├── evaluation-plan.md
│   ├── demo-scenarios.md
│   └── accuracy-improvements.md
├── evaluation/
│   ├── datasets/
│   ├── evaluation_scripts/
│   │   └── eval_extractor.py
│   └── metrics.md
├── examples/
│   ├── demo1_true.json
│   ├── demo2_false.json
│   └── demo3_conflicting.json
├── infra/
│   └── docker/
│       ├── backend.Dockerfile
│       └── frontend.Dockerfile
├── scripts/
│   ├── run_local.sh
│   └── ingest_demo.sh
├── .github/
│   └── workflows/
│       └── ci.yml
├── docker-compose.yml
├── architecture.md
├── pyproject.toml
├── pytest.ini
├── requirements.txt
└── .env.example
```

---

## Evaluation & Datasets

The project includes evaluation infrastructure:

- **FEVER / LIAR** dataset scripts in `evaluation/`
- **Metrics tracking** — precision, recall, F1, confidence calibration
- **Extractor eval** — compares LLM-extracted claims against human-annotated gold standards
- **Demo JSON files** — input/output pairs for regression testing

See [`docs/evaluation-plan.md`](./docs/evaluation-plan.md) and [`evaluation/metrics.md`](./evaluation/metrics.md) for details.

---

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository and create a feature branch
2. **Run tests** — `cd backend && pytest app/tests/ -v`
3. **Lint** — `cd backend && ruff check app/`
4. **Commit** with clear, descriptive messages
5. **Open a PR** with a summary of changes and test results

All PRs must pass CI (lint + tests) before merging.

---

## License

MIT — see [LICENSE](./LICENSE) for details.
