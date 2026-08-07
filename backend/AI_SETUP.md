# AI Assistant Setup Guide

## Overview

The NovaCart dashboard includes an AI-powered analytics assistant that answers
natural-language questions using IBM Consulting Advantage (ICA). Instead of
running a model locally, the backend calls ICA's chat-completions API and
references an existing ICA **Document Collection**, so ICA performs
retrieval-augmented generation (RAG) server-side and returns an answer grounded
in your documents, plus the sources it cited.

## Prerequisites

### 1. An ICA account with a Document Collection already set up

This integration assumes you already have a Document Collection configured on
your ICA account (created via the ICA UI or the Document Collections API). If
you don't have one yet, create it in the ICA UI first and upload/attach the
files you want the assistant to answer from.

### 2. Get a developer API key

In the ICA UI: **Settings → API Keys → ICA APIs**. Generate a key and keep it
somewhere safe — it goes into `backend/.env` as `ICA_API_KEY`.

### 3. Find your Document Collection ID

```bash
curl -H "Authorization: Bearer $ICA_API_KEY" \
  https://api.nextgen-beta.ica.ibm.com/ica/v1/document-collections
```

Find your collection in the response and copy its `id`. Confirm every file in
it shows `"status": "completed"` (not `"pending"`) — files are processed
asynchronously after upload, and referencing a collection with unprocessed
files can produce incomplete answers.

### 4. Pick a model

Check the ICA UI for the model identifiers available on your account, and use
one that supports the `chat-models` namespace.

## Backend Setup

### 1. Configure environment variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```
ICA_BASE_URL=https://api.nextgen-beta.ica.ibm.com/ica/v1
ICA_API_KEY=your_ica_api_key
ICA_MODEL=your_model_id
ICA_COLLECTION_ID=your_collection_id
ICA_NAMESPACE=chat-models
```

### 2. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs `requests`, used to call the ICA REST API.

### 3. Start the Backend

```bash
python -m uvicorn main:app --reload --port 8000
```

The backend will now have a `/chat` endpoint at `http://localhost:8000/chat`.

## API Documentation

### Endpoint: POST /chat

**URL:** `http://localhost:8000/chat`

**Request Body:**
```json
{
  "message": "What were our best-selling products last quarter?",
  "conversation": []  // Optional: previous conversation history
}
```

**Response:**
```json
{
  "message": "Based on the connected documents, the best-selling products last quarter were...",
  "sources": ["catalog_2022.pdf", "sales_notes.docx"],
  "conversation": [...]  // Updated conversation history
}
```

If something goes wrong, the response comes back as a normal 200 with `error`
populated instead of an HTTP error status, so the chat UI can show a friendly
message:

```json
{
  "message": "Sorry, I encountered an error: ICA rejected the request — check that ICA_API_KEY is valid...",
  "sources": null,
  "conversation": [...],
  "error": "ICA rejected the request — check that ICA_API_KEY is valid..."
}
```

## Example Queries

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What does our return policy say about damaged items?"}'

curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Summarize the key points from last quarter'\''s sales report."}'
```

## Troubleshooting

### Error: "ICA rejected the request" (401/403)

**Solution:** Double-check `ICA_API_KEY` in `backend/.env` — it may be missing,
expired, or lack access to the configured model/collection. Regenerate it from
the ICA UI if needed.

### Error: "The AI assistant isn't configured yet"

**Solution:** `ICA_API_KEY` or `ICA_COLLECTION_ID` is unset in `backend/.env`.
Fill in both (see Backend Setup above) and restart the backend.

### Answers don't reference the documents you expect

**Solution:**
- Confirm `ICA_COLLECTION_ID` points at the collection containing those files.
- Confirm the files show `"status": "completed"` via `GET /document-collections/{id}`
  — files still `"pending"` won't be searchable yet.
- Try rephrasing the question closer to the document's own wording.

### Slow responses

RAG queries involve a retrieval step over the collection before the model
generates an answer, so responses may take longer than a plain chat completion.
This is expected and happens on ICA's side.

## Architecture

```
Frontend (React) → POST /chat → FastAPI Backend
                                     ↓
                              ai_assistant.py
                                     ↓
                    HTTPS request to ICA chat-models/chat/completions
                    (with files: [{"type": "collection", "id": ...}])
                                     ↓
                    ICA retrieves relevant document chunks (RAG)
                                     ↓
                    Response with answer + cited sources
```

## Security Notes

- Unlike the previous local-Ollama setup, questions and document content are
  now sent to IBM Consulting Advantage over HTTPS — data leaves your machine.
- Keep `ICA_API_KEY` out of version control; it's read from `backend/.env`,
  which is gitignored.
- The assistant only has access to whatever the configured Document Collection
  contains — scope that collection to what you're comfortable exposing to the chat UI.

## Next Steps

Once the backend is working:
1. Verify the frontend `ChatWidget` renders the `sources` citations correctly.
2. Consider adding a UI affordance to preview/download a cited source document.
3. Implement conversation history persistence if you want chats to survive a page reload.
