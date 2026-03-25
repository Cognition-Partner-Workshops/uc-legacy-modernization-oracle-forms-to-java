package com.hrms.employee.repository;

import com.hrms.employee.entity.EmployeeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeHistoryRepository extends JpaRepository<EmployeeHistory, Long> {
    List<EmployeeHistory> findByEmpIdOrderByCreatedDateDesc(Long empId);
}
