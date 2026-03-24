package com.hrms.employee;

import java.util.List;

/**
 * Org chart tree node
 * Replaces: VW_ORG_HIERARCHY (CONNECT BY PRIOR)
 * Uses recursive CTE or in-memory tree building for better performance
 */
public record OrgChartNode(
    Long empId,
    String empNumber,
    String empName,
    String jobTitle,
    String deptName,
    int level,
    List<OrgChartNode> directReports
) {}
