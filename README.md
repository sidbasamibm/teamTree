# NovaCart Account Dashboard
### HC&D Associates Capstone — App Developer + App Consultant

## Introduction

NovaCart is a growing online retailer selling to customers in more than 30 countries. Account managers previously relied on ad-hoc Excel reports emailed weekly by the analytics team — often out of date and inconsistent. The **NovaCart Account Dashboard** replaces that process with a web-based tool that lets account managers explore up-to-date business performance directly, through three views:

- **Orders overview** — order volume and revenue trends over time
- **Product performance** — which products generate the most revenue
- **Customer list** — individual customers and their purchasing activity

The dashboard connects directly to NovaCart's Snowflake data warehouse, reading order, customer, and product records already cleaned and validated by the Data Engineering team. It is **read-only** — a reporting and analysis tool for internal use, not a system of record.

### Architecture

The system is made up of a few cooperating parts (see `Team Tree Solutions Design Document.pdf` for full details):

- **Frontend** — a React single-page app that presents the dashboard to the user.
- **Router (NGINX)** — a single entry point that routes data requests to the backend and everything else to the frontend, and load-balances across backend instances.
- **Backend** — a Python/FastAPI API that performs calculations and retrieves figures, querying Snowflake using an automatically-issued credential rather than a stored password (or a local SQLite database during development).
- **Snowflake** — the data warehouse of record, queried but never written to.

In production, the frontend, router, and backend run as containers on Snowpark Container Services (SPCS), inside Snowflake's own network.

```
User → NGINX (router) → FastAPI backend → Snowflake
                       ↳ React frontend
```

## What's in this repo

```
backend/          Python + FastAPI API
  main.py         API endpoints (franchise summary/orders/products/customers/cities, AI chat)
  connection.py   Handles local dev (SQLite) + SPCS (Snowflake) automatically
  ai_assistant.py Optional local AI assistant (Ollama) — see backend/AI_SETUP.md
  requirements.txt
  Dockerfile

frontend/         React 18 frontend
  src/pages/      OrdersView.js, ProductsView.js, CustomersView.js
  src/components/ Navbar, ServiceStatus, etc.
  src/utils/      api.js, ThemeContext.js
  Dockerfile

router/           NGINX reverse proxy — routes /api to the backend, everything else to the frontend
data/
  novacart_gold.db  SQLite database for local development
                     (30,000 orders · 400 customers · 15 products)

build-and-push.sh   Builds and pushes all three Docker images to the SPCS image repository
```

## Prerequisites

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/) and npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (only needed for containerized/SPCS deployment)
- [Snowflake CLI](https://docs.snowflake.com/en/developer-guide/snowflake-cli/index) (only needed to deploy to SPCS): `pip3 install snowflake-cli-labs`
- (Optional) [Ollama](https://ollama.com/download) if you want to run the local AI assistant

## Running locally

### 1. Backend

```bash
cd backend
cp .env.example .env
# No changes needed — DATA_BACKEND=sqlite works out of the box

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- API docs (Swagger UI): http://localhost:8000/docs
- Health check: `curl http://localhost:8000/health`

To use Snowflake instead of the local SQLite database, edit `backend/.env` and set `DATA_BACKEND=snowflake`, then fill in the `SNOWFLAKE_*` variables (account, username, role, warehouse, database, schema, and a keypair for MFA-enforced accounts).

### 2. Frontend

In a separate terminal:

```bash
cd frontend
cp .env.example .env

npm install
npm start
```

Opens at http://localhost:3000 and talks to the backend at `REACT_APP_BACKEND_URL` (defaults to `http://localhost:8000`).

With both running, open http://localhost:3000 — the dashboard should load and `ServiceStatus` should show the backend as connected.

### 3. Optional — local AI assistant

The backend includes an optional `/chat` endpoint backed by a locally-running LLM via [Ollama](https://ollama.com/download):

```bash
ollama pull llama3.2:3b
cd backend
python test_ai.py   # sanity-checks the /chat endpoint
```

See `backend/AI_SETUP.md` and `backend/QUICK_START.md` for details.

## Running with Docker

Each service has its own Dockerfile and can be built independently:

```bash
docker build -t backend_service  ./backend
docker build -t frontend_service ./frontend
docker build -t router_service   ./router
```

The router expects `FRONTEND_SERVICE` and `BACKEND_SERVICE` environment variables (host:port of the other two containers) and proxies `/api/*` to the backend and everything else to the frontend — this is how the three services are wired together in the SPCS deployment.

## Deploying to SPCS

Once the app is working locally, build and push all three images to your team's Snowflake image repository:

```bash
export REPO_URL=<provided by your facilitator>   # from: SHOW IMAGE REPOSITORIES;
export GROUP=<your team number>                   # e.g. 1, 2, 3...

bash build-and-push.sh
```

This logs in to the Snowflake image registry, builds each image for `linux/amd64`, and pushes it as `<name>_group<GROUP>:latest`. Then notify your facilitator — they will create the SPCS services and give you the public URL.

## Data schema

The SQLite database (and the equivalent Snowflake Gold layer) has four tables:

```
fact_orders    order_id, customer_id, product_id, order_date, amount,
               currency, status, quantity, date_key

dim_customer   customer_id, name, email, signup_date,
               addr_street, addr_city, addr_state, addr_zip,
               valid_from, valid_to, is_current

dim_product    product_id, name, category, price, updated_at

dim_date       date_key, full_date, year, quarter, month,
               month_name, day_of_week, is_weekend
```

Use `status IN ('delivered', 'shipped')` for revenue calculations.

## Troubleshooting

**`501 Not implemented` error** — that endpoint hasn't been built yet in `backend/main.py`.

**Backend can't find the database** — run `uvicorn` from inside the `backend/` directory (the SQLite path is relative).

**CORS error in browser** — make sure `CLIENT_VALIDATION=Dev` in `backend/.env` and `REACT_APP_CLIENT_VALIDATION=Dev` in `frontend/.env`.

**`snow` command not found**:
```bash
pip3 install snowflake-cli-labs
export PATH="$HOME/Library/Python/3.9/bin:$PATH"
```

**Docker build fails** — rebuild without the cache:
```bash
docker build --no-cache --platform linux/amd64 ...
```

## Further reading

- `Team Tree Solutions Design Document.pdf` — system architecture, key technology decisions, and trade-offs
- `Requirements Document Team Tree Associates Induction July 20th.docx` — full requirements
- `backend/AI_SETUP.md`, `backend/QUICK_START.md`, `backend/TINYLLAMA_SETUP.md` — AI assistant setup
- `FRONTEND_AI_TESTING.md` — frontend AI feature testing notes
