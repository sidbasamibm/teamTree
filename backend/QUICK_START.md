# Quick Start - AI Assistant

## Setup (5 minutes)

### 1. Install Ollama

**Windows:**
- Download: https://ollama.com/download
- Run installer (it starts automatically)

### 2. Pull the Model

Open PowerShell/Terminal:
```bash
ollama pull llama3.2:3b
```

Wait ~2 minutes for download (~2GB).

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
python test_ai.py
```

You should see 5 test queries execute successfully.

## What You Just Built

✅ **Backend Endpoint:** `POST /chat`  
✅ **AI Model:** Llama 3.2 (3B) running locally via Ollama  
✅ **5 Tools:** Top products, top customers, revenue trends, city breakdown, summary stats  
✅ **Safe Queries:** Validated, parameterized SQL with limits  
✅ **Free:** Zero cost, runs on your machine  

## Example API Call

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me top 10 products in Q1 2022"}'
```

**Response:**
```json
{
  "message": "Here are the top 10 products...",
  "data": [...],
  "chart_type": "bar",
  "tool_used": "query_top_products"
}
```

## API Docs

Visit: http://localhost:8000/docs

Click on **"AI Assistant"** → **"/chat"** → **"Try it out"**

## Verify Ollama is Running

```bash
# Should return JSON with models
curl http://localhost:11434/api/tags
```

## Common Issues

### "Connection refused"
→ Ollama not running. On Windows, it should start automatically. If not, run "Ollama" from Start Menu.

### "Model not found"
→ Run: `ollama pull llama3.2:3b`

### Slow first query
→ Normal! Model loads into RAM (~3-4GB). Subsequent queries are fast.

## Files Created

- `backend/ai_assistant.py` - Core AI logic
- `backend/main.py` - Added `/chat` endpoint
- `backend/requirements.txt` - Added `ollama>=0.3.0`
- `backend/AI_SETUP.md` - Detailed documentation
- `backend/test_ai.py` - Test script

## Architecture

```
ChatWidget (React)
    ↓
POST /chat (FastAPI)
    ↓
ai_assistant.py
    ↓
Ollama (localhost:11434)
    ↓
Llama 3.2 (function calling)
    ↓
SQL Queries (validated)
    ↓
Response with data + insights
```

## Next Steps

1. ✅ Backend is ready
2. ⏳ Update frontend ChatWidget to call `/chat`
3. ⏳ Add dynamic chart rendering
4. ⏳ Implement conversation history

The backend is **fully functional** and ready to test!
