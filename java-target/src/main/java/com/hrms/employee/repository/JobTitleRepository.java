package com.hrms.employee.repository;

import com.hrms.employee.entity.JobTitle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobTitleRepository extends JpaRepository<JobTitle, Long> {
    boolean existsByJobIdAndActiveFlag(Long jobId, String activeFlag);
}
