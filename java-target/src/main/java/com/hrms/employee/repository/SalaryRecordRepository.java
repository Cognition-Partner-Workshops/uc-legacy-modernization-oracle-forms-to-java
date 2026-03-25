package com.hrms.employee.repository;

import com.hrms.employee.entity.SalaryRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SalaryRecordRepository extends JpaRepository<SalaryRecord, Long> {
    Optional<SalaryRecord> findByEmpIdAndActiveFlag(Long empId, String activeFlag);
}
