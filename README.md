# Graph Reachability Security Analysis API

A TypeScript backend service that analyzes application call graphs to identify and prioritize security vulnerabilities based on their reachability from entry points. This tool helps security teams focus on vulnerabilities that are actually exploitable in their running applications, rather than all detected vulnerabilities.

## Features

- **Reachability Analysis** - Traces paths from entry points to vulnerable functions
- **Risk Scoring** - Prioritizes vulnerabilities by severity, reachability, and source
- **Component Analysis** - Identifies isolated code and dead functions
- **Attack Path Mapping** - Visualizes potential exploitation routes
- **Performance Optimized** - Handles 1,000+ function graphs in <300ms

## Quick Start

```bash
npm install
npm run dev
```

Server runs on `http://localhost:3000`

## API Endpoints

### Load Data

**`POST /graph`** - Load call graph

```json
{
  "functions": [
    { "id": "F1", "name": "handler", "isEntrypoint": true },
    { "id": "F2", "name": "service", "isEntrypoint": false }
  ],
  "edges": [{ "from": "F1", "to": "F2" }]
}
```

**`POST /vulns`** - Load vulnerabilities

```json
[
  {
    "id": "CVE-2024-001",
    "func_id": "F2",
    "severity": "critical",
    "cwe_id": "CWE-089",
    "package_name": "sql-lib",
    "introduced_by_ai": false
  }
]
```

### Query Vulnerabilities

**`GET /risks`** - List prioritized vulnerabilities

Query params:

- `min_severity` - Filter by severity (low|medium|high|critical)
- `limit` - Max results (default: 50)
- `reachable_only` - Only reachable vulnerabilities (default: true)

Response:

```json
{
  "risks": [
    {
      "id": "CVE-2024-001",
      "function_id": "F2",
      "function_name": "service",
      "severity": "critical",
      "reachable": true,
      "score": 12.0,
      "score_breakdown": {
        "base_severity": 8,
        "reachability_bonus": 3,
        "package_risk": 1,
        "ai_risk": 0
      }
    }
  ]
}
```

### Trace Paths

**`GET /functions/:id/trace`** - Get paths to function

Query params:

- `all_paths` - Return all paths vs shortest (default: false)
- `limit` - Max paths when all_paths=true (default: 10)

Response (shortest):

```json
{
  "function_id": "F2",
  "reachable": true,
  "shortest_path": ["F1", "F2"],
  "path_length": 2,
  "total_paths_available": 1
}
```

**`GET /vulns/:id/trace`** - Get paths to vulnerability

Includes vulnerability metadata + path information

### Analytics

**`GET /analytics/components`** - Connected component analysis

```json
{
  "total_components": 2,
  "main_component": {
    "size": 28,
    "entry_points": 7,
    "vulnerabilities": 8
  },
  "isolated_components": [
    {
      "functions": ["F_deprecated"],
      "vulnerabilities": ["CVE-2024-006"],
      "risk_level": "critical"
    }
  ],
  "security_impact": {
    "reachable_vulnerabilities": 8,
    "isolated_vulnerabilities": 2,
    "dead_code_functions": 3,
    "main_component_coverage": 87
  }
}
```

**`GET /analytics/attack-paths`** - Critical vulnerability paths

Query params:

- `max_paths` - Max paths per vulnerability (default: 10)
- `min_severity` - Minimum severity (default: high)
- `max_path_length` - Filter by path length

Response:

```json
{
  "critical_paths": [
    {
      "vulnerability_id": "CVE-2024-001",
      "severity": "critical",
      "path": ["F_http", "F_service", "F_vulnerable"],
      "path_length": 3,
      "risk_score": 12.0,
      "exploit_difficulty": "low",
      "entry_point_accessible": true
    }
  ],
  "summary": {
    "total_critical_paths": 8,
    "shortest_path_length": 2,
    "most_vulnerable_entry_point": "F_http",
    "average_path_length": 3
  }
}
```

**`GET /health`** - Service health check

## Example Workflow

```bash
# Load sample data
curl -X POST http://localhost:3000/graph \
  -H "Content-Type: application/json" \
  -d @sample-graph.json

curl -X POST http://localhost:3000/vulns \
  -H "Content-Type: application/json" \
  -d @sample-vulns.json

# Get reachable vulnerabilities
curl http://localhost:3000/risks

# Analyze attack paths
curl http://localhost:3000/analytics/attack-paths

# Trace specific vulnerability
curl http://localhost:3000/vulns/CVE-2024-001/trace
```

## Scoring System

**Base Severity:**

- Critical: 8 points
- High: 6 points
- Medium: 3 points
- Low: 1 point

**Bonuses:**

- Reachability: +3 points
- External package: +1 point
- AI-introduced: +2 points

## Architecture

- **Store** (`src/store.ts`) - In-memory graph representation
- **Reachability** (`src/services/reachability.ts`) - BFS path finding
- **Analytics** (`src/services/analytics.ts`) - Component & attack path analysis
- **Scoring** (`src/services/scoring.ts`) - Risk calculation
- **Graph Utils** (`src/services/graph-utils.ts`) - BFS, DFS, component detection

## Tech Stack

- **Runtime**: Node.js 20.19.0+
- **Language**: TypeScript 5.9
- **Framework**: Express 5.1
- **Validation**: Zod 4.1
- **Testing**: Vitest 3.2
- **Dev Tools**: tsx (hot reload), Prettier

## Development

```bash
npm run dev      # Watch mode with tsx
npm test         # Run Vitest tests
npm run build    # Compile TypeScript
npm start        # Run production build
npm run format   # Format with Prettier
```

## Performance

- Analyzes 1,000+ function graphs in <300ms
- Handles complex branching patterns efficiently
- Caches BFS results per target function
