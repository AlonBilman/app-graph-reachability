# 🔍 Graph Reachability Security Analysis API

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](./test)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

---

## Overview

A TypeScript service that analyzes application call graphs to identify security vulnerabilities and compute reachability from entry points. The system scores risks based on severity, reachability, package metadata, and AI-generated code flags.

> **Note:** All data is stored in-memory and will be lost on server restart.

---

## Features

### Core Capabilities

- **Graph Analysis** — Load and validate call graphs with cycle detection
- **Reachability Computation** — BFS-based path finding from entry points to vulnerable functions
- **Risk Scoring** — Multi-factor scoring: severity + reachability + package risk + AI flags
- **Attack Path Analysis** — Identify critical attack paths with exploit difficulty
- **Component Analysis** — Find isolated components and dead code

### Technical Highlights

- **High Performance** — Optimized BFS algorithms with intelligent caching
- **Type-Safe** — End-to-end TypeScript with Zod runtime validation
- **Well-Tested** — 50+ tests covering unit, integration, and performance
- **REST API** — Standard HTTP/JSON interface with consistent responses

---

## Quick Start

### Prerequisites

- **Node.js** 20.19.0 or higher (specified in `package.json`)
- **npm** (comes with Node.js)

### Installation

```bash
# Clone repository
git clone https://github.com/AlonBilman/app-graph-reachability.git
cd app-graph-reachability

# Install dependencies
npm install

# Run in development mode
npm run dev

# Or build and run in production
npm run build
npm start
```

Server runs on `http://localhost:3000`

### Quick Test

```bash
# 1. Load the sample call graph
curl -X POST http://localhost:3000/graph \
  -H "Content-Type: application/json" \
  --data-binary @sample-graph.json

# 2. Load sample vulnerabilities
curl -X POST http://localhost:3000/vulns \
  -H "Content-Type: application/json" \
  --data-binary @sample-vulns.json

# 3. Get prioritized risks
curl http://localhost:3000/risks

# 4. Trace a specific vulnerability
curl http://localhost:3000/vulns/CVE-2024-001/trace
```

---

## 📡 API Endpoints

### Graph Management

#### `POST /graph`

Load an application call graph.

**Request:**

```json
{
  "functions": [
    { "id": "F_main", "name": "main", "is_entrypoint": true },
    { "id": "F_auth", "name": "authenticate", "is_entrypoint": false }
  ],
  "edges": [{ "from": "F_main", "to": "F_auth" }]
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "ok": true,
    "functions": 32,
    "edges": 45,
    "entry_points": 7
  }
}
```

#### `GET /graph`

Retrieve the current loaded graph.

---

### Vulnerability Management

#### `POST /vulns`

Load vulnerabilities for functions in the graph.

**Request:**

```json
[
  {
    "id": "CVE-2024-001",
    "func_id": "F_sql_builder",
    "severity": "critical",
    "cwe_id": "CWE-089",
    "package_name": "sql-query-builder",
    "introduced_by_ai": false
  }
]
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "ok": true,
    "vulnerabilities_loaded": 10
  }
}
```

#### `GET /vulns`

Retrieve all loaded vulnerabilities.

---

### Risk Analysis

#### `GET /risks`

Get prioritized vulnerability list with reachability and risk scores.

**Query Parameters:**

- `min_severity` — Filter by severity (`low`, `medium`, `high`, `critical`)
- `limit` — Max results (default: 50)
- `reachable_only` — Only show reachable vulnerabilities (default: `true`)

**Example:**

```bash
curl "http://localhost:3000/risks?min_severity=high&limit=10"
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "risks": [
      {
        "id": "CVE-2024-001",
        "function_id": "F_sql_builder",
        "function_name": "SqlBuilder.buildQuery",
        "severity": "critical",
        "cwe": "CWE-089",
        "reachable": true,
        "score": 12,
        "score_breakdown": {
          "base_severity": 8,
          "reachability_bonus": 3,
          "package_risk": 1,
          "ai_risk": 0
        },
        "metadata": {
          "package_name": "sql-query-builder",
          "introduced_by_ai": false
        }
      }
    ]
  }
}
```

---

### Tracing

#### `GET /functions/:id/trace`

Find all paths from entry points to a specific function.

**Query Parameters:**

- `all_paths` — Return all paths instead of just shortest (default: `false`)
- `limit` — Max paths to return (default: 10)

**Example:**

```bash
curl "http://localhost:3000/functions/F_sql_builder/trace?all_paths=true&limit=5"
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "function_id": "F_sql_builder",
    "reachable": true,
    "all_paths": [
      ["F_users_list", "F_query_parser", "F_sql_builder"],
      ["F_users_list", "F_user_service_list", "F_db_user_list", "F_sql_builder"]
    ],
    "shortest_path_length": 3,
    "total_paths": 8
  }
}
```

#### `GET /vulns/:id/trace`

Trace a vulnerability with risk score and paths.

**Query Parameters:**

- `all_paths` — Return all paths instead of just shortest (default: `false`)
- `limit` — Max paths to return (default: 10)

**Response includes:** `vulnerability_id`, `severity`, `score`, plus all trace data.

---

### Analytics

#### `GET /analytics/components`

Analyze connected components and identify isolated code.

**Response:**

```json
{
  "ok": true,
  "data": {
    "total_components": 2,
    "main_component": {
      "size": 31,
      "entry_points": 7,
      "vulnerabilities": 9
    },
    "isolated_components": [
      {
        "functions": ["F_unused_lib"],
        "vulnerabilities": ["CVE-2024-999"],
        "risk_level": "low"
      }
    ],
    "security_impact": {
      "reachable_vulnerabilities": 8,
      "isolated_vulnerabilities": 1,
      "dead_code_functions": 2,
      "main_component_coverage": 97
    }
  }
}
```

#### `GET /analytics/attack-paths`

Find critical attack paths with exploit difficulty assessment.

**Query Parameters:**

- `max_paths` — Maximum paths to return (default: 10)
- `min_severity` — Minimum severity (default: `high`)
- `max_path_length` — Filter by path length

**Response:**

```json
{
  "ok": true,
  "data": {
    "critical_paths": [
      {
        "vulnerability_id": "CVE-2024-001",
        "severity": "critical",
        "path": ["F_main", "F_auth", "F_sql_builder"],
        "path_length": 3,
        "risk_score": 12,
        "exploit_difficulty": "low",
        "total_paths": 8,
        "entry_point_accessible": true
      }
    ],
    "summary": {
      "total_critical_paths": 15,
      "shortest_path_length": 2,
      "most_vulnerable_entry_point": "F_users_list",
      "average_path_length": 3.2
    },
    "generated_at": "2025-10-16T..."
  }
}
```

---

### Health Check

#### `GET /health`

Service health status.

---

## Error Handling

All errors return a standardized JSON response:

```json
{
  "ok": false,
  "error": {
    "message": "Validation failed: missing required field",
    "code": "VALIDATION_ERROR"
  }
}
```

---

## Architecture

### Directory Structure

```
src/
├── app.ts                      # Express app factory
├── server.ts                   # HTTP server entry point
├── store.ts                    # In-memory graph store
│
├── controllers/                # HTTP request handlers
│   ├── graph.controller.ts     # POST/GET /graph
│   ├── vulns.controller.ts     # POST/GET /vulns
│   ├── risks.controller.ts     # GET /risks
│   ├── trace.controller.ts     # GET /functions/:id/trace, /vulns/:id/trace
│   └── analytics.controller.ts # GET /analytics/*
│
├── services/                   # Business logic layer
│   ├── reachability.ts         # BFS path-finding algorithms
│   ├── scoring.ts              # Risk scoring calculations
│   ├── analytics.ts            # Component & attack path analysis
│   └── graph-utils.ts          # Graph algorithms (BFS, DFS, cycles)
│
├── middleware/                 # Express middleware
│   ├── validate.ts             # Zod schema validation (body, query, params)
│   └── errors.ts               # Centralized error handling
│
├── routes/                     # Route definitions
│   ├── index.ts                # Main router aggregation
│   ├── graph.routes.ts         # Graph endpoints
│   ├── vulns.routes.ts         # Vulnerability endpoints
│   ├── risks.routes.ts         # Risk analysis endpoints
│   ├── trace.routes.ts         # Tracing endpoints
│   ├── analytics.routes.ts     # Analytics endpoints
│   └── health.routes.ts        # Health check endpoint
│
├── schemas/                    # Zod validation schemas
│   ├── common.ts               # Shared schemas (Severity)
│   ├── graph.schema.ts         # Graph DTOs + validation
│   ├── vulns.schema.ts         # Vulnerability DTOs + validation
│   ├── risks.schema.ts         # Risk query schemas
│   ├── trace.schema.ts         # Trace query schemas
│   └── analytics.schema.ts     # Analytics query schemas
│
├── types/                      # TypeScript type definitions
│   ├── domain.types.ts         # Core business domain types
│   └── dto.types.ts            # API request/response DTOs
│
├── utils/                      # Utility functions
│   ├── dto.mapper.ts           # DTO ↔ Domain object conversions
│   └── response.helper.ts      # Standardized HTTP responses
│
└── errors/                     # Custom error classes
    └── api-error.ts            # ApiError, ValidationError, NotFoundError, etc.
```

### Request/Response Flow

```
1. HTTP Request
   ↓
2. Zod Schema Validation (middleware)
   ↓
3. Controller (typed request)
   ↓
4. Service Layer (business logic)
   ↓
5. Store (data access)
   ↓
6. DTO Mapper (domain → DTO)
   ↓
7. Response Helper (standardized JSON)
   ↓
8. HTTP Response
```

### Key Design Patterns

- **DTO Pattern** — Separate API types (`dto.types.ts`) from domain types (`domain.types.ts`)
- **Repository Pattern** — `Store` class abstracts data access, could swap implementations
- **Middleware Pipeline** — Request validation → Controller → Service → Response
- **Service Layer** — Pure business logic, no HTTP/Express dependencies
- **Factory Pattern** — `createApp()` function for testable app creation
- **Mapper Pattern** — `DTOMapper` converts between API and domain objects
- **Response Helper** — Standardized JSON responses with `ok` flag and `data` wrapper

---

## Testing

### Run All Tests

```bash
npm test
```

### Test Suites

- **Unit Tests** — Service functions, algorithms, graph utilities
- **Integration Tests** — Controller logic with mocked requests
- **Performance Tests** — Algorithm benchmarks and optimization checks

```
✓ test/reachability.test.ts     (7 tests)   — Path-finding algorithms
✓ test/graph-utils.test.ts      (14 tests)  — BFS, DFS, cycle detection
✓ test/analytics.test.ts        (16 tests)  — Component & attack analysis
✓ test/performance.test.ts      (2 tests)   — Algorithm performance
✓ test/controllers-validation.test.ts (11 tests) — Input validation

Test Files: 5 passed (5)
Tests: 50 passed (50)
Duration: ~900ms
```

### Watch Mode

Run tests in watch mode during development:

```bash
vitest
```

### API Testing with curl

See [`sample-commands.txt`](sample-commands.txt) for a full list of example commands.

---

## Dependencies

### Production

- **express** `^5.1.0` — Modern web framework
- **zod** `^4.1.11` — Schema validation and type inference

### Development

- **typescript** `^5.9.2` — Type safety and modern JS features
- **vitest** `^3.2.4` — Fast unit testing framework
- **tsx** `^4.20.5` — TypeScript execution and hot reload
- **prettier** `^3.6.2` — Code formatting

---

## License

MIT License — see [LICENSE](LICENSE) file for details

---

## Notice

This project is free to use, modify, and steal. No restrictions, no warranty, no problem. Enjoy!

---
