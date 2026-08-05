# Frontend AI Integration - Testing Guide

## Setup Complete! ✅

The frontend ChatWidget has been updated to integrate with the AI backend.

## What Was Changed

### New Files:
1. **`frontend/src/components/DynamicChart.js`**
   - Renders charts dynamically based on AI responses
   - Supports: bar, line, stats, and table visualizations
   - Auto-detects data keys and formats appropriately

### Modified Files:
1. **`frontend/src/components/ChatWidget.js`**
   - Now calls `POST /chat` endpoint
   - Conversation history management
   - Loading states
   - Dynamic chart rendering
   - Error handling

## How to Test

### 1. Start Backend (Terminal 1)

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

**Requirements:**
- Ollama must be running (Windows: should auto-start)
- Model must be pulled: `ollama pull llama3.2:3b`

### 2. Start Frontend (Terminal 2)

```bash
cd frontend
npm start
```

Frontend will open at `http://localhost:3000`

### 3. Test the Chat

Click the chat button in the bottom-right corner (blue with Q&A icon).

**Try these queries:**

#### Query 1: Top Products
```
Show me top 10 products in 2022
```
- Should return a **bar chart** with products
- Auto-expands to show chart

#### Query 2: Revenue Trends
```
What were the revenue trends by quarter in 2022?
```
- Should return a **line chart** showing quarterly trends

#### Query 3: Location Filter
```
Who are the top 5 customers in Texas?
```
- Should return a **bar chart** or **table** with Texas customers

#### Query 4: Summary Stats
```
Give me summary stats for Q1 2022
```
- Should show **stat cards** with Revenue, Orders, Customers

#### Query 5: City Breakdown
```
Show me revenue breakdown by top 5 cities
```
- Should return a **bar chart** with cities

## Expected Behavior

### ✅ Working Correctly:

1. **User types query** → Message appears on right (teal bubble)
2. **Loading indicator** → "Thinking..." appears on left
3. **AI response** → Text response appears on left (white/dark bubble)
4. **Chart renders** → Chart appears below the text
5. **Widget expands** → Automatically expands to show chart
6. **Conversation continues** → Can ask follow-up questions

### ❌ Common Issues:

#### "Connection refused" or "Network error"
**Cause:** Backend not running  
**Fix:** Start backend with `python -m uvicorn main:app --reload --port 8000`

#### "Ollama is not running"
**Cause:** Ollama service not started  
**Fix:** On Windows, Ollama should auto-start. If not, run "Ollama" from Start Menu

#### Response takes 10-30 seconds on first query
**Cause:** Model loading into memory  
**Fix:** This is normal! Subsequent queries are much faster

#### AI gives generic response instead of data
**Cause:** Model didn't use function calling  
**Fix:** Try rephrasing with specific dates/locations. The 3B model is small and may occasionally miss function calls.

## UI Features

### Chat Widget States:

1. **Closed** - Blue button in bottom-right
2. **Normal** - Small chat box (320px wide)
3. **Expanded** - Large chat box (600px wide, centered)
   - Auto-expands when AI returns chart data
   - Click minimize icon to shrink back
   - Click backdrop (dark overlay) to minimize

### Visual Indicators:

- **User messages** - Right-aligned, teal background
- **AI messages** - Left-aligned, white/dark background
- **Loading** - "Thinking..." with animated dots
- **Error** - Red warning indicator below message
- **Charts** - Rendered inline with Recharts

### Chart Types:

1. **Bar Chart** - For rankings (top products, top customers, cities)
2. **Line Chart** - For trends over time (revenue trends)
3. **Stats Cards** - For summary statistics (revenue, orders, customers)
4. **Table** - Fallback for any data that doesn't match above types

## Example Conversation Flow

```
You: Show me top 5 products in 2022
AI: Here are the top 5 products by revenue in 2022...
[BAR CHART appears showing products]

You: What about just Texas?
AI: Here are the top products in Texas...
[BAR CHART updates with Texas data]

You: Give me the revenue trend by quarter
AI: Here's the quarterly revenue trend for 2022...
[LINE CHART appears showing Q1-Q4]
```

## Architecture

```
User types in ChatWidget
    ↓
POST http://localhost:8000/chat
    {
      "message": "Show top products",
      "conversation": [...]
    }
    ↓
Backend AI (ai_assistant.py)
    ↓
Ollama (llama3.2:3b)
    ↓
Function calling → SQL query
    ↓
Response
    {
      "message": "Here are the top products...",
      "data": [...],
      "chart_type": "bar",
      "conversation": [...]
    }
    ↓
DynamicChart renders the chart
    ↓
User sees result!
```

## Troubleshooting

### No response from AI

1. Check backend console for errors
2. Verify Ollama is running: `curl http://localhost:11434/api/tags`
3. Check browser console (F12) for fetch errors

### Chart not rendering

1. Check if `data` and `chart_type` are in response (browser console)
2. Verify DynamicChart component imported correctly
3. Look for JavaScript errors in browser console

### Conversation history not working

- This is stored in component state
- Refreshing page resets conversation
- Consider adding localStorage persistence later

## Next Steps

Once basic testing works:

1. **Add example queries** - Add helper text suggesting queries
2. **Persist conversation** - Save to localStorage across page refreshes
3. **Add feedback buttons** - 👍 / 👎 on AI responses
4. **Improve error messages** - More user-friendly error text
5. **Add export button** - Download chart data as CSV
6. **Voice input** - Add microphone button for voice queries

## Performance Notes

- **First query**: 10-30 seconds (model loads into RAM)
- **Subsequent queries**: 2-5 seconds
- **Model size in RAM**: ~3-4GB
- **Frontend bundle**: DynamicChart adds ~5KB
- **API latency**: 1-3 seconds (local)

## Success Criteria

✅ Chat button appears in bottom-right  
✅ Click opens chat widget  
✅ Type query and press Enter  
✅ "Thinking..." appears  
✅ AI responds with text  
✅ Chart renders (for appropriate queries)  
✅ Widget expands to show chart  
✅ Can ask follow-up questions  
✅ Conversation context maintained  

**If all above work, the integration is successful!** 🎉
