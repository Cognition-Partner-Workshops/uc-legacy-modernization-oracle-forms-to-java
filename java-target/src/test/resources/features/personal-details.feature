@personalDetails
Feature: Personal Details Form Validation
  As an HR administrator
  I want to submit personal details through the form
  So that employee records are created with valid data

  The Personal Details form collects First Name, Last Name, and Aadhaar ID.
  Validation is enforced both on the client side (JavaScript) and the server side (Jakarta Bean Validation).
  This feature file covers all functional validation scenarios for the POST /api/personal-details endpoint
  and the client-side personal-details.html form.

  Background:
    Given the Personal Details form is available at "/personal-details.html"
    And the API endpoint "/api/personal-details" accepts POST requests with JSON body

  # ---------------------------------------------------------------------------
  # 1. Valid Submission
  # ---------------------------------------------------------------------------
  @valid @smoke
  Scenario: Successfully submit personal details with all valid fields
    Given the user has entered "John" as the first name
    And the user has entered "Doe" as the last name
    And the user has entered "123456789012" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 200
    And the response should contain the message "Personal details submitted successfully"

  # ---------------------------------------------------------------------------
  # 2. First Name Validation
  # ---------------------------------------------------------------------------
  @firstName
  Scenario: Reject blank first name
    Given the user has entered "" as the first name
    And the user has entered "Doe" as the last name
    And the user has entered "123456789012" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 400
    And the response should contain the error "First name is required"

  @firstName
  Scenario Outline: Reject first name with invalid characters
    Given the user has entered "<firstName>" as the first name
    And the user has entered "Doe" as the last name
    And the user has entered "123456789012" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 400
    And the response should contain the error "First name must contain only alphabetic characters"

    Examples:
      | firstName  | description                    |
      | John123    | first name containing numbers  |
      | John@Doe   | first name with special chars  |
      | John Doe   | first name with spaces         |
      | John-Paul  | first name with hyphens        |

  @firstName
  Scenario: Reject first name exceeding 20 characters
    Given the user has entered "Abcdefghijklmnopqrstu" as the first name
    And the user has entered "Doe" as the last name
    And the user has entered "123456789012" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 400
    And the response should contain the error "First name must not exceed 20 characters"

  @firstName @boundary
  Scenario: Accept first name at exactly 20 characters (boundary)
    Given the user has entered "Abcdefghijklmnopqrst" as the first name
    And the user has entered "Doe" as the last name
    And the user has entered "123456789012" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 200
    And the response should contain the message "Personal details submitted successfully"

  # ---------------------------------------------------------------------------
  # 3. Last Name Validation
  # ---------------------------------------------------------------------------
  @lastName
  Scenario: Reject blank last name
    Given the user has entered "John" as the first name
    And the user has entered "" as the last name
    And the user has entered "123456789012" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 400
    And the response should contain the error "Last name is required"

  @lastName
  Scenario Outline: Reject last name with invalid characters
    Given the user has entered "John" as the first name
    And the user has entered "<lastName>" as the last name
    And the user has entered "123456789012" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 400
    And the response should contain the error "Last name must contain only alphabetic characters"

    Examples:
      | lastName   | description                   |
      | Doe123     | last name containing numbers  |
      | Doe@Smith  | last name with special chars  |
      | Doe Smith  | last name with spaces         |

  @lastName
  Scenario: Reject last name exceeding 10 characters
    Given the user has entered "John" as the first name
    And the user has entered "Abcdefghijk" as the last name
    And the user has entered "123456789012" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 400
    And the response should contain the error "Last name must not exceed 10 characters"

  @lastName @boundary
  Scenario: Accept last name at exactly 10 characters (boundary)
    Given the user has entered "John" as the first name
    And the user has entered "Abcdefghij" as the last name
    And the user has entered "123456789012" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 200
    And the response should contain the message "Personal details submitted successfully"

  # ---------------------------------------------------------------------------
  # 4. Aadhaar ID Validation
  # ---------------------------------------------------------------------------
  @aadhaarId
  Scenario: Reject blank Aadhaar ID
    Given the user has entered "John" as the first name
    And the user has entered "Doe" as the last name
    And the user has entered "" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 400
    And the response should contain the error "Aadhaar ID is required"

  @aadhaarId
  Scenario: Reject Aadhaar ID with fewer than 12 digits
    Given the user has entered "John" as the first name
    And the user has entered "Doe" as the last name
    And the user has entered "12345678901" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 400
    And the response should contain the error "Aadhaar ID must be exactly 12 characters"

  @aadhaarId
  Scenario: Reject Aadhaar ID with more than 12 digits
    Given the user has entered "John" as the first name
    And the user has entered "Doe" as the last name
    And the user has entered "1234567890123" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 400
    And the response should contain the error "Aadhaar ID must be exactly 12 characters"

  @aadhaarId
  Scenario: Reject Aadhaar ID with alphabetic characters
    Given the user has entered "John" as the first name
    And the user has entered "Doe" as the last name
    And the user has entered "12345678901A" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 400
    And the response should contain the error "Aadhaar ID must contain exactly 12 numeric digits"

  @aadhaarId
  Scenario: Reject Aadhaar ID with special characters
    Given the user has entered "John" as the first name
    And the user has entered "Doe" as the last name
    And the user has entered "12345678@012" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 400
    And the response should contain the error "Aadhaar ID must contain exactly 12 numeric digits"

  @aadhaarId @boundary
  Scenario: Accept Aadhaar ID at exactly 12 numeric digits (boundary)
    Given the user has entered "John" as the first name
    And the user has entered "Doe" as the last name
    And the user has entered "999999999999" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 200
    And the response should contain the message "Personal details submitted successfully"

  # ---------------------------------------------------------------------------
  # 5. Multiple Field Errors
  # ---------------------------------------------------------------------------
  @multipleErrors
  Scenario: Reject submission with all fields blank
    Given the user has entered "" as the first name
    And the user has entered "" as the last name
    And the user has entered "" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 400
    And the response should contain the error "First name is required"
    And the response should contain the error "Last name is required"
    And the response should contain the error "Aadhaar ID is required"

  @multipleErrors
  Scenario: Reject submission with multiple invalid field formats
    Given the user has entered "John123" as the first name
    And the user has entered "Doe456" as the last name
    And the user has entered "ABCDEFGHIJKL" as the Aadhaar ID
    When the user submits the personal details form
    Then the server should respond with HTTP status 400
    And the response should contain the error "First name must contain only alphabetic characters"
    And the response should contain the error "Last name must contain only alphabetic characters"
    And the response should contain the error "Aadhaar ID must contain exactly 12 numeric digits"

  # ---------------------------------------------------------------------------
  # 6. Client-Side Validation (UI Behavior)
  # ---------------------------------------------------------------------------
  @clientSide @ui
  Scenario: Show inline error message on blur for blank first name
    Given the user is on the Personal Details page
    When the user focuses on the "firstName" field
    And the user leaves the "firstName" field blank
    And the user moves focus away from the "firstName" field
    Then the inline error message "First name is required" should be displayed below the "firstName" field
    And the "firstName" input should have the "error" CSS class

  @clientSide @ui
  Scenario: Show inline error message on blur for invalid first name pattern
    Given the user is on the Personal Details page
    When the user enters "John123" in the "firstName" field
    And the user moves focus away from the "firstName" field
    Then the inline error message "First name must contain only alphabetic characters" should be displayed below the "firstName" field
    And the "firstName" input should have the "error" CSS class

  @clientSide @ui
  Scenario: Clear inline error when valid value is entered for first name
    Given the user is on the Personal Details page
    And the "firstName" field shows the error "First name is required"
    When the user enters "John" in the "firstName" field
    And the user moves focus away from the "firstName" field
    Then the inline error message for the "firstName" field should be cleared
    And the "firstName" input should not have the "error" CSS class

  @clientSide @ui
  Scenario: Show inline error message on blur for blank Aadhaar ID
    Given the user is on the Personal Details page
    When the user focuses on the "aadhaarId" field
    And the user leaves the "aadhaarId" field blank
    And the user moves focus away from the "aadhaarId" field
    Then the inline error message "Aadhaar ID is required" should be displayed below the "aadhaarId" field
    And the "aadhaarId" input should have the "error" CSS class

  @clientSide @ui
  Scenario: Clear inline error when valid Aadhaar ID is entered
    Given the user is on the Personal Details page
    And the "aadhaarId" field shows the error "Aadhaar ID is required"
    When the user enters "123456789012" in the "aadhaarId" field
    And the user moves focus away from the "aadhaarId" field
    Then the inline error message for the "aadhaarId" field should be cleared
    And the "aadhaarId" input should not have the "error" CSS class

  @clientSide @ui
  Scenario: Form should not submit when client-side validation fails
    Given the user is on the Personal Details page
    And the user has entered "" as the first name
    And the user has entered "" as the last name
    And the user has entered "" as the Aadhaar ID
    When the user clicks the Submit button
    Then no HTTP request should be sent to the server
    And inline error messages should be displayed for all three fields
    And the "firstName" error should display "First name is required"
    And the "lastName" error should display "Last name is required"
    And the "aadhaarId" error should display "Aadhaar ID is required"

  @clientSide @ui
  Scenario: Form submits successfully after correcting client-side validation errors
    Given the user is on the Personal Details page
    And all fields are initially blank showing validation errors
    When the user enters "John" in the "firstName" field
    And the user enters "Doe" in the "lastName" field
    And the user enters "123456789012" in the "aadhaarId" field
    And the user clicks the Submit button
    Then the form should submit successfully
    And a success message "Personal details submitted successfully" should be displayed
