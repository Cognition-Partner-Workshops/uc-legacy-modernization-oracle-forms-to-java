# Architecture Decision Log

## ADR-001: Modular Monolith over Microservices

**Status**: Accepted

**Context**: The legacy HRMS is a monolith. We need to decide whether the target architecture should be microservices or a modular monolith.

**Decision**: Start with a modular monolith (single deployable, module boundaries enforced by Java packages and interfaces). Extract to microservices later if needed.

**Rationale**:
- Team has no microservices operational experience
- Modules share a single database — distributed transactions add complexity
- Modular monolith is easier to refactor from a monolith
- Can extract modules to services later when operational maturity increases

---

## ADR-002: Retain Oracle Database Initially

**Status**: Accepted

**Context**: Should we migrate the database platform simultaneously with the application?

**Decision**: Keep Oracle Database 19c during the initial migration. Plan PostgreSQL migration as a follow-on project.

**Rationale**:
- Reduces risk by changing one thing at a time
- Payroll calculations rely on Oracle-specific SQL features
- Data migration can happen independently after application is stable
- JPA abstracts most database differences anyway

---

## ADR-003: Spring Security with JWT for Authentication

**Status**: Accepted

**Context**: Legacy system uses custom session management (PKG_SECURITY) with MD5 password hashing and database-stored sessions.

**Decision**: Replace with Spring Security using JWT tokens, BCrypt password encoding, and role-based access control.

**Rationale**:
- Industry standard, well-documented, actively maintained
- Stateless JWT eliminates session table and timeout issues
- BCrypt resolves the MD5 vulnerability (TD-001)
- Spring Security's `@PreAuthorize` cleanly replaces the custom `has_permission()` function

---

## ADR-004: Spring Batch for Payroll Processing

**Status**: Accepted

**Context**: Legacy payroll uses a cursor loop that commits every 50 employees (TD-011, TD-013), causing partial payroll states on failure.

**Decision**: Use Spring Batch with chunk-oriented processing, skip/retry policies, and full transaction management.

**Rationale**:
- Atomic chunks with proper rollback on failure
- Built-in restart/recovery capabilities
- Parallel processing support for large payrolls
- Job monitoring and execution history

---

## ADR-005: React with TypeScript for Frontend

**Status**: Accepted

**Context**: Oracle Forms provides a thick-client UI via Java applets. We need a modern web frontend.

**Decision**: React with TypeScript, using a component library (Material UI) for rapid development.

**Rationale**:
- Large ecosystem and developer pool (addresses hiring concern)
- TypeScript provides type safety similar to what Forms provided
- Component model maps well to Forms blocks/canvases
- Rich form handling libraries (React Hook Form) support complex data entry
