package com.hrms.employee;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/personal-details")
public class PersonalDetailsController {

    @PostMapping
    public ResponseEntity<?> submitPersonalDetails(@Valid @RequestBody PersonalDetailsRequest request) {
        return ResponseEntity.ok(Map.of(
            "message", "Personal details submitted successfully",
            "firstName", request.firstName(),
            "lastName", request.lastName(),
            "aadhaarId", request.aadhaarId()
        ));
    }
}
