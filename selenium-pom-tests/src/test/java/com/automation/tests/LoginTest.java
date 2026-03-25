package com.automation.tests;

import com.automation.pages.LoginPage;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

/**
 * Test class for Login page operations.
 * Covers: valid login, invalid login, logout, field validation,
 * and page element verification.
 */
public class LoginTest extends BaseTest {

    private LoginPage loginPage;

    @BeforeMethod
    public void initPage() {
        loginPage = new LoginPage(driver);
        loginPage.open();
    }

    @Test(priority = 1, description = "Verify login page is displayed with correct elements")
    public void testLoginPageElements() {
        Assert.assertTrue(loginPage.isUsernameFieldDisplayed(), "Username field should be displayed");
        Assert.assertTrue(loginPage.isLoginButtonEnabled(), "Login button should be enabled");
        Assert.assertEquals(loginPage.getPageHeading(), "Login Page", "Page heading should be 'Login Page'");
    }

    @Test(priority = 2, description = "Verify successful login with valid credentials")
    public void testValidLogin() {
        loginPage.loginWithDefaultCredentials();

        String flashMessage = loginPage.getFlashMessage();
        Assert.assertTrue(flashMessage.contains("You logged into a secure area!"),
                "Success message should be displayed after valid login");
        Assert.assertTrue(loginPage.isLogoutButtonDisplayed(),
                "Logout button should be visible after login");
    }

    @Test(priority = 3, description = "Verify login failure with invalid username")
    public void testInvalidUsername() {
        loginPage.loginWith("invaliduser", "SuperSecretPassword!");

        String flashMessage = loginPage.getFlashMessage();
        Assert.assertTrue(flashMessage.contains("Your username is invalid!"),
                "Error message should indicate invalid username");
    }

    @Test(priority = 4, description = "Verify login failure with invalid password")
    public void testInvalidPassword() {
        loginPage.loginWith("tomsmith", "wrongpassword");

        String flashMessage = loginPage.getFlashMessage();
        Assert.assertTrue(flashMessage.contains("Your password is invalid!"),
                "Error message should indicate invalid password");
    }

    @Test(priority = 5, description = "Verify login failure with empty credentials")
    public void testEmptyCredentials() {
        loginPage.loginWith("", "");

        String flashMessage = loginPage.getFlashMessage();
        Assert.assertTrue(flashMessage.contains("Your username is invalid!"),
                "Error message should appear for empty credentials");
    }

    @Test(priority = 6, description = "Verify successful logout after login")
    public void testLogout() {
        loginPage.loginWithDefaultCredentials();
        Assert.assertTrue(loginPage.isLogoutButtonDisplayed(), "Logout button should be visible");

        loginPage.clickLogout();

        String flashMessage = loginPage.getFlashMessage();
        Assert.assertTrue(flashMessage.contains("You logged out of the secure area!"),
                "Logout success message should be displayed");
        Assert.assertTrue(loginPage.isUsernameFieldDisplayed(),
                "Username field should be visible after logout");
    }

    @Test(priority = 7, description = "Verify login with credentials entered step by step")
    public void testStepByStepLogin() {
        loginPage.enterUsername("tomsmith");
        loginPage.enterPassword("SuperSecretPassword!");
        loginPage.clickLoginButton();

        Assert.assertTrue(loginPage.getFlashMessage().contains("You logged into a secure area!"),
                "Should login successfully with step-by-step entry");
    }
}
