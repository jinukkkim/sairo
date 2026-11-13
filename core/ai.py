"""Shared structured provider boundary with safe errors."""

import httpx
from pydantic import BaseModel, ValidationError

DEFAULT_MODEL = "gpt-6-luna"


class TranslationError(Exception):
    """Safe, user-facing failure shared by all AI features."""


def provider_schema(value):
    """Use strict Structured Outputs; keep business constraints validated locally."""
    unsupported = {"minLength", "maxLength", "minItems", "maxItems", "pattern",
                   "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf", "default"}
    if isinstance(value, dict):
        schema = {}
        for key, item in value.items():
            if key in unsupported:
                continue
            if key in {"properties", "$defs"}:
                schema[key] = {name: provider_schema(child) for name, child in item.items()}
            else:
                schema[key] = provider_schema(item)
        if schema.get("type") == "object":
            if schema.get("additionalProperties") not in (None, False):
                raise TranslationError("The response schema contains a free-form object. Use explicit response fields instead.")
            schema["required"] = list(schema.setdefault("properties", {}))
            schema["additionalProperties"] = False
        return schema
    if isinstance(value, list):
        return [provider_schema(item) for item in value]
    return value


async def generate(result_type: type[BaseModel], system: str, user: str, *,
                   api_key: str, client: httpx.AsyncClient, model: str):
    if not api_key.strip():
        raise TranslationError("Add OPENAI_API_KEY to .env and restart the server to run AI features.")
    try:
        response = await client.post(
            "https://api.openai.com/v1/responses",
            headers={"Authorization": f"Bearer {api_key.strip()}"},
            json={"model": model, "max_output_tokens": 6000, "instructions": system,
                  "input": [{"role": "user", "content": user}],
                  "store": False, "reasoning": {"effort": "low"},
                  "text": {"format": {"type": "json_schema", "name": result_type.__name__,
                                      "strict": True, "schema": provider_schema(result_type.model_json_schema())}}},
            timeout=60,
        )
        response.raise_for_status()
    except httpx.TimeoutException as exc:
        raise TranslationError("AI request timed out. Please try again.") from exc
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in (401, 403):
            message = "AI access was denied. Check the API key and model access, then restart."
        elif exc.response.status_code == 429:
            message = "The AI service is busy or out of credits. Check your account and try again."
        elif exc.response.status_code == 404:
            message = "The AI model is unavailable. Check the model argument and model access."
        else:
            message = "The AI service could not complete this request. Please try again."
        raise TranslationError(message) from exc
    except httpx.RequestError as exc:
        raise TranslationError("Cannot reach the AI service. Check your connection and try again.") from exc
    try:
        payload = response.json()
        if payload["status"] != "completed":
            raise ValueError("Incomplete generation")
        messages = [item for item in payload["output"] if item["type"] != "reasoning"]
        if len(messages) != 1 or messages[0]["type"] != "message" or messages[0]["role"] != "assistant" or messages[0]["status"] != "completed":
            raise ValueError("Expected one completed assistant message")
        content = messages[0]["content"]
        if len(content) != 1 or content[0]["type"] != "output_text":
            raise ValueError("Expected one JSON text block")
        return result_type.model_validate_json(content[0]["text"])
    except (ValueError, KeyError, TypeError, ValidationError) as exc:
        raise TranslationError("The AI service returned an invalid response. Please try again.") from exc
