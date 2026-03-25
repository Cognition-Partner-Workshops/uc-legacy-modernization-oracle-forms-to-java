package com.hrms.employee;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PersonalDetailsController.class)
@AutoConfigureMockMvc(addFilters = false)
class PersonalDetailsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private static final String ENDPOINT = "/api/personal-details";

    @Test
    void testSubmitValidDetails() throws Exception {
        String json = """
                {"firstName": "John", "lastName": "Doe", "aadhaarId": "123456789012"}
                """;
        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Personal details submitted successfully"))
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.lastName").value("Doe"))
                .andExpect(jsonPath("$.aadhaarId").value("123456789012"));
    }

    @Test
    void testSubmitBlankFirstName() throws Exception {
        String json = """
                {"firstName": "", "lastName": "Doe", "aadhaarId": "123456789012"}
                """;
        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSubmitFirstNameTooLong() throws Exception {
        String json = """
                {"firstName": "ABCDEFGHIJKLMNOPQRSTU", "lastName": "Doe", "aadhaarId": "123456789012"}
                """;
        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSubmitBlankLastName() throws Exception {
        String json = """
                {"firstName": "John", "lastName": "", "aadhaarId": "123456789012"}
                """;
        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSubmitLastNameTooLong() throws Exception {
        String json = """
                {"firstName": "John", "lastName": "ABCDEFGHIJK", "aadhaarId": "123456789012"}
                """;
        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSubmitInvalidAadhaar_TooShort() throws Exception {
        String json = """
                {"firstName": "John", "lastName": "Doe", "aadhaarId": "12345678901"}
                """;
        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSubmitInvalidAadhaar_TooLong() throws Exception {
        String json = """
                {"firstName": "John", "lastName": "Doe", "aadhaarId": "1234567890123"}
                """;
        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSubmitInvalidAadhaar_NonNumeric() throws Exception {
        String json = """
                {"firstName": "John", "lastName": "Doe", "aadhaarId": "12345678901a"}
                """;
        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSubmitAllFieldsEmpty() throws Exception {
        String json = """
                {"firstName": "", "lastName": "", "aadhaarId": ""}
                """;
        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }
}
