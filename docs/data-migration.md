# Data Migration Approach

## Strategy

Data migration happens independently of application migration. During the Strangler Fig transition period, both systems share the same Oracle database. Full database platform migration (Oracle → PostgreSQL) is a follow-on project.

## Phase 1: Shared Database (During Application Migration)

Both the legacy Oracle Forms application and the new Java application connect to the same Oracle database. This is the simplest approach during the transition period.

**Key considerations:**
- JPA entity mappings must match existing table structures exactly
- Flyway migrations are `validate` only (schema is managed by legacy DDL scripts)
- Both systems can read/write the same data
- Audit columns (CREATED_BY, MODIFIED_BY) will show different user formats

## Phase 2: Database Platform Migration (Post-Application Migration)

After the application migration is complete and the legacy Forms system is decommissioned, the database can be migrated from Oracle to PostgreSQL.

### Oracle → PostgreSQL Type Mapping

| Oracle Type | PostgreSQL Type | Notes |
|---|---|---|
| NUMBER(10) | BIGINT | Employee IDs, foreign keys |
| NUMBER(15,2) | NUMERIC(15,2) | Salary, amounts |
| VARCHAR2(n) | VARCHAR(n) | Direct mapping |
| DATE | TIMESTAMP | Oracle DATE includes time |
| CLOB | TEXT | Audit log details |
| SYSDATE | NOW() | Current timestamp |

### Oracle-Specific SQL to Migrate

| Oracle SQL | PostgreSQL Equivalent |
|---|---|
| `CONNECT BY PRIOR` | `WITH RECURSIVE` CTE |
| `NVL(x, y)` | `COALESCE(x, y)` |
| `DECODE(x, y, z)` | `CASE WHEN x = y THEN z END` |
| `ROWNUM <= n` | `LIMIT n` |
| `sequence.NEXTVAL` | `nextval('sequence')` |
| `DUAL` | (omit FROM clause) |
| `MONTHS_BETWEEN(a, b)` | `EXTRACT(EPOCH FROM a-b) / 2592000` |
| `ADD_MONTHS(d, n)` | `d + INTERVAL 'n months'` |
| `TO_CHAR(d, 'fmt')` | `TO_CHAR(d, 'fmt')` (mostly compatible) |

### Data Migration Steps

1. Export Oracle schema DDL → convert to PostgreSQL DDL
2. Create Flyway migrations for PostgreSQL schema
3. Use `pgloader` or custom ETL to migrate data
4. Validate row counts and checksums
5. Run equivalence test harness against PostgreSQL
6. Update `application.yml` datasource configuration
