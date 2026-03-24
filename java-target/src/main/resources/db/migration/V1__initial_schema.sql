-- Flyway migration V1: Initial schema
-- This migration creates the same table structure as the legacy Oracle Forms HRMS
-- See: ts-plsql-oracle-forms-legacy-codebase/schema/tables/

-- For Oracle DB: This migration is a no-op if tables already exist
-- For PostgreSQL: This creates the full schema from scratch

-- Placeholder: In a real migration, this would contain the full DDL
-- from 01_core_tables.sql through 04_performance_tables.sql
-- adapted for the target database platform.

-- Example: Employee table (portable SQL)
-- CREATE TABLE IF NOT EXISTS EMPLOYEES (
--     EMP_ID          BIGINT PRIMARY KEY,
--     EMP_NUMBER      VARCHAR(20) NOT NULL UNIQUE,
--     FIRST_NAME      VARCHAR(50) NOT NULL,
--     LAST_NAME       VARCHAR(50) NOT NULL,
--     ...
-- );
