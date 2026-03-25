package com.automation.pages;

import com.automation.base.BasePage;
import com.automation.utils.WaitUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

import java.util.List;

/**
 * Page Object for mouse interaction pages:
 * - Hovers page (the-internet.herokuapp.com/hovers): hover to reveal hidden content
 * - Context Menu page (the-internet.herokuapp.com/context_menu): right-click actions
 * - Drag and Drop page (the-internet.herokuapp.com/drag_and_drop): drag-and-drop operations
 */
public class MouseActionsPage extends BasePage {

    // ===================== Hovers Page Locators =====================

    @FindBy(css = ".figure")
    private List<WebElement> userAvatars;

    @FindBy(css = ".figcaption h5")
    private List<WebElement> userNames;

    @FindBy(css = ".figcaption a")
    private List<WebElement> profileLinks;

    // ===================== Context Menu Locators =====================

    @FindBy(id = "hot-spot")
    private WebElement contextMenuArea;

    // ===================== Drag and Drop Locators =====================

    @FindBy(id = "column-a")
    private WebElement columnA;

    @FindBy(id = "column-b")
    private WebElement columnB;

    @FindBy(css = "h3")
    private WebElement pageHeading;

    // ===================== Constructor =====================

    public MouseActionsPage(WebDriver driver) {
        super(driver);
    }

    // ===================== Navigation =====================

    /**
     * Opens the Hovers page.
     */
    public MouseActionsPage openHovers() {
        navigateTo(config.getProperty("hovers.url"));
        return this;
    }

    /**
     * Opens the Context Menu page.
     */
    public MouseActionsPage openContextMenu() {
        navigateTo(config.getProperty("context_menu.url"));
        return this;
    }

    /**
     * Opens the Drag and Drop page.
     */
    public MouseActionsPage openDragAndDrop() {
        navigateTo(config.getProperty("drag_and_drop.url"));
        return this;
    }

    // ===================== Hover Actions =====================

    /**
     * Hovers over a user avatar at the given index (0-based).
     */
    public MouseActionsPage hoverOverUser(int index) {
        if (index < userAvatars.size()) {
            hoverOverElement(userAvatars.get(index));
            logger.info("Hovered over user avatar at index: {}", index);
        } else {
            throw new IndexOutOfBoundsException("Avatar index " + index + " out of bounds. Total: " + userAvatars.size());
        }
        return this;
    }

    /**
     * Returns the displayed name text after hovering over a user avatar.
     */
    public String getUserNameOnHover(int index) {
        hoverOverUser(index);
        WaitUtils.waitForVisibility(driver, userNames.get(index));
        return userNames.get(index).getText();
    }

    /**
     * Checks if the profile link is visible after hovering.
     */
    public boolean isProfileLinkVisible(int index) {
        hoverOverUser(index);
        try {
            WaitUtils.waitForVisibility(driver, profileLinks.get(index), 5);
            return profileLinks.get(index).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Clicks the profile link for a user after hovering.
     */
    public MouseActionsPage clickProfileLink(int index) {
        hoverOverUser(index);
        WaitUtils.waitForVisibility(driver, profileLinks.get(index));
        click(profileLinks.get(index));
        return this;
    }

    /**
     * Returns the number of user avatars on the page.
     */
    public int getUserAvatarCount() {
        return userAvatars.size();
    }

    // ===================== Context Menu Actions =====================

    /**
     * Right-clicks on the context menu area to trigger the context menu.
     */
    public MouseActionsPage rightClickContextArea() {
        rightClickElement(contextMenuArea);
        logger.info("Right-clicked on context menu area");
        return this;
    }

    /**
     * Checks if the context menu area is displayed.
     */
    public boolean isContextMenuAreaDisplayed() {
        return isDisplayed(contextMenuArea);
    }

    // ===================== Drag and Drop Actions =====================

    /**
     * Drags Column A to Column B.
     */
    public MouseActionsPage dragAToB() {
        dragAndDrop(columnA, columnB);
        logger.info("Dragged Column A to Column B");
        return this;
    }

    /**
     * Drags Column B to Column A.
     */
    public MouseActionsPage dragBToA() {
        dragAndDrop(columnB, columnA);
        logger.info("Dragged Column B to Column A");
        return this;
    }

    /**
     * Returns the header text of Column A.
     */
    public String getColumnAHeader() {
        return columnA.findElement(By.tagName("header")).getText();
    }

    /**
     * Returns the header text of Column B.
     */
    public String getColumnBHeader() {
        return columnB.findElement(By.tagName("header")).getText();
    }

    // ===================== Verification Methods =====================

    public String getPageHeading() {
        return getText(pageHeading);
    }
}
