# Graph Reachability Security Analysis API

## Overview

Build a TypeScript backend service that analyzes call graphs to identify which security vulnerabilities are actually reachable from application entry points. This is a core security prioritization problem - helping development teams focus on vulnerabilities that can actually be exploited.

## The Problem

Security scanners often find hundreds of vulnerabilities in large codebases, but many are unreachable from user-facing entry points. Your API will:

1. Ingest program call graphs and vulnerability data
2. Compute reachability from public endpoints to vulnerable functions
3. Score and prioritize vulnerabilities based on reachability, severity, and other factors
4. Return actionable results with separate endpoints for vulnerability data and exploit paths

## Core Concepts

### Call Graph

- **Nodes**: Functions in the codebase (like `login()`, `validateUser()`, `hashPassword()`)
- **Edges**: Function calls (A → B means "A calls B directly")
- **Entry Points**: Functions that external users can trigger (HTTP handlers like `POST /login`, scheduled jobs, message queue consumers)
- **Reachability**: Can you walk the call chain from any entry point to reach a vulnerable function?

**Example**: If `loginHandler()` calls `validateUser()` which calls `parseJWT()`, and `parseJWT()` has a vulnerability, then that vulnerability is reachable from the login endpoint.

### Connected Components

A **connected component** in a graph is a group of nodes where you can reach any node from any other node by following edges (ignoring direction). In call graphs:

- **Single component**: All functions are somehow connected (typical in well-structured apps)
- **Multiple components**: Isolated clusters of functions that don't call each other
  - Main application logic (entry points → business logic → data layer)
  - Isolated utility functions
  - Dead code that's never called
  - Third-party libraries with internal calls only

**Why it matters**: Vulnerabilities in disconnected components are unreachable and lower priority.

### Vulnerability Scoring (Simplified)

Priority score combines these factors:

- **Base severity**: CRITICAL(8) > HIGH(6) > MEDIUM(3) > LOW(1)
- **Reachability bonus**: +3 if reachable from entry points (this is the key factor!)
- **AI risk**: +2 if `introduced_by_ai: true` (newer, potentially less tested code)
- **Package risk**: +1 if `package_name` exists (external dependency = supply chain risk)

**No path penalty**: All reachable vulnerabilities are equally concerning regardless of exploit chain length.

## API Specification

### Core Endpoints

#### `POST /graph`

Load the application's call graph into memory.

**Request Body:**

```json
{
  "functions": [
    { "id": "F_http", "name": "GET /users", "isEntrypoint": true },
    { "id": "F_svc", "name": "UserService.list", "isEntrypoint": false },
    { "id": "F_lib", "name": "lib/parseQuery", "isEntrypoint": false },
    { "id": "F_isolated", "name": "utils.oldFunction", "isEntrypoint": false }
  ],
  "edges": [
    { "from": "F_http", "to": "F_svc" },
    { "from": "F_svc", "to": "F_lib" }
  ]
}
```

**Response:**

```json
{
  "ok": true,
  "functions": 4,
  "edges": 2,
  "entry_points": 1
}
```

#### `POST /vulns`

Load vulnerability data into memory.

**Request Body:**

```json
[
  {
    "id": "V1",
    "funcId": "F_lib",
    "severity": "high",
    "cweId": "CWE-079",
    "package_name": "query-parser",
    "introduced_by_ai": false
  },
  {
    "id": "V2",
    "funcId": "F_isolated",
    "severity": "critical",
    "cweId": "CWE-078",
    "introduced_by_ai": true
  }
]
```

**Response:**

```json
{
  "ok": true,
  "vulnerabilities_loaded": 2
}
```

#### `GET /risks`

Get prioritized list of vulnerabilities **without path information**.

**Query Parameters:**

- `min_severity`: Filter by minimum severity (low|medium|high|critical)
- `limit`: Maximum results to return (default: 50)
- `reachable_only`: Only return reachable vulnerabilities (default: true)

**Response:**

```json
{
  "risks": [
    {
      "id": "V1",
      "function_id": "F_lib",
      "function_name": "lib/parseQuery",
      "severity": "high",
      "cwe": "CWE-079",
      "reachable": true,
      "score": 10.0,
      "score_breakdown": {
        "base_severity": 6,
        "reachability_bonus": 3,
        "package_risk": 1,
        "ai_risk": 0
      },
      "metadata": {
        "package_name": "query-parser",
        "introduced_by_ai": false
      }
    }
  ]
}
```

**Field Notes:**

- `cwe`: CWE identifier if available, omitted if not provided

**With unreachable vulnerabilities (`?reachable_only=false`):**

```json
{
  "risks": [
    {
      "id": "V1",
      "function_id": "F_lib",
      "severity": "high",
      "cwe": "CWE-079",
      "reachable": true,
      "score": 10.0,
      "score_breakdown": {
        "base_severity": 6,
        "reachability_bonus": 3,
        "package_risk": 1,
        "ai_risk": 0
      }
    },
    {
      "id": "V2",
      "function_id": "F_isolated",
      "severity": "critical",
      "cwe": "CWE-078",
      "reachable": false,
      "score": 10.0,
      "score_breakdown": {
        "base_severity": 8,
        "reachability_bonus": 0,
        "package_risk": 0,
        "ai_risk": 2
      }
    }
  ]
}
```

#### `GET /functions/:id/trace`

Get path information for a specific function.

**Query Parameters:**

- `all_paths`: Return all paths instead of just shortest (default: false)
- `limit`: Maximum paths to return when all_paths=true (default: 10)

**Response for shortest path (default):**

```json
{
  "function_id": "F_lib",
  "reachable": true,
  "shortest_path": ["F_http", "F_svc", "F_lib"],
  "path_length": 3,
  "total_paths_available": 1
}
```

**Response with all paths (`?all_paths=true`):**

```json
{
  "function_id": "F_lib",
  "reachable": true,
  "all_paths": [["F_http", "F_svc", "F_lib"]],
  "shortest_path_length": 3,
  "total_paths": 1
}
```

**Response (unreachable function):**

```json
{
  "function_id": "F_isolated",
  "reachable": false
}
```

### Convenience Endpoint

#### `GET /vulns/:id/trace`

Get path information for a specific vulnerability (convenience endpoint that looks up the function for you).

**Response:**

```json
{
  "vulnerability_id": "V1",
  "function_id": "F_lib",
  "reachable": true,
  "shortest_path": ["F_http", "F_svc", "F_lib"],
  "path_length": 3,
  "severity": "high",
  "score": 10.0
}
```

**Response (unreachable vulnerability):**

```json
{
  "vulnerability_id": "V2",
  "function_id": "F_isolated",
  "reachable": false,
  "error": "No path exists from entry points to this function",
  "severity": "critical",
  "score": 10.0
}
```

## Sample Data Integration

Based on your sample files, the expected API behavior:

**After `POST /graph` with sample-graph.json:**

- 32 functions loaded (all F\_\* functions)
- Multiple edges loaded
- 7 entry points (F_auth_login, F_auth_register, F_users_list, etc.)

**After `POST /vulns` with sample-vulns.json:**

- 10 vulnerabilities loaded
- Multiple reachable (CVE-2024-001 in F_sql_builder, etc.)
- Some unreachable (CVE-2024-006 in F_deprecated_utils, etc.)

**`GET /risks` returns:**

- Only reachable vulnerabilities by default (reachable_only=true)
- Sorted by score (critical reachable vulnerabilities first)
- Each vulnerability includes score breakdown

**`GET /functions/F_sql_builder/trace` returns:**

- Path from entry points through query parsing chain
- Shows how SQL injection vulnerability is reachable

**`GET /vulns/CVE-2024-001/trace` returns:**

- Same path as F_sql_builder trace but includes vulnerability metadata

## Key Design Principles

### Separation of Concerns

- **`/risks` endpoint**: Focus on vulnerability assessment and prioritization (NO paths)
- **`/trace` endpoints**: Focus on reachability analysis and path discovery (WITH paths)
- **Clean separation**: Vulnerability data vs. path analysis

### Query Parameters

- Support filtering by severity level
- Support pagination with limits
- Support showing unreachable vulnerabilities when needed
- Support multiple path analysis options

### Response Consistency

- All endpoints return JSON
- Consistent error format across all endpoints
- Clear status codes (200, 404, 400, 500)
- Structured error messages with meaningful details

## Technical Requirements

### Data Validation

- Validate all input schemas with detailed error messages using Zod
- Ensure function IDs in edges exist in the functions array
- Check that vulnerability funcIds reference existing functions
- Prevent duplicate function IDs or vulnerability IDs

### Performance Optimizations

- Cache reachability computations (BFS results)
- Implement request rate limiting
- Add query result pagination
- Support graph updates without full reload

### Security Features

- Input sanitization and size limits
- Request authentication (API key based)
- Audit logging for graph and vulnerability updates
- Data export capabilities (JSON/CSV)

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with type-safe routing
- **Validation**: Zod schemas for request/response validation
- **Testing**: Vitest for unit and integration tests
- **Development**: Hot reload with tsx

## Key Algorithms

- **Reachability**: Breadth-First Search (BFS) from all entry points
- **Shortest Path**: BFS with path reconstruction
- **Component Analysis**: Connected component detection using DFS
- **Scoring**: Base severity + reachability bonus + AI risk + package risk
- **Caching**: Memoized BFS results with invalidation on graph changes

## Acceptance Criteria

### Functional Requirements

✅ Load call graphs and validate structure  
✅ Load vulnerabilities and check function references  
✅ Compute reachability using BFS algorithm  
✅ Score vulnerabilities with simplified multi-factor formula  
✅ Return sorted vulnerability results by risk score (no paths in /risks)  
✅ Provide exploit paths via separate trace endpoints  
✅ Handle unreachable vulnerabilities gracefully  
✅ Support filtering and pagination  
✅ Analyze connected components and isolated functions

## Simple Test Flow

```bash
# load graph
POST /graph with sample-graph.json

# load vulnerabilities
POST /vulns with sample-vulns.json

# get reachable risks (should return only reachable vulnerabilities, no paths)
GET /risks

# get all risks including unreachable (should return all vulnerabilities, no paths)
GET /risks?reachable_only=false

# get trace for reachable function (with path)
GET /functions/F_sql_builder/trace

# get trace for unreachable function (should return reachable: false)
GET /functions/F_deprecated_utils/trace

# get trace for vulnerability (convenience endpoint, with path)
GET /vulns/CVE-2024-001/trace
```

This design cleanly separates vulnerability assessment (`/risks`) from path analysis (`/trace`), making the API focused and easy to use for different security analysis workflows.
