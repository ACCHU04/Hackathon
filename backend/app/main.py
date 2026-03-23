"""
Fact & Claim Verification System — FastAPI application entry point.
"""

import os
from pathlib import Path

# Load .env from project root (one level up from backend/)
_env_path = Path(__file__).resolve().parents[2] / ".env"
if _env_path.exists():
    from dotenv import load_dotenv

    load_dotenv(_env_path, override=True)
    print(f"[OK] Loaded environment from {_env_path}")

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup / shutdown lifecycle."""
    print("[START] Fact & Claim Verifier backend starting up ...")
    yield
    print("[STOP] Shutting down ...")


app = FastAPI(
    title="Fact & Claim Verification API",
    description="AI-powered claim extraction and fact-checking engine.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok", "version": "0.1.0", "timestamp": time.time()}
