# TinyLlama Setup - Quick Reference

## What Changed

The AI assistant now uses **TinyLlama** instead of Llama 3.2 (3B).

### Why TinyLlama?

✅ **Much smaller** - 637MB vs 2GB download  
✅ **Less RAM** - ~1-2GB vs ~3-4GB in memory  
✅ **Faster loading** - 5-15 seconds vs 10-30 seconds first query  
✅ **Faster inference** - 1-3 seconds vs 2-5 seconds per query  
✅ **Lower requirements** - Works on machines with 4GB RAM  

### Trade-offs

⚠️ **Lower quality** - 1.1B parameters vs 3B  
⚠️ **May miss function calls** - Smaller model, less reliable tool use  
⚠️ **Simpler responses** - Less detailed explanations  

## Setup (2 minutes)

### 1. Pull TinyLlama

```bash
ollama pull tinyllama
```

Downloads ~637MB (very fast!)

### 2. Verify It's Ready

```bash
ollama list
```

Should show:
```
NAME            ID              SIZE      MODIFIED
tinyllama       bcecbd369eed    637 MB    Just now
```

### 3. That's It!

The backend is already configured to use TinyLlama. Just start it:

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

## Testing

Try these queries:

```bash
# Should work well
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me top 10 products in 2022"}'

# Should work well
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What were the revenue trends by quarter?"}'

# May need rephrasing if it doesn't use function calling
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about top customers"}'
```

## If TinyLlama Doesn't Work Well

Upgrade to a larger model:

```bash
# Download larger model (2GB)
ollama pull llama3.2:3b
```

Then update `backend/ai_assistant.py` lines 182 and 229:

```python
# Change from:
model='tinyllama',

# To:
model='llama3.2:3b',
```

Restart backend and test again.

## Model Comparison

| Model | Download | RAM | First Query | Query Speed | Quality |
|-------|----------|-----|-------------|-------------|---------|
| **tinyllama** | 637MB | 1-2GB | 5-15s | 1-3s | Basic |
| llama3.2:3b | 2GB | 3-4GB | 10-30s | 2-5s | Good |
| llama3.2:7b | 4GB | 6-8GB | 20-40s | 3-7s | Better |
| mistral:7b | 4GB | 6-8GB | 20-40s | 3-7s | Better |

## Expected Performance

### With TinyLlama:

- ✅ **Fast** - Very responsive, great for demos
- ✅ **Lightweight** - Works on older machines
- ⚠️ **80-90% accuracy** - Most queries work, some need rephrasing
- ⚠️ **Simpler explanations** - Less detailed responses

### Tips for Best Results:

1. **Be specific with dates**
   - Good: "Show top products in 2022"
   - Bad: "Show top products"

2. **Use explicit filters**
   - Good: "Top 5 customers in Texas"
   - Bad: "Good customers in the south"

3. **Keep queries simple**
   - Good: "Revenue trends by quarter"
   - Bad: "Compare revenue trends across quarters with year-over-year growth analysis"

4. **If it doesn't work, rephrase**
   - TinyLlama is small, so slight rephrasing often helps

## Files Modified

- `backend/ai_assistant.py` - Line 182, 229: Changed to `model='tinyllama'`
- `backend/main.py` - Line 672: Updated documentation
- `backend/AI_SETUP.md` - Updated model references
- `backend/QUICK_START.md` - Updated model references
- `FRONTEND_AI_TESTING.md` - Updated performance notes

## Switching Back

To switch back to Llama 3.2:

1. Pull the model: `ollama pull llama3.2:3b`
2. Edit `backend/ai_assistant.py`:
   - Line 182: `model='llama3.2:3b',`
   - Line 229: `model='llama3.2:3b',`
3. Restart backend

## Current Status

✅ Backend configured for TinyLlama  
✅ All documentation updated  
✅ Ready to test  

**Next step:** Pull TinyLlama and test it!

```bash
ollama pull tinyllama
```
