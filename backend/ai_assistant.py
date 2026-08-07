"""
ai_assistant.py — AI-powered analytics assistant using IBM Consulting Advantage (ICA)

Answers natural-language questions by calling an ICA chat model grounded in a
pre-configured ICA Document Collection (retrieval-augmented generation), rather
than local function/tool calling against the SQL database.
"""

import os
from typing import Any, Dict, List, Optional

import requests

ICA_BASE_URL = os.getenv("ICA_BASE_URL", "https://api.nextgen-beta.ica.ibm.com/ica/v1")
ICA_API_KEY = os.getenv("ICA_API_KEY")
ICA_MODEL = os.getenv("ICA_MODEL")
ICA_COLLECTION_ID = os.getenv("ICA_COLLECTION_ID")
ICA_NAMESPACE = os.getenv("ICA_NAMESPACE", "chat-models")

SYSTEM_PROMPT = """You are a data analyst assistant for the NovaCart e-commerce dashboard.

Answer the user's question using only the information available in the connected
document collection. If the answer isn't covered by the documents, say so clearly
instead of guessing. Keep answers concise and focused on actionable insights."""


def _extract_source_names(raw_sources: Optional[List[Dict]]) -> Optional[List[str]]:
    """Flatten ICA's rich source-citation objects down to unique document names."""
    names: List[str] = []
    for entry in raw_sources or []:
        for meta in entry.get("metadata") or []:
            name = meta.get("name")
            if name and name not in names:
                names.append(name)
    return names or None


async def process_query(user_message: str, conversation_history: Optional[List[Dict]] = None) -> Dict[str, Any]:
    """
    Process a natural-language query using ICA, grounded in the configured
    Document Collection.

    Args:
        user_message: User's natural language query
        conversation_history: Previous conversation messages

    Returns:
        Dictionary with response message, cited sources, and updated conversation
    """
    messages = conversation_history or []

    if not messages:
        messages.append({"role": "system", "content": SYSTEM_PROMPT})

    messages.append({"role": "user", "content": user_message})

    if not ICA_API_KEY or not ICA_COLLECTION_ID:
        return {
            "message": (
                "The AI assistant isn't configured yet. Set ICA_API_KEY and "
                "ICA_COLLECTION_ID in backend/.env — see backend/AI_SETUP.md."
            ),
            "sources": None,
            "conversation": messages,
            "error": "missing_ica_config",
        }

    payload = {
        "model": ICA_MODEL,
        "messages": messages,
        "files": [{"type": "collection", "id": ICA_COLLECTION_ID}],
    }

    try:
        response = requests.post(
            f"{ICA_BASE_URL}/{ICA_NAMESPACE}/chat/completions",
            headers={
                "Authorization": f"Bearer {ICA_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=180,
        )
        response.raise_for_status()
        body = response.json()

    except requests.exceptions.HTTPError as e:
        status = e.response.status_code if e.response is not None else None
        if status in (401, 403):
            error_msg = (
                "ICA rejected the request — check that ICA_API_KEY is valid and "
                "has access to this model and document collection."
            )
        else:
            error_msg = f"ICA API error ({status}): {e}"

        return {
            "message": f"Sorry, I encountered an error: {error_msg}",
            "sources": None,
            "conversation": messages,
            "error": error_msg,
        }

    except requests.exceptions.RequestException as e:
        error_msg = f"Could not reach the ICA API: {e}"
        return {
            "message": f"Sorry, I encountered an error: {error_msg}",
            "sources": None,
            "conversation": messages,
            "error": error_msg,
        }

    choice = (body.get("choices") or [{}])[0]
    answer = choice.get("message", {}).get("content") or "I apologize, but I could not process that request."
    sources = _extract_source_names(body.get("sources"))

    messages.append({"role": "assistant", "content": answer})

    return {
        "message": answer,
        "sources": sources,
        "conversation": messages,
    }
