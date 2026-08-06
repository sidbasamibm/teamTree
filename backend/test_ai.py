"""
test_ai.py — Test script for AI assistant endpoint

Run this after starting the backend to verify the AI assistant is working.

Usage:
    python test_ai.py
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_chat(message, conversation=None):
    """Send a chat message and display the response."""
    try:
        response = requests.post(
            f'{BASE_URL}/chat',
            json={
                'message': message,
                'conversation': conversation
            },
            timeout=30
        )
        response.raise_for_status()
        result = response.json()

        print(f"\n{'='*70}")
        print(f"Query: {message}")
        print(f"{'='*70}")
        print(f"\nAssistant: {result['message']}\n")

        if result.get('tool_used'):
            print(f"Tool Used: {result['tool_used']}")

        if result.get('chart_type'):
            print(f"Chart Type: {result['chart_type']}")

        if result.get('data'):
            if isinstance(result['data'], list):
                print(f"Data Rows: {len(result['data'])}")
                if len(result['data']) > 0:
                    print(f"First Row: {json.dumps(result['data'][0], indent=2)}")
            else:
                print(f"Data: {json.dumps(result['data'], indent=2)}")

        if result.get('error'):
            print(f"\n⚠️  ERROR: {result['error']}")

        return result

    except requests.exceptions.ConnectionError:
        print(f"\n❌ ERROR: Could not connect to {BASE_URL}")
        print("Make sure the FastAPI backend is running:")
        print("  cd backend")
        print("  python -m uvicorn main:app --reload --port 8000")
        sys.exit(1)
    except requests.exceptions.Timeout:
        print(f"\n❌ ERROR: Request timed out")
        print("The AI model might be loading for the first time (takes ~10-30 seconds)")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        sys.exit(1)


def main():
    print("\n" + "="*70)
    print("AI Assistant Test Suite")
    print("="*70)
    print("\nTesting connection to backend...")

    # Test health endpoint first
    try:
        response = requests.get(f'{BASE_URL}/health', timeout=5)
        if response.status_code == 200:
            print("✓ Backend is running")
        else:
            print("✗ Backend health check failed")
            sys.exit(1)
    except:
        print("✗ Backend is not running")
        print("\nPlease start the backend first:")
        print("  cd backend")
        print("  python -m uvicorn main:app --reload --port 8000")
        sys.exit(1)

    print("\n" + "="*70)
    print("Test 1: Top Products Query")
    print("="*70)
    result1 = test_chat("Show me top 5 products in 2022")

    print("\n" + "="*70)
    print("Test 2: Revenue Trend Query")
    print("="*70)
    result2 = test_chat("What were the revenue trends by quarter in 2022?")

    print("\n" + "="*70)
    print("Test 3: Customer Query with Location Filter")
    print("="*70)
    result3 = test_chat("Who are the top 3 customers in Texas?")

    print("\n" + "="*70)
    print("Test 4: Summary Statistics")
    print("="*70)
    result4 = test_chat("Give me summary stats for Q1 2022")

    print("\n" + "="*70)
    print("Test 5: City Breakdown")
    print("="*70)
    result5 = test_chat("Show me revenue breakdown by top 5 cities")

    print("\n" + "="*70)
    print("All tests completed!")
    print("="*70)
    print("\nIf all tests passed, the AI assistant backend is working correctly.")
    print("\nNext steps:")
    print("1. Check that Ollama is running: http://localhost:11434")
    print("2. Verify the model is loaded: ollama list")
    print("3. Integrate with frontend ChatWidget")


if __name__ == "__main__":
    main()
