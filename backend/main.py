"""
main.py — NovaCart Account Dashboard API

Built with FastAPI. Auto-generated Swagger UI docs at: http://localhost:8000/docs
(ReDoc at /redoc, raw OpenAPI schema at /openapi.json)

Endpoints:
  GET  /health                                  — service health check
  GET  /authorize                                — SPCS OAuth flow
  GET  /franchise/summary                        — overview stats
  GET  /franchise/orders                         — monthly order volume and revenue
  GET  /franchise/products                       — top products by revenue
  GET  /franchise/customers                      — top customers by revenue
  GET  /franchise/cities                         — revenue by city/state
  GET  /franchise/products/{product_id}/insights — detailed product analytics
  GET  /franchise/customers/{customer_id}/insights — detailed customer analytics
  POST /chat                                     — natural-language analytics assistant

Data schema (from the DE capstone Gold layer):
  fact_orders:   order_id, customer_id, product_id, order_date, amount, currency, status, quantity, date_key
  dim_customer:  customer_id, name, email, addr_city, addr_state, valid_from, valid_to, is_current
  dim_product:   product_id, name, category, price
  dim_date:      date_key, year, quarter, month, month_name, day_of_week

The connection and query helpers are already set up in connection.py.
"""

import os
import time
from fastapi import FastAPI, HTTPException, Request, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

from connection import get_connection, execute_query
from ai_assistant import process_query

load_dotenv()

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="NovaCart Account Dashboard API",
    description=(
        "REST API for the NovaCart account manager dashboard. "
        "Built on top of the Gold data layer produced by the Data Engineering team.\n\n"
        "All `start`/`end` date filters use `YYYY-MM-DD` format. Unless noted otherwise, "
        "revenue figures only include orders with status `delivered` or `shipped`."
    ),
    version="1.0.0",
    openapi_tags=[
        {"name": "System", "description": "Service health and status checks."},
        {"name": "Auth", "description": "Identity/authorization endpoint used by the SPCS OAuth flow."},
        {"name": "Franchise", "description": "Aggregate analytics across orders, products, customers, and cities."},
        {"name": "Insights", "description": "Deep-dive analytics for a single product or customer."},
        {"name": "AI Assistant", "description": "Natural-language analytics assistant backed by IBM Consulting Advantage (ICA), grounded in a Document Collection."},
    ],
)

PORT              = int(os.getenv("PORT", 8000))
CLIENT_VALIDATION = os.getenv("CLIENT_VALIDATION", "Dev")
START_TIME        = time.time()

# CORS — only needed for local development
# In SPCS, the NGINX router handles routing so CORS is not required
if CLIENT_VALIDATION == "Dev":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:3001"],
        allow_methods=["GET", "POST"],  # Added POST for /chat endpoint
        allow_headers=["*"],
    )


# ── Response / request models ────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    detail: str = Field(examples=["Product not found"])


class DateRange(BaseModel):
    start: Optional[str] = Field(None, examples=["2022-01-01"])
    end: Optional[str] = Field(None, examples=["2022-12-31"])


class DatabaseStatusOk(BaseModel):
    status: str = Field(examples=["connected"])


class DatabaseStatusError(BaseModel):
    status: str = Field(examples=["error"])
    message: str = Field(examples=["unable to open database file"])


class HealthResponse(BaseModel):
    status: str = Field(examples=["healthy"])
    uptime_s: int = Field(description="Seconds since the API process started.", examples=[3600])
    backend: str = Field(description="Active data backend.", examples=["sqlite"])
    database: DatabaseStatusOk

    model_config = ConfigDict(json_schema_extra={"example": {
        "status": "healthy",
        "uptime_s": 3600,
        "backend": "sqlite",
        "database": {"status": "connected"},
    }})


class HealthDegradedResponse(BaseModel):
    status: str = Field(examples=["degraded"])
    uptime_s: int = Field(examples=[3600])
    database: DatabaseStatusError

    model_config = ConfigDict(json_schema_extra={"example": {
        "status": "degraded",
        "uptime_s": 3600,
        "database": {"status": "error", "message": "unable to open database file"},
    }})


class AuthorizeResponse(BaseModel):
    user: str = Field(description="Snowflake/SPCS username, or a mock user in Dev mode.", examples=["dev_user"])
    status: str = Field(examples=["authorized"])


class SummaryResponse(BaseModel):
    total_revenue: float = Field(description="Sum of order amounts (delivered + shipped only).", examples=[128450.00])
    total_orders: int = Field(examples=[842])
    unique_customers: int = Field(examples=[612])
    date_range: DateRange

    model_config = ConfigDict(json_schema_extra={"example": {
        "total_revenue": 128450.00,
        "total_orders": 842,
        "unique_customers": 612,
        "date_range": {"start": "2022-01-01", "end": "2022-12-31"},
    }})


class OrderMonth(BaseModel):
    month: str = Field(description="Month in YYYY-MM format.", examples=["2022-01"])
    month_name: str = Field(examples=["January"])
    order_count: int = Field(examples=[842])
    revenue: float = Field(examples=[128450.00])


class ProductRevenue(BaseModel):
    product_id: str = Field(examples=["P001"])
    name: str = Field(examples=["Wireless Headphones"])
    category: str = Field(examples=["Electronics"])
    units_sold: int = Field(examples=[342])
    revenue: float = Field(examples=[30578.58])


class CustomerRevenue(BaseModel):
    customer_id: str = Field(examples=["C001"])
    name: str = Field(examples=["Alice Johnson"])
    city: str = Field(examples=["Austin"])
    state: str = Field(examples=["TX"])
    total_orders: int = Field(examples=[14])
    total_spent: float = Field(examples=[1240.50])


class CityRevenue(BaseModel):
    city: str = Field(examples=["Austin"])
    state: str = Field(examples=["TX"])
    order_count: int = Field(examples=[420])
    revenue: float = Field(examples=[38430.00])


class ProductInfo(BaseModel):
    product_id: str = Field(examples=["P001"])
    name: str = Field(examples=["Wireless Headphones"])
    category: str = Field(examples=["Electronics"])
    price: float = Field(examples=[89.99])


class ProductInsightsSummary(BaseModel):
    total_orders: int = Field(examples=[342])
    total_units: int = Field(examples=[512])
    total_revenue: float = Field(examples=[30578.58])
    avg_order_value: float = Field(examples=[89.41])


class ProductMonthlyTrend(BaseModel):
    month: str = Field(examples=["2022-01"])
    month_name: str = Field(examples=["January"])
    order_count: int = Field(examples=[28])
    units_sold: int = Field(examples=[41])
    revenue: float = Field(examples=[3654.59])


class ProductTopCustomer(BaseModel):
    customer_id: str = Field(examples=["C001"])
    name: str = Field(examples=["Alice Johnson"])
    city: str = Field(examples=["Austin"])
    state: str = Field(examples=["TX"])
    order_count: int = Field(examples=[6])
    units_purchased: int = Field(examples=[9])
    total_spent: float = Field(examples=[539.94])


class ProductInsightsResponse(BaseModel):
    product: ProductInfo
    summary: ProductInsightsSummary
    monthly_trend: List[ProductMonthlyTrend]
    top_customers: List[ProductTopCustomer]


class CustomerInfo(BaseModel):
    customer_id: str = Field(examples=["C001"])
    name: str = Field(examples=["Alice Johnson"])
    email: str = Field(examples=["alice.johnson@example.com"])
    city: str = Field(examples=["Austin"])
    state: str = Field(examples=["TX"])


class CustomerInsightsSummary(BaseModel):
    total_orders: int = Field(examples=[14])
    total_items: int = Field(examples=[22])
    total_spent: float = Field(examples=[1240.50])
    avg_order_value: float = Field(examples=[88.61])
    first_order_date: str = Field(examples=["2022-01-05"])
    last_order_date: str = Field(examples=["2022-11-30"])


class CustomerMonthlyTrend(BaseModel):
    month: str = Field(examples=["2022-01"])
    month_name: str = Field(examples=["January"])
    order_count: int = Field(examples=[2])
    items_purchased: int = Field(examples=[3])
    total_spent: float = Field(examples=[178.50])


class CustomerTopProduct(BaseModel):
    product_id: str = Field(examples=["P001"])
    name: str = Field(examples=["Wireless Headphones"])
    category: str = Field(examples=["Electronics"])
    order_count: int = Field(examples=[4])
    units_purchased: int = Field(examples=[5])
    total_spent: float = Field(examples=[449.95])


class CategoryBreakdown(BaseModel):
    category: str = Field(examples=["Electronics"])
    order_count: int = Field(examples=[9])
    units_purchased: int = Field(examples=[14])
    total_spent: float = Field(examples=[812.30])


class CustomerInsightsResponse(BaseModel):
    customer: CustomerInfo
    summary: CustomerInsightsSummary
    monthly_trend: List[CustomerMonthlyTrend]
    top_products: List[CustomerTopProduct]
    category_breakdown: List[CategoryBreakdown]


# ── Startup log ───────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    print("\nStarting NovaCart Dashboard API")
    print(f"Port:            {PORT}")
    print(f"Data backend:    {os.getenv('DATA_BACKEND', 'sqlite')}")
    print(f"Validation mode: {CLIENT_VALIDATION}")
    print(f"Docs:            http://localhost:{PORT}/docs\n")


# ── Health ────────────────────────────────────────────────────────────────────

@app.get(
    "/health",
    tags=["System"],
    summary="Health check",
    response_model=HealthResponse,
    responses={503: {"model": HealthDegradedResponse, "description": "Database is unreachable"}},
)
def health():
    """
    Returns service health and confirms the database connection is working.
    Used by the frontend service status indicator.

    No parameters.
    """
    uptime = round(time.time() - START_TIME)
    try:
        conn    = get_connection()
        results = execute_query(conn, "SELECT 1 AS ping")
        assert len(results) > 0
    except Exception as e:
        return JSONResponse(status_code=503, content={
            "status":   "degraded",
            "uptime_s": uptime,
            "database": {"status": "error", "message": str(e)},
        })
    return {
        "status":   "healthy",
        "uptime_s": uptime,
        "backend":  os.getenv("DATA_BACKEND", "sqlite"),
        "database": {"status": "connected"},
    }


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.get(
    "/authorize",
    tags=["Auth"],
    summary="Get authenticated user identity",
    response_model=AuthorizeResponse,
    responses={422: {"model": ErrorResponse, "description": "Missing Sf-Context-Current-User header"}},
)
def authorize(request: Request):
    """
    SPCS OAuth authorization endpoint.

    When running inside SPCS, the platform injects the authenticated Snowflake
    username in the `Sf-Context-Current-User` header. This endpoint reads that
    header and returns the user's identity so the frontend can store it.

    In Dev mode (`CLIENT_VALIDATION=Dev`): returns a mock user for local development
    and does not require the header.

    No query/path parameters.
    """
    if CLIENT_VALIDATION == "Dev":
        return {"user": "dev_user", "status": "authorized"}

    username = request.headers.get("sf-context-current-user")
    if not username:
        raise HTTPException(status_code=422, detail="Missing Sf-Context-Current-User header")

    return {"user": username, "status": "authorized"}


# ── Franchise endpoints ───────────────────────────────────────────────────────

@app.get(
    "/franchise/summary",
    tags=["Franchise"],
    summary="Get orders overview",
    response_model=SummaryResponse,
)
def get_summary(
    start: str = Query("2022-01-01", description="Start date (inclusive), format YYYY-MM-DD.", examples=["2022-01-01"]),
    end: str = Query("2022-12-31", description="End date (inclusive), format YYYY-MM-DD.", examples=["2022-12-31"]),
    city: Optional[str] = Query(None, description="Filter to customers in this city. Requires an exact, case-sensitive match.", examples=["Austin"]),
    state: Optional[str] = Query(None, description="Filter to customers in this state/region code.", examples=["TX"]),
):
    """
    Returns an overview of orders in the given date range:
    - Total revenue (delivered + shipped orders only)
    - Total orders
    - Number of unique customers
    - Date range of available data
    - Optional filters: city, state
    """
    conn = get_connection()

    # Build dynamic query based on filters
    base_query = """
        SELECT
            COUNT(DISTINCT f.order_id)    AS total_orders,
            SUM(f.amount)                 AS total_revenue,
            COUNT(DISTINCT f.customer_id) AS unique_customers,
            MIN(f.order_date)             AS start_date,
            MAX(f.order_date)             AS end_date
        FROM fact_orders f
    """

    where_clauses = ["f.status IN ('delivered', 'shipped')", "f.order_date BETWEEN ? AND ?"]
    params = [start, end]

    # Add city/state filtering if provided
    if city or state:
        base_query += " JOIN dim_customer c ON f.customer_id = c.customer_id"
        where_clauses.append("c.is_current = 1")
        if city:
            where_clauses.append("c.addr_city = ?")
            params.append(city)
        if state:
            where_clauses.append("c.addr_state = ?")
            params.append(state)

    query = base_query + " WHERE " + " AND ".join(where_clauses)
    results = execute_query(conn, query, tuple(params))

    row = results[0]
    return {
        "total_revenue":     round(row["total_revenue"] or 0, 2),
        "total_orders":      row["total_orders"],
        "unique_customers":  row["unique_customers"],
        "date_range": {"start": row["start_date"], "end": row["end_date"]},
    }


@app.get(
    "/franchise/orders",
    tags=["Franchise"],
    summary="Get monthly order volume and revenue",
    response_model=List[OrderMonth],
)
def get_orders(
    start: str = Query("2022-01-01", description="Start date (inclusive), format YYYY-MM-DD.", examples=["2022-01-01"]),
    end: str = Query("2022-12-31", description="End date (inclusive), format YYYY-MM-DD.", examples=["2022-12-31"]),
):
    """
    Returns monthly order volume and revenue for the given date range,
    one entry per calendar month with at least one order. Used to power the
    orders overview chart. Only delivered/shipped orders are included.
    """
    conn = get_connection()

    # ── YOUR CODE HERE ────────────────────────────────────────────────────────
    # JOIN fact_orders with dim_date to get month information
    # Group by month to show monthly trends
    # Filter by date range and only include delivered/shipped orders
    results = execute_query(conn, """
        SELECT
            d.year || '-' || SUBSTR('00' || d.month, -2) AS month,
            d.month_name,
            COUNT(DISTINCT f.order_id) AS order_count,
            SUM(f.amount) AS revenue
        FROM fact_orders f
        JOIN dim_date d ON f.date_key = d.date_key
        WHERE f.order_date BETWEEN ? AND ?
          AND f.status IN ('delivered', 'shipped')
        GROUP BY d.year, d.month, d.month_name
        ORDER BY d.year, d.month
    """, (start, end))

    # Format the results with proper rounding for revenue
    return [
        {
            "month": row["month"],
            "month_name": row["month_name"],
            "order_count": row["order_count"],
            "revenue": round(row["revenue"] or 0, 2)
        }
        for row in results
    ]


@app.get(
    "/franchise/products",
    tags=["Franchise"],
    summary="Get top products by revenue",
    response_model=List[ProductRevenue],
)
def get_products(
    start: str = Query("2022-01-01", description="Start date (inclusive), format YYYY-MM-DD.", examples=["2022-01-01"]),
    end: str = Query("2022-12-31", description="End date (inclusive), format YYYY-MM-DD.", examples=["2022-12-31"]),
    city: Optional[str] = Query(None, description="Filter to customers in this city. Requires an exact, case-sensitive match.", examples=["Austin"]),
    state: Optional[str] = Query(None, description="Filter to customers in this state/region code.", examples=["TX"]),
):
    """
    Returns the top 10 products by revenue for the given date range,
    ordered highest revenue first. Optional filters: city, state (filters by
    customer location).
    """
    conn = get_connection()

    # Build dynamic query based on filters
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
    params = [start, end]

    # Add city/state filtering if provided
    if city or state:
        base_query += " JOIN dim_customer c ON f.customer_id = c.customer_id"
        where_clauses.append("c.is_current = 1")
        if city:
            where_clauses.append("c.addr_city = ?")
            params.append(city)
        if state:
            where_clauses.append("c.addr_state = ?")
            params.append(state)

    query = base_query + " WHERE " + " AND ".join(where_clauses) + """
        GROUP BY p.product_id, p.name, p.category
        ORDER BY revenue DESC
        LIMIT 10
    """

    results = execute_query(conn, query, tuple(params))

    # Format the results with proper rounding for revenue
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


@app.get(
    "/franchise/customers",
    tags=["Franchise"],
    summary="Get top customers by revenue",
    response_model=List[CustomerRevenue],
)
def get_customers(
    start: str = Query("2022-01-01", description="Start date (inclusive), format YYYY-MM-DD.", examples=["2022-01-01"]),
    end: str = Query("2022-12-31", description="End date (inclusive), format YYYY-MM-DD.", examples=["2022-12-31"]),
    city: Optional[str] = Query(None, description="Filter to customers in this city. Requires an exact, case-sensitive match.", examples=["Austin"]),
    state: Optional[str] = Query(None, description="Filter to customers in this state/region code.", examples=["TX"]),
):
    """
    Returns the top 20 customers by revenue for the given date range,
    ordered highest spend first. Optional filters: city, state (filters by
    customer location). Only the customer's current address is used.
    """
    conn = get_connection()

    # Build dynamic query based on filters
    where_clauses = [
        "f.order_date BETWEEN ? AND ?",
        "f.status IN ('delivered', 'shipped')",
        "c.is_current = 1"
    ]
    params = [start, end]

    # Add city/state filtering if provided
    if city:
        where_clauses.append("c.addr_city = ?")
        params.append(city)
    if state:
        where_clauses.append("c.addr_state = ?")
        params.append(state)

    query = """
        SELECT
            c.customer_id,
            c.name,
            c.addr_city AS city,
            c.addr_state AS state,
            COUNT(DISTINCT f.order_id) AS total_orders,
            SUM(f.amount) AS total_spent
        FROM fact_orders f
        JOIN dim_customer c ON f.customer_id = c.customer_id
        WHERE """ + " AND ".join(where_clauses) + """
        GROUP BY c.customer_id, c.name, c.addr_city, c.addr_state
        ORDER BY total_spent DESC
        LIMIT 20
    """

    results = execute_query(conn, query, tuple(params))

    # Format the results with proper rounding for total_spent
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


@app.get(
    "/franchise/cities",
    tags=["Franchise"],
    summary="Get revenue by city/state",
    response_model=List[CityRevenue],
)
def get_cities(
    start: str = Query("2022-01-01", description="Start date (inclusive), format YYYY-MM-DD.", examples=["2022-01-01"]),
    end: str = Query("2022-12-31", description="End date (inclusive), format YYYY-MM-DD.", examples=["2022-12-31"]),
):
    """
    Returns revenue grouped by city and state, ordered highest revenue first.
    Used to power the geographic breakdown chart. Only each customer's
    current address is used.
    """
    conn = get_connection()

    # ── YOUR CODE HERE ────────────────────────────────────────────────────────
    # JOIN fact_orders with dim_customer to get customer location (city, state)
    # IMPORTANT: Only use is_current = 1 to get the latest customer address
    # Aggregate by city and state to show geographic revenue distribution
    # Only include delivered/shipped orders, filter by date range
    # Order by revenue to show top-performing locations first
    results = execute_query(conn, """
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
    """, (start, end))

    # Format the results with proper rounding for revenue
    return [
        {
            "city": row["city"],
            "state": row["state"],
            "order_count": row["order_count"],
            "revenue": round(row["revenue"] or 0, 2)
        }
        for row in results
    ]


# ── Insights endpoints ────────────────────────────────────────────────────────

@app.get(
    "/franchise/products/{product_id}/insights",
    tags=["Insights"],
    summary="Get detailed analytics for a product",
    response_model=ProductInsightsResponse,
    responses={404: {"model": ErrorResponse, "description": "Product not found"}},
)
def get_product_insights(
    product_id: str = Path(..., description="Product identifier.", examples=["P001"]),
    start: str = Query("2022-01-01", description="Start date (inclusive), format YYYY-MM-DD.", examples=["2022-01-01"]),
    end: str = Query("2022-12-31", description="End date (inclusive), format YYYY-MM-DD.", examples=["2022-12-31"]),
):
    """
    Returns detailed analytics for a specific product:
    - Monthly revenue and units sold trend
    - Top 5 customers who purchased this product
    - Total revenue and units in date range
    - Average order value for this product

    Returns 404 if `product_id` does not exist.
    """
    conn = get_connection()

    # Get product details
    product_info = execute_query(conn, """
        SELECT product_id, name, category, price
        FROM dim_product
        WHERE product_id = ?
    """, (product_id,))

    if not product_info:
        raise HTTPException(status_code=404, detail="Product not found")

    # Monthly trend
    monthly_trend = execute_query(conn, """
        SELECT
            d.year || '-' || SUBSTR('00' || d.month, -2) AS month,
            d.month_name,
            COUNT(DISTINCT f.order_id) AS order_count,
            SUM(f.quantity) AS units_sold,
            SUM(f.amount) AS revenue
        FROM fact_orders f
        JOIN dim_date d ON f.date_key = d.date_key
        WHERE f.product_id = ?
          AND f.order_date BETWEEN ? AND ?
          AND f.status IN ('delivered', 'shipped')
        GROUP BY d.year, d.month, d.month_name
        ORDER BY d.year, d.month
    """, (product_id, start, end))

    # Top customers for this product
    top_customers = execute_query(conn, """
        SELECT
            c.customer_id,
            c.name,
            c.addr_city AS city,
            c.addr_state AS state,
            COUNT(DISTINCT f.order_id) AS order_count,
            SUM(f.quantity) AS units_purchased,
            SUM(f.amount) AS total_spent
        FROM fact_orders f
        JOIN dim_customer c ON f.customer_id = c.customer_id
        WHERE f.product_id = ?
          AND f.order_date BETWEEN ? AND ?
          AND f.status IN ('delivered', 'shipped')
          AND c.is_current = 1
        GROUP BY c.customer_id, c.name, c.addr_city, c.addr_state
        ORDER BY total_spent DESC
        LIMIT 5
    """, (product_id, start, end))

    # Summary stats
    summary = execute_query(conn, """
        SELECT
            COUNT(DISTINCT order_id) AS total_orders,
            SUM(quantity) AS total_units,
            SUM(amount) AS total_revenue,
            AVG(amount) AS avg_order_value
        FROM fact_orders
        WHERE product_id = ?
          AND order_date BETWEEN ? AND ?
          AND status IN ('delivered', 'shipped')
    """, (product_id, start, end))

    return {
        "product": {
            "product_id": product_info[0]["product_id"],
            "name": product_info[0]["name"],
            "category": product_info[0]["category"],
            "price": round(product_info[0]["price"] or 0, 2)
        },
        "summary": {
            "total_orders": summary[0]["total_orders"],
            "total_units": summary[0]["total_units"],
            "total_revenue": round(summary[0]["total_revenue"] or 0, 2),
            "avg_order_value": round(summary[0]["avg_order_value"] or 0, 2)
        },
        "monthly_trend": [
            {
                "month": row["month"],
                "month_name": row["month_name"],
                "order_count": row["order_count"],
                "units_sold": row["units_sold"],
                "revenue": round(row["revenue"] or 0, 2)
            }
            for row in monthly_trend
        ],
        "top_customers": [
            {
                "customer_id": row["customer_id"],
                "name": row["name"],
                "city": row["city"],
                "state": row["state"],
                "order_count": row["order_count"],
                "units_purchased": row["units_purchased"],
                "total_spent": round(row["total_spent"] or 0, 2)
            }
            for row in top_customers
        ]
    }


@app.get(
    "/franchise/customers/{customer_id}/insights",
    tags=["Insights"],
    summary="Get detailed analytics for a customer",
    response_model=CustomerInsightsResponse,
    responses={404: {"model": ErrorResponse, "description": "Customer not found"}},
)
def get_customer_insights(
    customer_id: str = Path(..., description="Customer identifier.", examples=["C001"]),
    start: str = Query("2022-01-01", description="Start date (inclusive), format YYYY-MM-DD.", examples=["2022-01-01"]),
    end: str = Query("2022-12-31", description="End date (inclusive), format YYYY-MM-DD.", examples=["2022-12-31"]),
):
    """
    Returns detailed analytics for a specific customer:
    - Monthly spending trend
    - Top 5 purchased products
    - Favorite product categories
    - Purchase frequency and patterns

    Returns 404 if `customer_id` does not exist (or is not the customer's
    current record).
    """
    conn = get_connection()

    # Get customer details
    customer_info = execute_query(conn, """
        SELECT customer_id, name, email, addr_city, addr_state
        FROM dim_customer
        WHERE customer_id = ? AND is_current = 1
    """, (customer_id,))

    if not customer_info:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Monthly spending trend
    monthly_trend = execute_query(conn, """
        SELECT
            d.year || '-' || SUBSTR('00' || d.month, -2) AS month,
            d.month_name,
            COUNT(DISTINCT f.order_id) AS order_count,
            SUM(f.quantity) AS items_purchased,
            SUM(f.amount) AS total_spent
        FROM fact_orders f
        JOIN dim_date d ON f.date_key = d.date_key
        WHERE f.customer_id = ?
          AND f.order_date BETWEEN ? AND ?
          AND f.status IN ('delivered', 'shipped')
        GROUP BY d.year, d.month, d.month_name
        ORDER BY d.year, d.month
    """, (customer_id, start, end))

    # Top products purchased
    top_products = execute_query(conn, """
        SELECT
            p.product_id,
            p.name,
            p.category,
            COUNT(DISTINCT f.order_id) AS order_count,
            SUM(f.quantity) AS units_purchased,
            SUM(f.amount) AS total_spent
        FROM fact_orders f
        JOIN dim_product p ON f.product_id = p.product_id
        WHERE f.customer_id = ?
          AND f.order_date BETWEEN ? AND ?
          AND f.status IN ('delivered', 'shipped')
        GROUP BY p.product_id, p.name, p.category
        ORDER BY total_spent DESC
        LIMIT 5
    """, (customer_id, start, end))

    # Category preferences
    category_breakdown = execute_query(conn, """
        SELECT
            p.category,
            COUNT(DISTINCT f.order_id) AS order_count,
            SUM(f.quantity) AS units_purchased,
            SUM(f.amount) AS total_spent
        FROM fact_orders f
        JOIN dim_product p ON f.product_id = p.product_id
        WHERE f.customer_id = ?
          AND f.order_date BETWEEN ? AND ?
          AND f.status IN ('delivered', 'shipped')
        GROUP BY p.category
        ORDER BY total_spent DESC
    """, (customer_id, start, end))

    # Summary stats
    summary = execute_query(conn, """
        SELECT
            COUNT(DISTINCT order_id) AS total_orders,
            SUM(quantity) AS total_items,
            SUM(amount) AS total_spent,
            AVG(amount) AS avg_order_value,
            MIN(order_date) AS first_order_date,
            MAX(order_date) AS last_order_date
        FROM fact_orders
        WHERE customer_id = ?
          AND order_date BETWEEN ? AND ?
          AND status IN ('delivered', 'shipped')
    """, (customer_id, start, end))

    return {
        "customer": {
            "customer_id": customer_info[0]["customer_id"],
            "name": customer_info[0]["name"],
            "email": customer_info[0]["email"],
            "city": customer_info[0]["addr_city"],
            "state": customer_info[0]["addr_state"]
        },
        "summary": {
            "total_orders": summary[0]["total_orders"],
            "total_items": summary[0]["total_items"],
            "total_spent": round(summary[0]["total_spent"] or 0, 2),
            "avg_order_value": round(summary[0]["avg_order_value"] or 0, 2),
            "first_order_date": summary[0]["first_order_date"],
            "last_order_date": summary[0]["last_order_date"]
        },
        "monthly_trend": [
            {
                "month": row["month"],
                "month_name": row["month_name"],
                "order_count": row["order_count"],
                "items_purchased": row["items_purchased"],
                "total_spent": round(row["total_spent"] or 0, 2)
            }
            for row in monthly_trend
        ],
        "top_products": [
            {
                "product_id": row["product_id"],
                "name": row["name"],
                "category": row["category"],
                "order_count": row["order_count"],
                "units_purchased": row["units_purchased"],
                "total_spent": round(row["total_spent"] or 0, 2)
            }
            for row in top_products
        ],
        "category_breakdown": [
            {
                "category": row["category"],
                "order_count": row["order_count"],
                "units_purchased": row["units_purchased"],
                "total_spent": round(row["total_spent"] or 0, 2)
            }
            for row in category_breakdown
        ]
    }


# ── AI Assistant ──────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(description="Natural-language analytics question.", examples=["Show me top 10 products in 2022"])
    conversation: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description=(
            "Prior conversation turns, as previously returned in a `conversation` "
            "field from this same endpoint. Pass it back to maintain context "
            "across multiple /chat calls; omit or send null to start a new conversation."
        ),
        examples=[[{"role": "user", "content": "What were Q1 sales?"}]],
    )


class ChatResponse(BaseModel):
    message: str = Field(description="AI-generated answer, grounded in the connected Document Collection.", examples=["Here are the top 10 products by revenue in 2022."])
    sources: Optional[List[str]] = Field(None, description="Source documents ICA cited when answering, if any.", examples=[["catalog_2022.pdf", "sales_notes.docx"]])
    conversation: List[Dict[str, Any]] = Field(default_factory=list, description="Updated conversation history; pass back on the next call to maintain context.")
    error: Optional[str] = Field(None, description="Present only if an error occurred while processing the query.")

    model_config = ConfigDict(json_schema_extra={"example": {
        "message": "Here are the top 10 products by revenue in 2022.",
        "sources": ["catalog_2022.pdf", "sales_notes.docx"],
        "conversation": [
            {"role": "user", "content": "Show me top 10 products in 2022"},
            {"role": "assistant", "content": "Here are the top 10 products by revenue in 2022."},
        ],
    }})


@app.post(
    "/chat",
    tags=["AI Assistant"],
    summary="Ask the analytics assistant a natural-language question",
    response_model=ChatResponse,
)
async def chat(request: ChatRequest):
    """
    AI-powered analytics assistant backed by IBM Consulting Advantage (ICA).

    Sends the question to an ICA chat model along with a reference to a
    pre-configured ICA Document Collection, so ICA performs retrieval-augmented
    generation server-side and returns an answer plus the source documents it used.

    Requirements:
    - ICA_API_KEY, ICA_MODEL, and ICA_COLLECTION_ID must be set in backend/.env
    - The referenced Document Collection must already exist on the ICA account

    Example queries:
    - "Show me top 10 products in 2022"
    - "What were the revenue trends by quarter in Texas?"
    - "Who are the top customers in Austin?"
    - "Give me monthly revenue for Q1 2022"

    Errors are returned as a 200 response with the `error` field populated
    (rather than an HTTP error status), so the assistant can surface a
    friendly message in the chat UI.
    """
    try:
        result = await process_query(request.message, request.conversation)
        return result
    except Exception as e:
        return {
            "message": f"An error occurred: {str(e)}",
            "sources": None,
            "conversation": request.conversation or [],
            "error": str(e)
        }
    