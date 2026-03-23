"""
LLM Provider — unified interface supporting OpenAI and Google Gemini.

Usage:
  from app.services.llm_provider import get_chat_llm, get_async_client, get_model_name, PROVIDER

LangChain services:   chat_llm = get_chat_llm()
Direct SDK services:  client   = get_async_client()
"""
import os

PROVIDER: str = "none"  # "openai" | "gemini" | "none"


def _detect_provider() -> str:
    if os.getenv("GOOGLE_GEMINI_KEY", "").strip():
        return "gemini"
    if os.getenv("OPENAI_API_KEY", "").strip():
        return "openai"
    return "none"


def get_provider() -> str:
    return _detect_provider()


def get_model_name() -> str:
    provider = _detect_provider()
    if provider == "gemini":
        return os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    return os.getenv("OPENAI_MODEL", "gpt-4o")


def get_chat_llm(**kwargs):
    """Return a LangChain ChatModel (ChatOpenAI or ChatGoogleGenerativeAI)."""
    provider = _detect_provider()

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        api_key = os.getenv("GOOGLE_GEMINI_KEY", "").strip()
        model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        return ChatGoogleGenerativeAI(
            model=model,
            google_api_key=api_key,
            temperature=kwargs.get("temperature", 0),
            max_retries=kwargs.get("max_retries", 3),
        )

    if provider == "openai":
        from langchain_openai import ChatOpenAI
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        model = os.getenv("OPENAI_MODEL", "gpt-4o")
        return ChatOpenAI(
            model=model,
            api_key=api_key,
            temperature=kwargs.get("temperature", 0),
            max_retries=kwargs.get("max_retries", 3),
            request_timeout=kwargs.get("request_timeout", 30),
        )

    return None


async def llm_chat_json(prompt: str, max_tokens: int = 200) -> dict | None:
    """
    Simple JSON-output chat call that works with either provider.
    Returns parsed dict or None on failure.
    """
    import json
    provider = _detect_provider()

    if provider == "gemini":
        try:
            import google.generativeai as genai
            api_key = os.getenv("GOOGLE_GEMINI_KEY", "").strip()
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-2.0-flash"))
            response = await model.generate_content_async(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0,
                    max_output_tokens=max_tokens,
                    response_mime_type="application/json",
                ),
            )
            return json.loads(response.text)
        except Exception as exc:
            print(f"[llm_provider] Gemini call failed: {exc}")
            return None

    if provider == "openai":
        try:
            from openai import AsyncOpenAI
            api_key = os.getenv("OPENAI_API_KEY", "").strip()
            client = AsyncOpenAI(api_key=api_key)
            resp = await client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o"),
                temperature=0,
                max_tokens=max_tokens,
                response_format={"type": "json_object"},
                messages=[{"role": "user", "content": prompt}],
            )
            return json.loads(resp.choices[0].message.content or "{}")
        except Exception as exc:
            print(f"[llm_provider] OpenAI call failed: {exc}")
            return None

    return None


async def llm_chat_text(prompt: str, system: str = "", max_tokens: int = 80) -> str | None:
    """Simple text-output chat call that works with either provider."""
    provider = _detect_provider()

    if provider == "gemini":
        try:
            import google.generativeai as genai
            api_key = os.getenv("GOOGLE_GEMINI_KEY", "").strip()
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(
                os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
                system_instruction=system if system else None,
            )
            response = await model.generate_content_async(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0,
                    max_output_tokens=max_tokens,
                ),
            )
            return response.text.strip()
        except Exception as exc:
            print(f"[llm_provider] Gemini text call failed: {exc}")
            return None

    if provider == "openai":
        try:
            from openai import AsyncOpenAI
            api_key = os.getenv("OPENAI_API_KEY", "").strip()
            client = AsyncOpenAI(api_key=api_key)
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            resp = await client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o"),
                temperature=0,
                max_tokens=max_tokens,
                messages=messages,
            )
            return (resp.choices[0].message.content or "").strip()
        except Exception as exc:
            print(f"[llm_provider] OpenAI text call failed: {exc}")
            return None

    return None
