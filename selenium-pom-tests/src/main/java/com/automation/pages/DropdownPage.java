package com.automation.pages;

import com.automation.base.BasePage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

import java.util.List;

/**
 * Page Object for the Dropdown page (the-internet.herokuapp.com/dropdown).
 * Demonstrates dropdown selection operations: by visible text, by value, by index,
 * and reading the currently selected option.
 */
public class DropdownPage extends BasePage {

    // ===================== Locators =====================

    @FindBy(id = "dropdown")
    private WebElement dropdownSelect;

    @FindBy(css = "h3")
    private WebElement pageHeading;

    // ===================== Constructor =====================

    public DropdownPage(WebDriver driver) {
        super(driver);
    }

    // ===================== Page Actions =====================

    /**
     * Navigates to the dropdown page.
     */
    public DropdownPage open() {
        navigateTo(config.getProperty("dropdown.url"));
        return this;
    }

    /**
     * Selects an option from the dropdown by its visible text.
     */
    public DropdownPage selectOptionByText(String text) {
        selectByVisibleText(dropdownSelect, text);
        return this;
    }

    /**
     * Selects an option from the dropdown by its value attribute.
     */
    public DropdownPage selectOptionByValue(String value) {
        selectByValue(dropdownSelect, value);
        return this;
    }

    /**
     * Selects an option from the dropdown by its index (0-based).
     */
    public DropdownPage selectOptionByIndex(int index) {
        selectByIndex(dropdownSelect, index);
        return this;
    }

    // ===================== Verification Methods =====================

    /**
     * Returns the text of the currently selected option.
     */
    public String getSelectedOptionText() {
        return getSelectedOption(dropdownSelect);
    }

    /**
     * Returns all available options in the dropdown.
     */
    public List<String> getAllOptions() {
        return getAllDropdownOptions(dropdownSelect);
    }

    /**
     * Returns the number of options in the dropdown.
     */
    public int getOptionsCount() {
        return getAllDropdownOptions(dropdownSelect).size();
    }

    public String getPageHeading() {
        return getText(pageHeading);
    }

    public boolean isDropdownDisplayed() {
        return isDisplayed(dropdownSelect);
    }

    public boolean isDropdownEnabled() {
        return isEnabled(dropdownSelect);
    }
}
