# Test Harness: Legacy ↔ Modern Equivalence Testing

## Purpose

This test harness validates that the modernized Java system produces functionally equivalent results to the legacy Oracle Forms/PL/SQL system. It captures the legacy system's behavior as executable specifications and runs them against both implementations.

## How It Works

1. **Scenario Definition** (YAML): Business scenarios describe inputs and expected outputs
2. **Legacy Execution**: Scenarios run against the PL/SQL packages (via SQL*Plus or JDBC)
3. **Modern Execution**: Same scenarios run against the Java REST API
4. **Comparison**: Results are compared field-by-field with configurable tolerances

## Running Tests

```bash
# Install dependencies
pip install -r requirements.txt

# Run all scenarios against legacy system (captures baseline)
python run_scenarios.py --target legacy --config config.yaml

# Run all scenarios against modern system
python run_scenarios.py --target modern --config config.yaml

# Compare results
python comparators/result-comparator.py --legacy results/legacy/ --modern results/modern/
```

## Scenario Structure

```yaml
name: employee-crud
description: Employee create, read, update, delete operations
steps:
  - action: create_employee
    input:
      first_name: "TEST"
      last_name: "EMPLOYEE"
      email: "test.employee@company.com"
      hire_date: "2024-01-15"
      dept_id: 30
      job_id: 50
    expect:
      emp_number: "EMP-*"        # Wildcard: any valid emp number
      employment_status: "ACTIVE"
      active_flag: "Y"
```

## Comparison Tolerances

- **Exact match**: Status fields, codes, flags
- **Numeric tolerance**: Salary calculations (±$0.01 for rounding differences)
- **Date tolerance**: Timestamps (±1 second for clock differences)
- **Wildcard**: Auto-generated IDs, employee numbers
