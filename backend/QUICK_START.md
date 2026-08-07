# Quick Start - AI Assistant

## Setup (5 minutes)

### 1. Get ICA credentials

- Generate a developer API key in the ICA UI: **Settings → API Keys → ICA APIs**.
- Find the ID of your existing Document Collection: `GET /document-collections`
  (see `backend/AI_SETUP.md` for the full curl example).
- Note which model ID you want to use (check the ICA UI for what's available).

### 2. Configure environment variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```
ICA_API_KEY=your_ica_api_key
ICA_MODEL=your_model_id
ICA_COLLECTION_ID=your_collection_id
```

### 3. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Start Backend

```bash
python -m uvicorn main:app --reload --port 8000
```

### 5. Test It

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What does our return policy say about damaged items?"}'
```

Or open http://localhost:8000/docs, click **"AI Assistant" → "/chat" → "Try it out"**.

## What You Just Built

✅ **Backend Endpoint:** `POST /chat`
✅ **Grounded Answers:** Responses backed by your ICA Document Collection (RAG)
✅ **Source Citations:** Each answer includes the documents ICA cited
✅ **No Local Model:** Runs against IBM Consulting Advantage, not a local LLM

## Example API Call

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me what we know about Q1 2022 sales"}'
```

**Response:**
```json
{
  "message": "Based on the connected documents, Q1 2022 sales were...",
  "sources": ["sales_notes.docx"],
  "conversation": [...]
}
```

## API Docs

Visit: http://localhost:8000/docs

Click on **"AI Assistant"** → **"/chat"** → **"Try it out"**

## Common Issues

### "The AI assistant isn't configured yet"
→ `ICA_API_KEY` or `ICA_COLLECTION_ID` is missing from `backend/.env`. Fill both in and restart the backend.

### "ICA rejected the request" (401/403)
→ `ICA_API_KEY` is invalid, expired, or lacks access to the model/collection. Regenerate it in the ICA UI.

### Answers don't mention what you expect
→ Confirm the collection's files show `"status": "completed"` via `GET /document-collections/{id}` — pending files aren't searchable yet.

## Files Changed

- `backend/ai_assistant.py` - Core AI logic, now calling ICA instead of Ollama
- `backend/main.py` - `/chat` endpoint (response shape updated: `sources` instead of `data`/`chart_type`/`tool_used`)
- `backend/requirements.txt` - Uses `requests` instead of `ollama`
- `backend/AI_SETUP.md` - Detailed documentation

## Architecture

```
ChatWidget (React)
    ↓
POST /chat (FastAPI)
    ↓
ai_assistant.py
    ↓
HTTPS to ICA chat-models/chat/completions
(files: [{"type": "collection", "id": ICA_COLLECTION_ID}])
    ↓
ICA retrieves relevant document chunks (RAG)
    ↓
Response with answer + cited sources
```

## Next Steps

1. ✅ Backend is ready
2. ✅ Frontend ChatWidget calls `/chat` and renders source citations
3. ⏳ Implement conversation history persistence across page reloads

The backend is **fully functional** once `.env` has valid ICA credentials!
