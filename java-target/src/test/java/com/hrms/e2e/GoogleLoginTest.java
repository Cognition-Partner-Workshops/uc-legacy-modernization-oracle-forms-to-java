package com.hrms.e2e;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * End-to-end Selenium test cases for Google Login (google.com).
 *
 * These tests validate the Google sign-in flow covering positive,
 * negative, and edge-case scenarios using a real browser.
 *
 * Prerequisites:
 *   - ChromeDriver installed and on PATH
 *   - Valid test Google account credentials configured via environment
 *     variables GOOGLE_TEST_EMAIL and GOOGLE_TEST_PASSWORD
 */
@DisplayName("Google Login Test Suite")
public class GoogleLoginTest {

    private WebDriver driver;
    private WebDriverWait wait;

    private static final String GOOGLE_URL = "https://www.google.com";
    private static final String GOOGLE_LOGIN_URL = "https://accounts.google.com";
    private static final Duration TIMEOUT = Duration.ofSeconds(15);

    @BeforeEach
    void setUp() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-gpu");
        options.addArguments("--window-size=1920,1080");
        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, TIMEOUT);
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    // ========================================================================
    // TC-01: Verify Google Homepage Loads
    // ========================================================================

    @Test
    @DisplayName("TC-01: Google homepage should load successfully")
    @Timeout(30)
    void testGoogleHomepageLoads() {
        driver.get(GOOGLE_URL);

        String title = driver.getTitle();
        assertNotNull(title, "Page title should not be null");
        assertTrue(title.toLowerCase().contains("google"),
                "Page title should contain 'Google'");
    }

    // ========================================================================
    // TC-02: Verify Sign-In Button is Present on Google Homepage
    // ========================================================================

    @Test
    @DisplayName("TC-02: Sign-In button should be visible on Google homepage")
    @Timeout(30)
    void testSignInButtonPresent() {
        driver.get(GOOGLE_URL);

        WebElement signInLink = wait.until(
                ExpectedConditions.elementToBeClickable(By.linkText("Sign in")));
        assertNotNull(signInLink, "Sign-In button should be present");
        assertTrue(signInLink.isDisplayed(), "Sign-In button should be visible");
    }

    // ========================================================================
    // TC-03: Verify Sign-In Button Navigates to Accounts Page
    // ========================================================================

    @Test
    @DisplayName("TC-03: Clicking Sign-In should navigate to Google Accounts page")
    @Timeout(30)
    void testSignInNavigatesToAccountsPage() {
        driver.get(GOOGLE_URL);

        WebElement signInLink = wait.until(
                ExpectedConditions.elementToBeClickable(By.linkText("Sign in")));
        signInLink.click();

        wait.until(ExpectedConditions.urlContains("accounts.google.com"));
        assertTrue(driver.getCurrentUrl().contains("accounts.google.com"),
                "URL should redirect to accounts.google.com");
    }

    // ========================================================================
    // TC-04: Verify Email Input Field is Present on Login Page
    // ========================================================================

    @Test
    @DisplayName("TC-04: Email input field should be present on the login page")
    @Timeout(30)
    void testEmailInputFieldPresent() {
        driver.get(GOOGLE_LOGIN_URL);

        WebElement emailField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));
        assertNotNull(emailField, "Email input field should be present");
        assertTrue(emailField.isDisplayed(), "Email input field should be visible");
        assertTrue(emailField.isEnabled(), "Email input field should be enabled");
    }

    // ========================================================================
    // TC-05: Verify Login with Empty Email Shows Error
    // ========================================================================

    @Test
    @DisplayName("TC-05: Submitting empty email should display an error message")
    @Timeout(30)
    void testLoginWithEmptyEmail() {
        driver.get(GOOGLE_LOGIN_URL);

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));

        // Click Next without entering email
        WebElement nextButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(@class, 'VfPpkd')]//span[text()='Next']/ancestor::button")));
        nextButton.click();

        // Verify error message appears
        WebElement errorMessage = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//*[contains(text(), 'Enter an email or phone number')]")));
        assertNotNull(errorMessage, "Error message should appear for empty email");
        assertTrue(errorMessage.isDisplayed(), "Error message should be visible");
    }

    // ========================================================================
    // TC-06: Verify Login with Invalid Email Format Shows Error
    // ========================================================================

    @Test
    @DisplayName("TC-06: Entering an invalid email format should display an error")
    @Timeout(30)
    void testLoginWithInvalidEmailFormat() {
        driver.get(GOOGLE_LOGIN_URL);

        WebElement emailField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));
        emailField.sendKeys("invalid-email-format");

        WebElement nextButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(@class, 'VfPpkd')]//span[text()='Next']/ancestor::button")));
        nextButton.click();

        // Verify error message for invalid email
        WebElement errorMessage = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//*[contains(text(), \"Couldn't find your Google Account\") or contains(text(), 'Enter a valid email')]")));
        assertNotNull(errorMessage, "Error message should appear for invalid email format");
    }

    // ========================================================================
    // TC-07: Verify Login with Non-Existent Email Shows Error
    // ========================================================================

    @Test
    @DisplayName("TC-07: Non-existent email address should display an error")
    @Timeout(30)
    void testLoginWithNonExistentEmail() {
        driver.get(GOOGLE_LOGIN_URL);

        WebElement emailField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));
        emailField.sendKeys("nonexistent.user.xyz123456789@gmail.com");

        WebElement nextButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(@class, 'VfPpkd')]//span[text()='Next']/ancestor::button")));
        nextButton.click();

        WebElement errorMessage = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//*[contains(text(), \"Couldn't find your Google Account\")]")));
        assertNotNull(errorMessage, "Error message should appear for non-existent email");
    }

    // ========================================================================
    // TC-08: Verify Valid Email Proceeds to Password Step
    // ========================================================================

    @Test
    @DisplayName("TC-08: Valid email should advance to the password entry step")
    @Timeout(30)
    void testValidEmailProceedsToPasswordStep() {
        String testEmail = System.getenv("GOOGLE_TEST_EMAIL");
        if (testEmail == null || testEmail.isBlank()) {
            System.out.println("Skipping: GOOGLE_TEST_EMAIL not configured");
            return;
        }

        driver.get(GOOGLE_LOGIN_URL);

        WebElement emailField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));
        emailField.sendKeys(testEmail);

        WebElement nextButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(@class, 'VfPpkd')]//span[text()='Next']/ancestor::button")));
        nextButton.click();

        // Verify password field appears
        WebElement passwordField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.name("Passwd")));
        assertNotNull(passwordField, "Password field should appear after valid email");
        assertTrue(passwordField.isDisplayed(), "Password field should be visible");
    }

    // ========================================================================
    // TC-09: Verify Login with Empty Password Shows Error
    // ========================================================================

    @Test
    @DisplayName("TC-09: Submitting empty password should display an error")
    @Timeout(30)
    void testLoginWithEmptyPassword() {
        String testEmail = System.getenv("GOOGLE_TEST_EMAIL");
        if (testEmail == null || testEmail.isBlank()) {
            System.out.println("Skipping: GOOGLE_TEST_EMAIL not configured");
            return;
        }

        driver.get(GOOGLE_LOGIN_URL);

        WebElement emailField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));
        emailField.sendKeys(testEmail);

        WebElement nextButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(@class, 'VfPpkd')]//span[text()='Next']/ancestor::button")));
        nextButton.click();

        WebElement passwordField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.name("Passwd")));

        // Click Next without entering password
        WebElement passwordNextButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(@class, 'VfPpkd')]//span[text()='Next']/ancestor::button")));
        passwordNextButton.click();

        WebElement errorMessage = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//*[contains(text(), 'Enter a password')]")));
        assertNotNull(errorMessage, "Error message should appear for empty password");
    }

    // ========================================================================
    // TC-10: Verify Login with Wrong Password Shows Error
    // ========================================================================

    @Test
    @DisplayName("TC-10: Incorrect password should display an error message")
    @Timeout(30)
    void testLoginWithWrongPassword() {
        String testEmail = System.getenv("GOOGLE_TEST_EMAIL");
        if (testEmail == null || testEmail.isBlank()) {
            System.out.println("Skipping: GOOGLE_TEST_EMAIL not configured");
            return;
        }

        driver.get(GOOGLE_LOGIN_URL);

        WebElement emailField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));
        emailField.sendKeys(testEmail);

        WebElement nextButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(@class, 'VfPpkd')]//span[text()='Next']/ancestor::button")));
        nextButton.click();

        WebElement passwordField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.name("Passwd")));
        passwordField.sendKeys("DefinitelyWr0ng!P@ssword");

        WebElement passwordNextButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(@class, 'VfPpkd')]//span[text()='Next']/ancestor::button")));
        passwordNextButton.click();

        WebElement errorMessage = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//*[contains(text(), 'Wrong password') or contains(text(), 'incorrect')]")));
        assertNotNull(errorMessage, "Error message should appear for wrong password");
    }

    // ========================================================================
    // TC-11: Verify Successful Login with Valid Credentials
    // ========================================================================

    @Test
    @DisplayName("TC-11: Valid email and password should log in successfully")
    @Timeout(60)
    void testSuccessfulLogin() {
        String testEmail = System.getenv("GOOGLE_TEST_EMAIL");
        String testPassword = System.getenv("GOOGLE_TEST_PASSWORD");
        if (testEmail == null || testPassword == null
                || testEmail.isBlank() || testPassword.isBlank()) {
            System.out.println("Skipping: GOOGLE_TEST_EMAIL / GOOGLE_TEST_PASSWORD not configured");
            return;
        }

        driver.get(GOOGLE_LOGIN_URL);

        // Enter email
        WebElement emailField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));
        emailField.sendKeys(testEmail);

        WebElement nextButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(@class, 'VfPpkd')]//span[text()='Next']/ancestor::button")));
        nextButton.click();

        // Enter password
        WebElement passwordField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.name("Passwd")));
        passwordField.sendKeys(testPassword);

        WebElement passwordNextButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(@class, 'VfPpkd')]//span[text()='Next']/ancestor::button")));
        passwordNextButton.click();

        // Verify successful login by checking redirect to myaccount or google.com
        wait.until(ExpectedConditions.urlContains("myaccount.google.com"));
        assertTrue(
                driver.getCurrentUrl().contains("myaccount.google.com")
                        || driver.getCurrentUrl().contains("google.com"),
                "User should be redirected after successful login");
    }

    // ========================================================================
    // TC-12: Verify "Forgot Password" Link is Present and Clickable
    // ========================================================================

    @Test
    @DisplayName("TC-12: 'Forgot password?' link should be visible on the password step")
    @Timeout(30)
    void testForgotPasswordLinkPresent() {
        String testEmail = System.getenv("GOOGLE_TEST_EMAIL");
        if (testEmail == null || testEmail.isBlank()) {
            System.out.println("Skipping: GOOGLE_TEST_EMAIL not configured");
            return;
        }

        driver.get(GOOGLE_LOGIN_URL);

        WebElement emailField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));
        emailField.sendKeys(testEmail);

        WebElement nextButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(@class, 'VfPpkd')]//span[text()='Next']/ancestor::button")));
        nextButton.click();

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("Passwd")));

        WebElement forgotPasswordLink = wait.until(
                ExpectedConditions.elementToBeClickable(
                        By.xpath("//button[contains(text(), 'Forgot password')]")));
        assertNotNull(forgotPasswordLink, "'Forgot password?' link should be present");
        assertTrue(forgotPasswordLink.isDisplayed(), "'Forgot password?' link should be visible");
    }

    // ========================================================================
    // TC-13: Verify "Create Account" Link is Present on Login Page
    // ========================================================================

    @Test
    @DisplayName("TC-13: 'Create account' link should be visible on the login page")
    @Timeout(30)
    void testCreateAccountLinkPresent() {
        driver.get(GOOGLE_LOGIN_URL);

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));

        WebElement createAccountLink = wait.until(
                ExpectedConditions.elementToBeClickable(
                        By.xpath("//*[contains(text(), 'Create account')]")));
        assertNotNull(createAccountLink, "'Create account' link should be present");
        assertTrue(createAccountLink.isDisplayed(), "'Create account' link should be visible");
    }

    // ========================================================================
    // TC-14: Verify Password Field Masks Input
    // ========================================================================

    @Test
    @DisplayName("TC-14: Password field should mask characters (type='password')")
    @Timeout(30)
    void testPasswordFieldMasksInput() {
        String testEmail = System.getenv("GOOGLE_TEST_EMAIL");
        if (testEmail == null || testEmail.isBlank()) {
            System.out.println("Skipping: GOOGLE_TEST_EMAIL not configured");
            return;
        }

        driver.get(GOOGLE_LOGIN_URL);

        WebElement emailField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));
        emailField.sendKeys(testEmail);

        WebElement nextButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(@class, 'VfPpkd')]//span[text()='Next']/ancestor::button")));
        nextButton.click();

        WebElement passwordField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.name("Passwd")));

        String fieldType = passwordField.getDomAttribute("type");
        assertEquals("password", fieldType,
                "Password field type should be 'password' to mask characters");
    }

    // ========================================================================
    // TC-15: Verify "Show Password" Toggle Works
    // ========================================================================

    @Test
    @DisplayName("TC-15: 'Show password' checkbox should toggle password visibility")
    @Timeout(30)
    void testShowPasswordToggle() {
        String testEmail = System.getenv("GOOGLE_TEST_EMAIL");
        if (testEmail == null || testEmail.isBlank()) {
            System.out.println("Skipping: GOOGLE_TEST_EMAIL not configured");
            return;
        }

        driver.get(GOOGLE_LOGIN_URL);

        WebElement emailField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));
        emailField.sendKeys(testEmail);

        WebElement nextButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(@class, 'VfPpkd')]//span[text()='Next']/ancestor::button")));
        nextButton.click();

        WebElement passwordField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.name("Passwd")));
        passwordField.sendKeys("SomePassword123");

        // Click the "Show password" checkbox
        WebElement showPasswordCheckbox = wait.until(
                ExpectedConditions.elementToBeClickable(
                        By.xpath("//input[@type='checkbox' and @aria-label='Show password']")));
        showPasswordCheckbox.click();

        String fieldType = passwordField.getDomAttribute("type");
        assertEquals("text", fieldType,
                "Password field type should change to 'text' when 'Show password' is checked");
    }

    // ========================================================================
    // TC-16: Verify Login Page Title
    // ========================================================================

    @Test
    @DisplayName("TC-16: Login page should have the expected title")
    @Timeout(30)
    void testLoginPageTitle() {
        driver.get(GOOGLE_LOGIN_URL);

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));

        String title = driver.getTitle();
        assertNotNull(title, "Page title should not be null");
        assertTrue(title.toLowerCase().contains("sign in") || title.toLowerCase().contains("google"),
                "Login page title should contain 'Sign in' or 'Google'");
    }

    // ========================================================================
    // TC-17: Verify Login with SQL Injection in Email Field
    // ========================================================================

    @Test
    @DisplayName("TC-17: SQL injection in email field should not cause errors")
    @Timeout(30)
    void testSqlInjectionInEmailField() {
        driver.get(GOOGLE_LOGIN_URL);

        WebElement emailField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));
        emailField.sendKeys("' OR '1'='1' --");

        WebElement nextButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(@class, 'VfPpkd')]//span[text()='Next']/ancestor::button")));
        nextButton.click();

        // Should show a normal error, not a server error or unexpected behavior
        WebElement errorMessage = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//*[contains(text(), \"Couldn't find your Google Account\") or contains(text(), 'Enter a valid email')]")));
        assertNotNull(errorMessage,
                "Application should handle SQL injection gracefully with a user-friendly error");
    }

    // ========================================================================
    // TC-18: Verify Login with XSS Payload in Email Field
    // ========================================================================

    @Test
    @DisplayName("TC-18: XSS payload in email field should be safely handled")
    @Timeout(30)
    void testXssInEmailField() {
        driver.get(GOOGLE_LOGIN_URL);

        WebElement emailField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));
        emailField.sendKeys("<script>alert('XSS')</script>");

        WebElement nextButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(@class, 'VfPpkd')]//span[text()='Next']/ancestor::button")));
        nextButton.click();

        // Should show a normal error without executing the script
        WebElement errorMessage = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//*[contains(text(), \"Couldn't find your Google Account\") or contains(text(), 'Enter a valid email')]")));
        assertNotNull(errorMessage,
                "Application should handle XSS payloads gracefully");
    }

    // ========================================================================
    // TC-19: Verify HTTPS is Used on Login Page
    // ========================================================================

    @Test
    @DisplayName("TC-19: Login page should be served over HTTPS")
    @Timeout(30)
    void testLoginPageUsesHttps() {
        driver.get(GOOGLE_LOGIN_URL);

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));

        assertTrue(driver.getCurrentUrl().startsWith("https://"),
                "Login page URL should start with 'https://'");
    }

    // ========================================================================
    // TC-20: Verify Login Page is Responsive (Mobile Viewport)
    // ========================================================================

    @Test
    @DisplayName("TC-20: Login page should render correctly on a mobile viewport")
    @Timeout(30)
    void testLoginPageResponsiveMobile() {
        driver.manage().window().setSize(new org.openqa.selenium.Dimension(375, 812));
        driver.get(GOOGLE_LOGIN_URL);

        WebElement emailField = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.id("identifierId")));
        assertTrue(emailField.isDisplayed(),
                "Email field should still be visible on mobile viewport");

        WebElement nextButton = wait.until(
                ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(@class, 'VfPpkd')]//span[text()='Next']/ancestor::button")));
        assertTrue(nextButton.isDisplayed(),
                "Next button should still be visible on mobile viewport");
    }
}
