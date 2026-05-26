# Schema Explanation – Order Ingestion Service

## Overview

This schema supports an Order Ingestion Service built with:

- MySQL
- Express.js
- Node.js
- REST APIs
- CLI automation

The system simulates how backend services ingest order data from an external API, persist the data in a relational database, and track synchronization operations for observability and debugging.

The database is designed to support:

- order storage
- synchronization tracking
- duplicate prevention
- relational integrity
- efficient querying
- backend automation
- multi-database synchronization

---

# 1. Orders Table

## Purpose

The `orders` table stores all synchronized order data received from the simulated external API.

Each record represents a single customer order.

Orders may originate from:

- simulated external APIs
- manual CLI ingestion
- REST API requests

---

## Key Fields

| Field | Purpose |
|---|---|
| `id` | Internal primary key for each order |
| `external_id` | Unique identifier from the external system |
| `customer_name` | Name of the customer |
| `amount` | Monetary value of the order |
| `status` | Current order state |
| `sync_run_id` | References the synchronization run responsible for ingestion |
| `created_at` | Timestamp when order was created |
| `updated_at` | Timestamp when order was last updated |

---

## Key Design Decisions

### Unique External ID

```sql
external_id UNIQUE
```

The external ID is unique to support idempotency and prevent duplicate order insertion during repeated synchronization runs.

This ensures the same external order cannot be inserted multiple times.

---

### ENUM Status Values

```sql
ENUM('pending', 'completed', 'failed')
```

This restricts status values to valid business states and improves data consistency.

---

### Financial Precision

```sql
DECIMAL(10,2)
```

Used for accurate monetary storage while avoiding floating-point precision issues.

This is important when handling financial transactions.

---

### Foreign Key Relationship

```sql
FOREIGN KEY (sync_run_id)
REFERENCES sync_runs(id)
```

This establishes a relationship between orders and synchronization runs.

It allows the system to track which synchronization operation inserted specific orders.

---

# 2. Sync Runs Table

## Purpose

The `sync_runs` table tracks each synchronization attempt performed by the ingestion service.

This improves observability and enables debugging of ingestion workflows.

---

## Key Fields

| Field | Purpose |
|---|---|
| `id` | Primary key for synchronization runs |
| `started_at` | Timestamp when sync operation began |
| `finished_at` | Timestamp when sync operation completed |
| `status` | Current sync state |
| `error_message` | Stores failure/debugging information |

---

## Key Design Decisions

### Sync Tracking

Each synchronization operation is stored independently.

This allows:

- traceability
- debugging
- monitoring
- retry support
- operational visibility

---

### ENUM Status Values

```sql
ENUM('success', 'failed', 'running')
```

Ensures synchronization states remain valid and predictable.

---

# 3. Indexing Strategy

## Orders External ID Index

```sql
CREATE INDEX idx_orders_external_id
ON orders(external_id);
```

Improves lookup speed for:

- order synchronization
- duplicate detection
- external ID searches

This becomes important as database size grows.

---

## Sync Run Status Index

```sql
CREATE INDEX idx_sync_runs_status
ON sync_runs(status);
```

Optimizes filtering and querying synchronization operations by status.

Useful for monitoring backend workflows.

---

# 4. Backend Integration

The schema integrates with an Express backend service that exposes REST API endpoints.

The backend acts as the orchestration layer between:

- API requests
- synchronization workflows
- database operations

---

# API Endpoints

## GET /orders

Retrieves all synchronized orders from the primary MySQL database.

---

## GET /sync-runs

Retrieves all synchronization runs for monitoring and debugging.

---

## POST /add-order

Allows manual order creation.

Supports:

- Thunder Client API testing
- CLI-based ingestion

---

## POST /sync-orders

Simulates ingestion of external orders by:

1. creating a synchronization run
2. inserting new orders
3. preventing duplicates
4. updating synchronization status

---

## POST /sync-to-second-db

Synchronizes order data from:

```text
order_service
→
order_service_2
```

This simulates backend replication workflows.

---

## GET /orders-db2

Retrieves synchronized orders from the secondary database.

Used for validating successful replication.

---

# 5. CLI Automation Layer

The project also includes command-line automation tools that interact with the backend API.

These tools improve developer experience and simulate internal operational tooling commonly used in backend systems.

---

## add-order-cli.js

This CLI tool allows users to manually create orders directly from the terminal without manually writing JSON requests.

The workflow is:

```text
CLI Input
    ↓
Express REST API
    ↓
MySQL Database
```

The tool:

- prompts the user for order details
- sends API requests automatically
- inserts records into MySQL

This improves usability and reduces repetitive manual API testing.

---

## sync-cli.js

This CLI tool automates synchronization between the primary and secondary databases.

The workflow is:

```text
Primary Database
    ↓
Express Sync Endpoint
    ↓
Secondary Database
```

This simulates backend replication and synchronization workflows.

---

# 6. Multi-Database Synchronization

The project supports synchronization between two independent MySQL databases:

```text
order_service
→
order_service_2
```

The secondary database acts as a replica target for synchronized orders.

This demonstrates:

- backend orchestration
- data replication
- distributed persistence concepts
- synchronization workflows

---

# 7. Overall Architecture

```text
CLI / Thunder Client
        ↓
Express.js Backend
        ↓
Primary MySQL Database
        ↓
Synchronization Layer
        ↓
Secondary MySQL Database
```

---

# 8. Engineering Concepts Demonstrated

This project demonstrates several backend engineering concepts:

- relational schema design
- REST API development
- MySQL integration
- asynchronous processing
- synchronization tracking
- CLI tooling
- duplicate prevention
- indexing strategies
- foreign key relationships
- database replication workflows
- backend orchestration

---

# 9. Outcome

This project evolved from a basic schema design exercise into a more complete backend synchronization system.

The service now supports:

- API-driven ingestion
- synchronization tracking
- CLI-based automation
- multi-database syncing
- operational observability
- relational persistence
- backend workflow orchestration

The architecture reflects foundational backend engineering and database management practices commonly used in real-world systems.
---

# 10. Frontend Dashboard Layer

The project now includes a frontend dashboard built with:

- HTML
- CSS
- Vanilla JavaScript

The frontend communicates directly with the Express REST API layer.

This provides a visual interface for interacting with the synchronization system.

---

# Database Views

The dashboard contains two tabbed database views.

---

## Database 1 View

This view represents the primary ingestion database.

Features include:

- live table view of orders
- modal-based order creation
- API-driven ingestion workflow

The interface connects to:

```text
GET /orders
POST /add-order
```

---

## Database 2 View

This view represents the synchronized replica database.

Features include:

- synchronization trigger button
- live table visualization of replicated records

The interface connects to:

```text
POST /sync-to-second-db
GET /orders-db2
```

---

# Frontend to Backend Data Flow

```text
Frontend Dashboard
        ↓
Express REST API
        ↓
Primary MySQL Database
        ↓
Synchronization Layer
        ↓
Secondary MySQL Database
```

---

# Synchronization Workflow

The synchronization process now demonstrates how backend systems replicate records between databases.

The workflow is:

1. records are inserted into Database 1
2. synchronization endpoint is triggered
3. backend service reads records
4. records are inserted into Database 2
5. replicated data becomes visible in the dashboard

---

# Full-Stack Architecture

The project now demonstrates a lightweight full-stack synchronization platform consisting of:

- frontend dashboard
- REST API layer
- backend orchestration
- relational databases
- synchronization tooling
- CLI automation

---

# Final Outcome

The Order Sync Service evolved from a basic schema exercise into a more complete backend and full-stack synchronization platform.

The system now supports:

- REST API ingestion
- synchronization tracking
- frontend visualization
- database replication
- CLI automation
- operational workflows
- relational persistence

The architecture reflects foundational backend engineering and full-stack development concepts commonly used in real-world systems.