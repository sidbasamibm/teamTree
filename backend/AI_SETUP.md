# AI Assistant Setup Guide

## Overview

The NovaCart dashboard now includes an AI-powered analytics assistant that converts natural language queries into structured database queries using Ollama with Llama 3.2.

## Prerequisites

### 1. Install Ollama

**Windows:**
1. Download from: https://ollama.com/download
2. Run the installer
3. Ollama will start automatically as a Windows service

**Mac:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Pull the Model

```bash
# Pull the 3B model (good balance of speed and quality)
ollama pull llama3.2:3b

# This downloads ~2GB and takes 2-3 minutes
```

### 3. Verify Ollama is Running

```bash
# Check that Ollama is accessible
curl http://localhost:11434/api/tags

# Should return JSON with available models
```

## Backend Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- `ollama>=0.3.0` - Python client for Ollama

### 2. Start the Backend

```bash
python -m uvicorn main:app --reload --port 8000
```

The backend will now have a `/chat` endpoint at `http://localhost:8000/chat`

## API Documentation

### Endpoint: POST /chat

**URL:** `http://localhost:8000/chat`

**Request Body:**
```json
{
  "message": "Show me top 10 products in 2022",
  "conversation": []  // Optional: previous conversation history
}
```

**Response:**
```json
{
  "message": "Here are the top 10 products by revenue in 2022...",
  "data": [
    {
      "product_id": "P001",
      "name": "Wireless Headphones",
      "category": "Electronics",
      "units_sold": 342,
      "revenue": 30578.58
    }
    // ... more products
  ],
  "chart_type": "bar",  // Suggested visualization
  "conversation": [...],  // Updated conversation history
  "tool_used": "query_top_products"
}
```

## Available Tools

The AI assistant can use these tools to query data:

1. **query_top_products** - Get top N products by revenue
   - Filters: date range, city, state
   - Example: "Show top products in Texas"

2. **query_top_customers** - Get top customers by spending
   - Filters: date range, city, state
   - Example: "Who are the top customers in Austin?"

3. **query_revenue_trend** - Get revenue trends over time
   - Granularity: monthly or quarterly
   - Filters: date range, city, state
   - Example: "Show quarterly revenue trends"

4. **query_city_breakdown** - Get revenue by city and state
   - Filters: date range, limit
   - Example: "Revenue breakdown by city"

5. **query_summary_stats** - Get summary statistics
   - Filters: date range, city, state
   - Example: "Summary stats for Q1 2022"

## Example Queries

```bash
# Using curl
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me top 10 products in 2022"}'

curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What were the revenue trends by quarter in Texas?"}'

curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Who are the top 5 customers in Austin?"}'

curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Give me monthly revenue for Q1 2022"}'
```

## Testing the Integration

### Quick Test Script

Create `test_ai.py` in the backend directory:

```python
import requests
import json

def test_chat(message):
    response = requests.post(
        'http://localhost:8000/chat',
        json={'message': message}
    )
    result = response.json()
    
    print(f"\n{'='*60}")
    print(f"Query: {message}")
    print(f"{'='*60}")
    print(f"Response: {result['message']}")
    print(f"Chart Type: {result.get('chart_type')}")
    print(f"Tool Used: {result.get('tool_used')}")
    
    if result.get('data'):
        print(f"Data rows: {len(result['data']) if isinstance(result['data'], list) else 'N/A'}")
    
    if result.get('error'):
        print(f"ERROR: {result['error']}")

# Test queries
test_chat("Show me top 5 products in 2022")
test_chat("What were the revenue trends by quarter?")
test_chat("Who are the top 3 customers in Texas?")
test_chat("Give me summary stats for Q1 2022")
```

Run with:
```bash
python test_ai.py
```

## Troubleshooting

### Error: "Connection refused" or "Ollama is not running"

**Solution:** Start Ollama service
```bash
# Windows: Should start automatically, but if not:
# Run Ollama from Start Menu

# Mac/Linux:
ollama serve
```

### Error: "Model not found"

**Solution:** Pull the model
```bash
ollama pull llama3.2:3b
```

### Slow responses

**Solution:** 
- First query loads the model into memory (~3-4GB RAM)
- Subsequent queries are faster
- Model stays loaded for ~5 minutes after last use
- Consider upgrading to a machine with more RAM if consistently slow

### Wrong results or hallucinations

**Solution:**
- The model is small (3B parameters) for speed
- For better quality, use a larger model:
  ```bash
  ollama pull llama3.2:7b
  # or
  ollama pull mistral
  ```
  Then update `ai_assistant.py` line 182 and 229:
  ```python
  model='llama3.2:7b'  # Instead of llama3.2:3b
  ```

## Model Options

| Model | Size | RAM Needed | Quality | Speed |
|-------|------|------------|---------|-------|
| llama3.2:3b (default) | 2GB | 4-6GB | Good | Fast |
| llama3.2:7b | 4GB | 8-10GB | Better | Medium |
| mistral:7b | 4GB | 8-10GB | Better | Medium |

## Architecture

```
Frontend (React) → POST /chat → FastAPI Backend
                                     ↓
                              ai_assistant.py
                                     ↓
                              HTTP request to Ollama (localhost:11434)
                                     ↓
                              Llama 3.2 (function calling)
                                     ↓
                              Tool execution (SQL queries)
                                     ↓
                              Response with data + insights
```

## Security Notes

- Ollama runs locally, no external API calls
- All data stays on your machine
- SQL queries are validated and parameterized
- Date ranges limited to 2 years max
- Result limits capped at 50 rows per query

## Next Steps

Once the backend is working:
1. Update frontend ChatWidget to call `/chat` endpoint
2. Add dynamic chart rendering based on `chart_type`
3. Implement conversation history persistence
4. Add loading states and error handling
