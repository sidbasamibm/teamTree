"""
ai_assistant.py — AI-powered analytics assistant using Ollama

Converts natural language queries into structured database queries
using function calling with a local Ollama model.
"""

import ollama
from typing import Dict, Any, List, Optional
import json
from datetime import datetime

from connection import get_connection, execute_query

# Tool definitions for function calling
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "query_top_products",
            "description": "Get top N products by revenue for a date range, optionally filtered by city, state, or category",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {
                        "type": "string",
                        "description": "Start date in YYYY-MM-DD format"
                    },
                    "end_date": {
                        "type": "string",
                        "description": "End date in YYYY-MM-DD format"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of products to return (max 50)",
                        "default": 10
                    },
                    "city": {
                        "type": "string",
                        "description": "Optional: Filter by customer city"
                    },
                    "state": {
                        "type": "string",
                        "description": "Optional: Filter by customer state"
                    }
                },
                "required": ["start_date", "end_date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_top_customers",
            "description": "Get top customers by spending, optionally filtered by location",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {
                        "type": "string",
                        "description": "Start date in YYYY-MM-DD format"
                    },
                    "end_date": {
                        "type": "string",
                        "description": "End date in YYYY-MM-DD format"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of customers to return (max 50)",
                        "default": 20
                    },
                    "city": {
                        "type": "string",
                        "description": "Optional: Filter by city"
                    },
                    "state": {
                        "type": "string",
                        "description": "Optional: Filter by state"
                    }
                },
                "required": ["start_date", "end_date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_revenue_trend",
            "description": "Get revenue trends over time with specified granularity (monthly or quarterly)",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {
                        "type": "string",
                        "description": "Start date in YYYY-MM-DD format"
                    },
                    "end_date": {
                        "type": "string",
                        "description": "End date in YYYY-MM-DD format"
                    },
                    "granularity": {
                        "type": "string",
                        "enum": ["monthly", "quarterly"],
                        "description": "Time period granularity",
                        "default": "monthly"
                    },
                    "city": {
                        "type": "string",
                        "description": "Optional: Filter by city"
                    },
                    "state": {
                        "type": "string",
                        "description": "Optional: Filter by state"
                    }
                },
                "required": ["start_date", "end_date", "granularity"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_city_breakdown",
            "description": "Get revenue breakdown by city and state",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {
                        "type": "string",
                        "description": "Start date in YYYY-MM-DD format"
                    },
                    "end_date": {
                        "type": "string",
                        "description": "End date in YYYY-MM-DD format"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of cities to return (max 50)",
                        "default": 10
                    }
                },
                "required": ["start_date", "end_date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_summary_stats",
            "description": "Get summary statistics (total revenue, orders, customers) for a date range",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {
                        "type": "string",
                        "description": "Start date in YYYY-MM-DD format"
                    },
                    "end_date": {
                        "type": "string",
                        "description": "End date in YYYY-MM-DD format"
                    },
                    "city": {
                        "type": "string",
                        "description": "Optional: Filter by city"
                    },
                    "state": {
                        "type": "string",
                        "description": "Optional: Filter by state"
                    }
                },
                "required": ["start_date", "end_date"]
            }
        }
    }
]

SYSTEM_PROMPT = """You are a data analyst assistant for the NovaCart e-commerce dashboard.

Available data:
- Orders: order_id, customer_id, product_id, order_date, amount, status, quantity
- Customers: customer_id, name, email, city, state
- Products: product_id, name, category, price
- Date dimension: year, quarter, month, day_of_week

Date range for available data: 2022-01-01 to 2022-12-31

CRITICAL RULES:
1. ALWAYS provide start_date and end_date when calling tools - these are REQUIRED
2. If user doesn't specify dates, use the FULL YEAR: start_date="2022-01-01", end_date="2022-12-31"
3. If user mentions a specific year (like "2022"), use the full year range
4. NEVER call a tool without both start_date and end_date

When users ask questions:
1. Determine which tool(s) to use based on their query
2. Calculate appropriate date ranges (NEVER omit dates!)
3. After getting results, provide a concise, insightful summary
4. Focus on actionable insights

Date conversions:
- "in 2022" or "for 2022" → start_date="2022-01-01", end_date="2022-12-31"
- "Q1 2022" → start_date="2022-01-01", end_date="2022-03-31"
- "Q2 2022" → start_date="2022-04-01", end_date="2022-06-30"
- "Q3 2022" → start_date="2022-07-01", end_date="2022-09-30"
- "Q4 2022" → start_date="2022-10-01", end_date="2022-12-31"
- "first half" → start_date="2022-01-01", end_date="2022-06-30"
- "second half" → start_date="2022-07-01", end_date="2022-12-31"

Important:
- Only delivered and shipped orders are included in metrics
- Use YYYY-MM-DD format for dates
- NEVER forget to include dates when calling tools"""


async def process_query(user_message: str, conversation_history: Optional[List[Dict]] = None) -> Dict[str, Any]:
    """
    Process natural language query using Ollama with function calling.

    Args:
        user_message: User's natural language query
        conversation_history: Previous conversation messages

    Returns:
        Dictionary with response message, data, chart type, and updated conversation
    """
    messages = conversation_history or []

    # Add system prompt if this is the first message
    if not messages:
        messages.append({"role": "system", "content": SYSTEM_PROMPT})

    messages.append({"role": "user", "content": user_message})

    try:
        # Call Ollama with tools
        response = ollama.chat(
            model='llama3.2:3b',  # Small, fast model with function calling support
            messages=messages,
            tools=TOOLS,
            options={
                "temperature": 0.1,  # Low temperature for consistent tool use
            }
        )

        # Check if model wants to use a tool
        message = response.get('message', {})

        if message.get('tool_calls'):
            tool_calls = message['tool_calls']

            # Execute first tool (handle multiple tools if needed)
            tool_call = tool_calls[0]
            tool_name = tool_call['function']['name']
            tool_args = tool_call['function']['arguments']

            # Execute the tool
            tool_result = execute_tool(tool_name, tool_args)

            # Check for errors
            if isinstance(tool_result, dict) and 'error' in tool_result:
                return {
                    "message": f"Error executing query: {tool_result['error']}",
                    "data": None,
                    "chart_type": None,
                    "conversation": messages,
                    "tool_used": tool_name,
                    "error": tool_result['error']
                }

            # Add assistant's tool call to conversation (convert to dict)
            messages.append({
                "role": message.get("role", "assistant"),
                "content": message.get("content", ""),
                "tool_calls": message.get("tool_calls")
            })

            # Add tool results to conversation
            messages.append({
                "role": "tool",
                "content": json.dumps(tool_result, default=str)
            })

            # Get final response with tool results
            final_response = ollama.chat(
                model='llama3.2:3b',
                messages=messages,
                options={"temperature": 0.3}
            )

            # Determine chart type
            chart_type = suggest_chart_type(tool_name)

            return {
                "message": final_response['message']['content'],
                "data": tool_result,
                "chart_type": chart_type,
                "conversation": messages,
                "tool_used": tool_name
            }

        # No tool use - just conversational response
        return {
            "message": message.get('content', 'I apologize, but I could not process that request.'),
            "data": None,
            "chart_type": None,
            "conversation": messages,
            "tool_used": None
        }

    except Exception as e:
        error_msg = str(e)

        # Check if Ollama is not running
        if "Connection refused" in error_msg or "connect" in error_msg.lower():
            error_msg = "Ollama is not running. Please start Ollama service (it should run automatically on Windows)."

        return {
            "message": f"Sorry, I encountered an error: {error_msg}",
            "data": None,
            "chart_type": None,
            "conversation": messages,
            "error": error_msg
        }


def execute_tool(tool_name: str, params: Dict[str, Any]) -> Any:
    """
    Execute tool safely with validation.

    Args:
        tool_name: Name of the tool to execute
        params: Parameters for the tool

    Returns:
        Query results or error dictionary
    """
    # Validate dates
    try:
        start = datetime.fromisoformat(params["start_date"])
        end = datetime.fromisoformat(params["end_date"])

        if end < start:
            return {"error": "End date must be after start date"}

        if (end - start).days > 730:
            return {"error": "Date range too large (max 2 years)"}
    except (ValueError, KeyError) as e:
        return {"error": f"Invalid date format: {str(e)}"}

    conn = get_connection()

    try:
        if tool_name == "query_top_products":
            # Ensure limit is an integer
            limit = int(min(params.get("limit", 10), 50))
            city = params.get("city")
            state = params.get("state")

            # Build query
            base_query = """
                SELECT
                    p.product_id,
                    p.name,
                    p.category,
                    SUM(f.quantity) AS units_sold,
                    SUM(f.amount) AS revenue
                FROM fact_orders f
                JOIN dim_product p ON f.product_id = p.product_id
            """

            where_clauses = ["f.order_date BETWEEN ? AND ?", "f.status IN ('delivered', 'shipped')"]
            query_params = [params["start_date"], params["end_date"]]

            if city or state:
                base_query += " JOIN dim_customer c ON f.customer_id = c.customer_id"
                where_clauses.append("c.is_current = 1")
                if city:
                    where_clauses.append("c.addr_city = ?")
                    query_params.append(city)
                if state:
                    where_clauses.append("c.addr_state = ?")
                    query_params.append(state)

            query = base_query + " WHERE " + " AND ".join(where_clauses) + f"""
                GROUP BY p.product_id, p.name, p.category
                ORDER BY revenue DESC
                LIMIT {limit}
            """
            # Don't append limit to query_params since we're using f-string

            results = execute_query(conn, query, tuple(query_params))

            return [
                {
                    "product_id": row["product_id"],
                    "name": row["name"],
                    "category": row["category"],
                    "units_sold": row["units_sold"],
                    "revenue": round(row["revenue"] or 0, 2)
                }
                for row in results
            ]

        elif tool_name == "query_top_customers":
            # Ensure limit is an integer
            limit = int(min(params.get("limit", 20), 50))
            city = params.get("city")
            state = params.get("state")

            where_clauses = [
                "f.order_date BETWEEN ? AND ?",
                "f.status IN ('delivered', 'shipped')",
                "c.is_current = 1"
            ]
            query_params = [params["start_date"], params["end_date"]]

            if city:
                where_clauses.append("c.addr_city = ?")
                query_params.append(city)
            if state:
                where_clauses.append("c.addr_state = ?")
                query_params.append(state)

            query = f"""
                SELECT
                    c.customer_id,
                    c.name,
                    c.addr_city AS city,
                    c.addr_state AS state,
                    COUNT(DISTINCT f.order_id) AS total_orders,
                    SUM(f.amount) AS total_spent
                FROM fact_orders f
                JOIN dim_customer c ON f.customer_id = c.customer_id
                WHERE """ + " AND ".join(where_clauses) + f"""
                GROUP BY c.customer_id, c.name, c.addr_city, c.addr_state
                ORDER BY total_spent DESC
                LIMIT {limit}
            """
            # Don't append limit to query_params

            results = execute_query(conn, query, tuple(query_params))

            return [
                {
                    "customer_id": row["customer_id"],
                    "name": row["name"],
                    "city": row["city"],
                    "state": row["state"],
                    "total_orders": row["total_orders"],
                    "total_spent": round(row["total_spent"] or 0, 2)
                }
                for row in results
            ]

        elif tool_name == "query_revenue_trend":
            granularity = params.get("granularity", "monthly")
            city = params.get("city")
            state = params.get("state")

            # Build query based on granularity
            if granularity == "monthly":
                group_by = "d.year, d.month, d.month_name"
                date_format = "d.year || '-' || SUBSTR('00' || d.month, -2)"
                order_by = "d.year, d.month"
            else:  # quarterly
                group_by = "d.year, d.quarter"
                date_format = "d.year || '-Q' || d.quarter"
                order_by = "d.year, d.quarter"

            base_query = f"""
                SELECT
                    {date_format} AS period,
                    d.month_name,
                    COUNT(DISTINCT f.order_id) AS order_count,
                    SUM(f.amount) AS revenue
                FROM fact_orders f
                JOIN dim_date d ON f.date_key = d.date_key
            """

            where_clauses = ["f.order_date BETWEEN ? AND ?", "f.status IN ('delivered', 'shipped')"]
            query_params = [params["start_date"], params["end_date"]]

            if city or state:
                base_query += " JOIN dim_customer c ON f.customer_id = c.customer_id"
                where_clauses.append("c.is_current = 1")
                if city:
                    where_clauses.append("c.addr_city = ?")
                    query_params.append(city)
                if state:
                    where_clauses.append("c.addr_state = ?")
                    query_params.append(state)

            query = base_query + " WHERE " + " AND ".join(where_clauses) + f"""
                GROUP BY {group_by}
                ORDER BY {order_by}
            """

            results = execute_query(conn, query, tuple(query_params))

            return [
                {
                    "period": row["period"],
                    "month_name": row.get("month_name"),
                    "order_count": row["order_count"],
                    "revenue": round(row["revenue"] or 0, 2)
                }
                for row in results
            ]

        elif tool_name == "query_city_breakdown":
            # Ensure limit is an integer
            limit = int(min(params.get("limit", 10), 50))

            query = f"""
                SELECT
                    c.addr_city AS city,
                    c.addr_state AS state,
                    COUNT(DISTINCT f.order_id) AS order_count,
                    SUM(f.amount) AS revenue
                FROM fact_orders f
                JOIN dim_customer c ON f.customer_id = c.customer_id
                WHERE f.order_date BETWEEN ? AND ?
                  AND f.status IN ('delivered', 'shipped')
                  AND c.is_current = 1
                GROUP BY c.addr_city, c.addr_state
                ORDER BY revenue DESC
                LIMIT {limit}
            """

            results = execute_query(conn, query, (params["start_date"], params["end_date"]))

            return [
                {
                    "city": row["city"],
                    "state": row["state"],
                    "order_count": row["order_count"],
                    "revenue": round(row["revenue"] or 0, 2)
                }
                for row in results
            ]

        elif tool_name == "query_summary_stats":
            city = params.get("city")
            state = params.get("state")

            base_query = """
                SELECT
                    COUNT(DISTINCT f.order_id) AS total_orders,
                    SUM(f.amount) AS total_revenue,
                    COUNT(DISTINCT f.customer_id) AS unique_customers
                FROM fact_orders f
            """

            where_clauses = ["f.status IN ('delivered', 'shipped')", "f.order_date BETWEEN ? AND ?"]
            query_params = [params["start_date"], params["end_date"]]

            if city or state:
                base_query += " JOIN dim_customer c ON f.customer_id = c.customer_id"
                where_clauses.append("c.is_current = 1")
                if city:
                    where_clauses.append("c.addr_city = ?")
                    query_params.append(city)
                if state:
                    where_clauses.append("c.addr_state = ?")
                    query_params.append(state)

            query = base_query + " WHERE " + " AND ".join(where_clauses)
            results = execute_query(conn, query, tuple(query_params))

            row = results[0]
            return {
                "total_revenue": round(row["total_revenue"] or 0, 2),
                "total_orders": row["total_orders"],
                "unique_customers": row["unique_customers"]
            }

        else:
            return {"error": f"Unknown tool: {tool_name}"}

    except Exception as e:
        return {"error": f"Database error: {str(e)}"}


def suggest_chart_type(tool_name: str) -> str:
    """
    Suggest appropriate chart type based on tool used.

    Args:
        tool_name: Name of the tool that was executed

    Returns:
        Chart type string (bar, line, pie, or table)
    """
    chart_map = {
        "query_top_products": "bar",
        "query_top_customers": "bar",
        "query_city_breakdown": "bar",
        "query_revenue_trend": "line",
        "query_summary_stats": "stats",
    }
    return chart_map.get(tool_name, "table")
