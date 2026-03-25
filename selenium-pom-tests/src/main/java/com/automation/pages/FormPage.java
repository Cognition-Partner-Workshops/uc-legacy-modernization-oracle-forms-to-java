package com.automation.pages;

import com.automation.base.BasePage;
import com.automation.utils.WaitUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

import java.util.List;

/**
 * Page Object for form interactions.
 * Uses the Checkboxes page (the-internet.herokuapp.com/checkboxes) and
 * the Inputs page (the-internet.herokuapp.com/inputs) to demonstrate:
 * checkbox toggling, number input, and form field validation.
 */
public class FormPage extends BasePage {

    // ===================== Checkbox Locators =====================

    @FindBy(css = "#checkboxes input[type='checkbox']")
    private List<WebElement> checkboxes;

    @FindBy(css = "#checkboxes")
    private WebElement checkboxForm;

    @FindBy(css = "h3")
    private WebElement pageHeading;

    // ===================== Input Locators =====================

    @FindBy(css = "input[type='number']")
    private WebElement numberInput;

    // ===================== Constructor =====================

    public FormPage(WebDriver driver) {
        super(driver);
    }

    // ===================== Navigation =====================

    /**
     * Opens the Checkboxes page.
     */
    public FormPage openCheckboxes() {
        navigateTo(config.getProperty("checkboxes.url"));
        return this;
    }

    /**
     * Opens the Inputs page.
     */
    public FormPage openInputs() {
        navigateTo(config.getProperty("inputs.url"));
        return this;
    }

    // ===================== Checkbox Operations =====================

    /**
     * Toggles a checkbox at the given index (0-based).
     */
    public FormPage toggleCheckbox(int index) {
        if (index < checkboxes.size()) {
            click(checkboxes.get(index));
            logger.info("Toggled checkbox at index: {}", index);
        } else {
            throw new IndexOutOfBoundsException("Checkbox index " + index + " out of bounds. Total: " + checkboxes.size());
        }
        return this;
    }

    /**
     * Checks a checkbox at the given index if it is not already checked.
     */
    public FormPage checkCheckbox(int index) {
        if (index < checkboxes.size() && !checkboxes.get(index).isSelected()) {
            click(checkboxes.get(index));
            logger.info("Checked checkbox at index: {}", index);
        }
        return this;
    }

    /**
     * Unchecks a checkbox at the given index if it is currently checked.
     */
    public FormPage uncheckCheckbox(int index) {
        if (index < checkboxes.size() && checkboxes.get(index).isSelected()) {
            click(checkboxes.get(index));
            logger.info("Unchecked checkbox at index: {}", index);
        }
        return this;
    }

    /**
     * Returns whether the checkbox at the given index is selected.
     */
    public boolean isCheckboxSelected(int index) {
        if (index < checkboxes.size()) {
            return checkboxes.get(index).isSelected();
        }
        throw new IndexOutOfBoundsException("Checkbox index " + index + " out of bounds.");
    }

    /**
     * Returns the total number of checkboxes on the page.
     */
    public int getCheckboxCount() {
        return checkboxes.size();
    }

    /**
     * Selects all checkboxes on the page.
     */
    public FormPage selectAllCheckboxes() {
        for (int i = 0; i < checkboxes.size(); i++) {
            checkCheckbox(i);
        }
        return this;
    }

    /**
     * Deselects all checkboxes on the page.
     */
    public FormPage deselectAllCheckboxes() {
        for (int i = 0; i < checkboxes.size(); i++) {
            uncheckCheckbox(i);
        }
        return this;
    }

    // ===================== Input Operations =====================

    /**
     * Enters a number into the number input field.
     */
    public FormPage enterNumber(String number) {
        type(numberInput, number);
        return this;
    }

    /**
     * Clears the number input field.
     */
    public FormPage clearNumberInput() {
        WaitUtils.waitForVisibility(driver, numberInput);
        numberInput.clear();
        return this;
    }

    /**
     * Returns the current value of the number input field.
     */
    public String getNumberInputValue() {
        return getAttribute(numberInput, "value");
    }

    public boolean isNumberInputDisplayed() {
        return isDisplayed(numberInput);
    }

    // ===================== General Verification =====================

    public String getPageHeading() {
        return getText(pageHeading);
    }

    public boolean isCheckboxFormDisplayed() {
        return isDisplayed(checkboxForm);
    }
}
