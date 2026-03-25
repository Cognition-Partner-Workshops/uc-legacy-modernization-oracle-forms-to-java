package com.hrms.employee.repository;

import com.hrms.employee.entity.JobGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobGradeRepository extends JpaRepository<JobGrade, Long> {
}
