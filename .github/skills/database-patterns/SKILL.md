---
name: database-patterns
description: "Database design patterns: schema design, migration conventions, indexing strategies, and query optimization. Use when designing schemas, writing migrations, or optimizing queries."
tags:
  - development
  - database
  - schema
  - migration
  - indexing
  - query-optimization
triggers:
  - database design
  - schema design
  - database migration
  - query optimization
  - indexing strategy
---

# Database Patterns Skill

Reference for schema design, migrations, and query optimization.

## WHEN_TO_USE

Apply this skill when designing database schemas, writing migration files, adding indexes, or optimizing slow queries. Use the naming conventions and indexing strategies as a checklist before finalizing schema changes.

## Schema Design Principles

### Naming
- Tables: plural, snake_case (`users`, `order_items`).
- Columns: singular, snake_case (`email`, `created_at`).
- Primary keys: `id` (auto-increment or UUID).
- Foreign keys: `<singular_table>_id` (`user_id`, `order_id`).
- Timestamps: `created_at`, `updated_at`, `deleted_at` (for soft delete).
- Booleans: prefix with `is_` or `has_` (`is_active`, `has_verified_email`).

### Data Types
- Use the most specific type available (e.g., `timestamptz` not `varchar` for dates).
- Use `uuid` for public-facing IDs, `bigint` for internal IDs.
- Use `text` over `varchar(n)` unless a hard length limit is required.
- Store monetary values as `integer` (cents) or `numeric(12,2)`. Never `float`.

### Relationships
- Always define foreign key constraints.
- Use junction tables for many-to-many relationships.
- Add `ON DELETE` behavior explicitly (CASCADE, SET NULL, RESTRICT).

## Migration Conventions

### File Naming
```
YYYYMMDDHHMMSS_description.sql
```
Example: `20260215120000_add_user_email_index.sql`

### Structure
```sql
-- Up migration
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
CREATE INDEX idx_users_phone ON users(phone);

-- Down migration
DROP INDEX IF EXISTS idx_users_phone;
ALTER TABLE users DROP COLUMN IF EXISTS phone;
```

### Rules
- One logical change per migration file.
- Every migration must be reversible (include down script).
- Never modify a migration that has been applied to production.
- Test migrations on a copy of production data before deploying.

## Indexing Strategies

### When to Index
- Columns used in WHERE clauses.
- Columns used in JOIN conditions.
- Columns used in ORDER BY.
- Foreign key columns.

### When NOT to Index
- Tables with < 1000 rows (full scan is faster).
- Columns with very low cardinality (e.g., boolean with 50/50 distribution).
- Columns that are rarely queried.

### Index Types
| Type | Use Case |
|------|----------|
| B-tree (default) | Equality, range queries, sorting |
| Hash | Equality only (faster than B-tree for exact match) |
| GIN | Full-text search, JSONB, array contains |
| GiST | Geospatial, range types |
| Partial | Subset of rows (`WHERE is_active = true`) |
| Composite | Multi-column queries (leftmost prefix rule applies) |

## Query Optimization

### Common Anti-Patterns
| Problem | Fix |
|---------|-----|
| SELECT * | Select only needed columns |
| Query inside loop (N+1) | JOIN or batch query |
| Missing LIMIT on large tables | Add LIMIT and pagination |
| String matching with leading wildcard (`LIKE '%term'`) | Use full-text search index |
| Sorting without index | Add index on ORDER BY column |
| Implicit type casting in WHERE | Use matching types |

### EXPLAIN Analysis
```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

Look for:
- **Seq Scan** on large tables — add an index.
- **Nested Loop** with large outer table — consider hash join.
- **Sort** without index — add index on sort column.
- High **actual rows** vs **estimated rows** — run ANALYZE to update statistics.
