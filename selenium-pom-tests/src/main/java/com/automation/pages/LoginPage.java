package com.automation.pages;

import com.automation.base.BasePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Page Object for the Login page (the-internet.herokuapp.com/login).
 * Encapsulates all login-related interactions: entering credentials,
 * submitting the form, and verifying login success/failure messages.
 */
public class LoginPage extends BasePage {

    // ===================== Locators =====================

    @FindBy(id = "username")
    private WebElement usernameField;

    @FindBy(id = "password")
    private WebElement passwordField;

    @FindBy(css = "button[type='submit']")
    private WebElement loginButton;

    @FindBy(id = "flash")
    private WebElement flashMessage;

    @FindBy(css = "h2")
    private WebElement pageHeading;

    @FindBy(css = ".subheader")
    private WebElement subHeader;

    @FindBy(css = "a[href='/logout']")
    private WebElement logoutButton;

    // ===================== Constructor =====================

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    // ===================== Page Actions =====================

    /**
     * Navigates to the login page.
     */
    public LoginPage open() {
        navigateTo(config.getProperty("login.url"));
        return this;
    }

    /**
     * Enters the username into the username field.
     */
    public LoginPage enterUsername(String username) {
        type(usernameField, username);
        return this;
    }

    /**
     * Enters the password into the password field.
     */
    public LoginPage enterPassword(String password) {
        type(passwordField, password);
        return this;
    }

    /**
     * Clicks the login button to submit the form.
     */
    public LoginPage clickLoginButton() {
        click(loginButton);
        return this;
    }

    /**
     * Performs a complete login with the provided credentials.
     */
    public LoginPage loginWith(String username, String password) {
        enterUsername(username);
        enterPassword(password);
        clickLoginButton();
        return this;
    }

    /**
     * Performs login using credentials from config.properties.
     */
    public LoginPage loginWithDefaultCredentials() {
        String username = config.getProperty("login.username");
        String password = config.getProperty("login.password");
        return loginWith(username, password);
    }

    /**
     * Clicks the logout button (available after successful login).
     */
    public LoginPage clickLogout() {
        click(logoutButton);
        return this;
    }

    // ===================== Verification Methods =====================

    public String getFlashMessage() {
        return getText(flashMessage).trim();
    }

    public boolean isFlashMessageDisplayed() {
        return isDisplayed(flashMessage);
    }

    public String getPageHeading() {
        return getText(pageHeading);
    }

    public String getSubHeader() {
        return getText(subHeader);
    }

    public boolean isLogoutButtonDisplayed() {
        return isDisplayed(logoutButton);
    }

    public boolean isUsernameFieldDisplayed() {
        return isDisplayed(usernameField);
    }

    public boolean isLoginButtonEnabled() {
        return isEnabled(loginButton);
    }

    public String getUsernameFieldAttribute(String attribute) {
        return getAttribute(usernameField, attribute);
    }
}
