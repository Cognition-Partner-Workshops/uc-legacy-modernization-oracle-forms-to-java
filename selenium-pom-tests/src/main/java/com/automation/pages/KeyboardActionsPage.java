package com.automation.pages;

import com.automation.base.BasePage;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Page Object for the Key Presses page (the-internet.herokuapp.com/key_presses).
 * Demonstrates keyboard interactions: sending individual keys, key combinations,
 * and verifying the detected key press result.
 */
public class KeyboardActionsPage extends BasePage {

    // ===================== Locators =====================

    @FindBy(id = "target")
    private WebElement inputField;

    @FindBy(id = "result")
    private WebElement resultText;

    @FindBy(css = "h3")
    private WebElement pageHeading;

    // ===================== Constructor =====================

    public KeyboardActionsPage(WebDriver driver) {
        super(driver);
    }

    // ===================== Navigation =====================

    /**
     * Opens the Key Presses page.
     */
    public KeyboardActionsPage open() {
        navigateTo(config.getProperty("key_presses.url"));
        return this;
    }

    // ===================== Keyboard Actions =====================

    /**
     * Presses a regular character key in the input field.
     */
    public KeyboardActionsPage pressKey(String key) {
        click(inputField);
        sendKeysToElement(inputField, key);
        logger.info("Pressed key: {}", key);
        return this;
    }

    /**
     * Presses a special key (e.g., ENTER, TAB, ESCAPE) in the input field.
     */
    public KeyboardActionsPage pressSpecialKey(Keys key) {
        click(inputField);
        sendKeysToElement(inputField, key);
        logger.info("Pressed special key: {}", key.name());
        return this;
    }

    /**
     * Presses the ENTER key.
     */
    public KeyboardActionsPage pressEnter() {
        return pressSpecialKey(Keys.ENTER);
    }

    /**
     * Presses the TAB key.
     */
    public KeyboardActionsPage pressTab() {
        return pressSpecialKey(Keys.TAB);
    }

    /**
     * Presses the ESCAPE key.
     */
    public KeyboardActionsPage pressEscape() {
        return pressSpecialKey(Keys.ESCAPE);
    }

    /**
     * Presses the BACKSPACE key.
     */
    public KeyboardActionsPage pressBackspace() {
        return pressSpecialKey(Keys.BACK_SPACE);
    }

    /**
     * Presses the DELETE key.
     */
    public KeyboardActionsPage pressDelete() {
        return pressSpecialKey(Keys.DELETE);
    }

    /**
     * Presses the SPACE key.
     */
    public KeyboardActionsPage pressSpace() {
        return pressSpecialKey(Keys.SPACE);
    }

    /**
     * Presses an arrow key (UP, DOWN, LEFT, RIGHT).
     */
    public KeyboardActionsPage pressArrowKey(Keys arrowKey) {
        return pressSpecialKey(arrowKey);
    }

    /**
     * Presses a function key (F1-F12).
     */
    public KeyboardActionsPage pressFunctionKey(Keys functionKey) {
        return pressSpecialKey(functionKey);
    }

    /**
     * Types text into the input field.
     */
    public KeyboardActionsPage typeText(String text) {
        type(inputField, text);
        logger.info("Typed text: {}", text);
        return this;
    }

    /**
     * Performs a key combination using the Actions class (e.g., Ctrl+A).
     */
    public KeyboardActionsPage pressKeyCombination(CharSequence modifier, String key) {
        click(inputField);
        actions.keyDown(modifier).sendKeys(key).keyUp(modifier).perform();
        logger.info("Pressed key combination: {} + {}", modifier, key);
        return this;
    }

    /**
     * Clears the input field.
     */
    public KeyboardActionsPage clearInput() {
        inputField.clear();
        return this;
    }

    // ===================== Verification Methods =====================

    /**
     * Returns the result text displayed after a key press.
     */
    public String getResultText() {
        return getText(resultText);
    }

    /**
     * Returns the current value in the input field.
     */
    public String getInputValue() {
        return getAttribute(inputField, "value");
    }

    public String getPageHeading() {
        return getText(pageHeading);
    }

    public boolean isInputFieldDisplayed() {
        return isDisplayed(inputField);
    }

    public boolean isResultDisplayed() {
        return isDisplayed(resultText);
    }
}
