package com.automation.pages;

import com.automation.base.BasePage;
import com.automation.utils.WaitUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

/**
 * Page Object demonstrating various click operations on the-internet.herokuapp.com.
 * Uses the Add/Remove Elements page for click operations and demonstrates
 * single click, JavaScript click, and dynamic element interaction.
 */
public class ClickPage extends BasePage {

    // ===================== Add/Remove Elements Locators =====================

    @FindBy(css = "button[onclick='addElement()']")
    private WebElement addElementButton;

    @FindBy(id = "elements")
    private WebElement elementsContainer;

    @FindBy(css = "h3")
    private WebElement pageHeading;

    // ===================== Constructor =====================

    public ClickPage(WebDriver driver) {
        super(driver);
    }

    // ===================== Navigation =====================

    /**
     * Opens the Add/Remove Elements page.
     */
    public ClickPage open() {
        navigateTo(config.getProperty("base.url") + "/add_remove_elements/");
        return this;
    }

    // ===================== Click Operations =====================

    /**
     * Clicks the "Add Element" button using a standard click.
     */
    public ClickPage clickAddElement() {
        click(addElementButton);
        logger.info("Clicked 'Add Element' button");
        return this;
    }

    /**
     * Clicks the "Add Element" button using JavaScript click.
     */
    public ClickPage jsClickAddElement() {
        jsClick(addElementButton);
        logger.info("JS-clicked 'Add Element' button");
        return this;
    }

    /**
     * Clicks the "Add Element" button multiple times.
     */
    public ClickPage clickAddElementMultipleTimes(int times) {
        for (int i = 0; i < times; i++) {
            click(addElementButton);
        }
        logger.info("Clicked 'Add Element' button {} times", times);
        return this;
    }

    /**
     * Clicks the first "Delete" button that appears.
     */
    public ClickPage clickDeleteElement() {
        WebElement deleteButton = WaitUtils.waitForPresence(driver, By.cssSelector(".added-manually"));
        click(deleteButton);
        logger.info("Clicked first 'Delete' button");
        return this;
    }

    /**
     * Double-clicks the "Add Element" button.
     */
    public ClickPage doubleClickAddElement() {
        doubleClickElement(addElementButton);
        logger.info("Double-clicked 'Add Element' button");
        return this;
    }

    // ===================== Verification Methods =====================

    /**
     * Returns the count of "Delete" buttons currently displayed.
     */
    public int getDeleteButtonCount() {
        return elementsContainer.findElements(By.cssSelector(".added-manually")).size();
    }

    /**
     * Checks if any "Delete" buttons are present.
     */
    public boolean areDeleteButtonsPresent() {
        return getDeleteButtonCount() > 0;
    }

    public String getPageHeading() {
        return getText(pageHeading);
    }

    public boolean isAddElementButtonDisplayed() {
        return isDisplayed(addElementButton);
    }

    public boolean isAddElementButtonEnabled() {
        return isEnabled(addElementButton);
    }
}
