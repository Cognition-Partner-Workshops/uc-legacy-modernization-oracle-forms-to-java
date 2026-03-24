#!/usr/bin/env python3
"""
Result Comparator — Legacy vs Modern System Output Comparison

Compares the outputs of business scenarios executed against both the legacy
Oracle Forms/PL/SQL system and the modernized Java Spring Boot system.

Usage:
    python result-comparator.py --legacy results/legacy/ --modern results/modern/
"""

import argparse
import json
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import Any


@dataclass
class ComparisonResult:
    scenario: str
    step: str
    field: str
    legacy_value: Any
    modern_value: Any
    status: str  # MATCH, MISMATCH, TOLERANCE, WILDCARD
    tolerance: float = 0.0


def compare_values(legacy, modern, tolerance=0.0, wildcard=False) -> str:
    """Compare two values with optional tolerance or wildcard matching."""
    if wildcard and isinstance(legacy, str) and "*" in legacy:
        return "WILDCARD"

    if isinstance(legacy, (int, float)) and isinstance(modern, (int, float)):
        if abs(legacy - modern) <= tolerance:
            return "MATCH" if legacy == modern else "TOLERANCE"
        return "MISMATCH"

    if str(legacy) == str(modern):
        return "MATCH"

    return "MISMATCH"


def compare_scenario(legacy_file: Path, modern_file: Path) -> list[ComparisonResult]:
    """Compare results from a single scenario."""
    results = []

    with open(legacy_file) as f:
        legacy_data = json.load(f)
    with open(modern_file) as f:
        modern_data = json.load(f)

    scenario_name = legacy_data.get("name", legacy_file.stem)

    for legacy_step, modern_step in zip(
        legacy_data.get("steps", []),
        modern_data.get("steps", [])
    ):
        step_name = legacy_step.get("name", "unknown")
        tolerance_config = legacy_step.get("tolerance", {})

        legacy_output = legacy_step.get("output", {})
        modern_output = modern_step.get("output", {})

        all_fields = set(legacy_output.keys()) | set(modern_output.keys())

        for field in sorted(all_fields):
            l_val = legacy_output.get(field)
            m_val = modern_output.get(field)
            tol = tolerance_config.get(field, 0.0)

            status = compare_values(l_val, m_val, tolerance=tol)

            results.append(ComparisonResult(
                scenario=scenario_name,
                step=step_name,
                field=field,
                legacy_value=l_val,
                modern_value=m_val,
                status=status,
                tolerance=tol
            ))

    return results


def main():
    parser = argparse.ArgumentParser(description="Compare legacy vs modern system outputs")
    parser.add_argument("--legacy", required=True, help="Directory with legacy results")
    parser.add_argument("--modern", required=True, help="Directory with modern results")
    parser.add_argument("--output", default="comparison-report.json", help="Output report file")
    args = parser.parse_args()

    legacy_dir = Path(args.legacy)
    modern_dir = Path(args.modern)

    all_results = []
    mismatches = 0
    total = 0

    for legacy_file in sorted(legacy_dir.glob("*.json")):
        modern_file = modern_dir / legacy_file.name
        if not modern_file.exists():
            print(f"WARNING: No modern result for {legacy_file.name}")
            continue

        results = compare_scenario(legacy_file, modern_file)
        all_results.extend(results)

        for r in results:
            total += 1
            if r.status == "MISMATCH":
                mismatches += 1
                print(f"MISMATCH: {r.scenario}/{r.step}/{r.field}: "
                      f"legacy={r.legacy_value} modern={r.modern_value}")

    # Summary
    matches = sum(1 for r in all_results if r.status in ("MATCH", "TOLERANCE", "WILDCARD"))
    print(f"\n{'='*60}")
    print(f"Comparison complete: {total} fields checked")
    print(f"  Matches:    {matches}")
    print(f"  Mismatches: {mismatches}")
    print(f"  Pass rate:  {matches/total*100:.1f}%" if total > 0 else "  No data")

    # Write detailed report
    report = {
        "summary": {"total": total, "matches": matches, "mismatches": mismatches},
        "details": [
            {
                "scenario": r.scenario, "step": r.step, "field": r.field,
                "legacy": r.legacy_value, "modern": r.modern_value,
                "status": r.status
            }
            for r in all_results
        ]
    }
    with open(args.output, "w") as f:
        json.dump(report, f, indent=2, default=str)

    print(f"Detailed report: {args.output}")

    sys.exit(1 if mismatches > 0 else 0)


if __name__ == "__main__":
    main()
