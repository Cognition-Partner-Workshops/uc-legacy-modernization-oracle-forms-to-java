package com.hrms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * HRMS Modernized Application
 *
 * Migrated from Oracle Forms 11g/12c + PL/SQL to Spring Boot 3.
 * See migration-plan/ for the full migration strategy and component mapping.
 */
@SpringBootApplication
public class HrmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(HrmsApplication.class, args);
    }
}
