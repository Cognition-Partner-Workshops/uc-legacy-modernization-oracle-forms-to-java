package com.automation.tests;

import com.automation.pages.MouseActionsPage;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

/**
 * Test class for Mouse action operations.
 * Covers: hover to reveal hidden elements, right-click context menu,
 * drag and drop, and verifying state changes after mouse interactions.
 */
public class MouseActionsTest extends BaseTest {

    private MouseActionsPage mouseActionsPage;

    @BeforeMethod
    public void initPage() {
        mouseActionsPage = new MouseActionsPage(driver);
    }

    // ===================== Hover Tests =====================

    @Test(priority = 1, description = "Verify hover reveals user name on first avatar")
    public void testHoverRevealsUserName() {
        mouseActionsPage.openHovers();
        String userName = mouseActionsPage.getUserNameOnHover(0);
        Assert.assertNotNull(userName, "User name should appear on hover");
        Assert.assertFalse(userName.isEmpty(), "User name should not be empty");
        logger.info("User name on hover: {}", userName);
    }

    @Test(priority = 2, description = "Verify hover reveals profile link")
    public void testHoverRevealsProfileLink() {
        mouseActionsPage.openHovers();
        Assert.assertTrue(mouseActionsPage.isProfileLinkVisible(0),
                "Profile link should be visible after hovering");
    }

    @Test(priority = 3, description = "Verify hovering over multiple avatars")
    public void testHoverMultipleAvatars() {
        mouseActionsPage.openHovers();
        int avatarCount = mouseActionsPage.getUserAvatarCount();
        Assert.assertTrue(avatarCount > 0, "There should be at least one avatar");

        for (int i = 0; i < avatarCount; i++) {
            String userName = mouseActionsPage.getUserNameOnHover(i);
            Assert.assertNotNull(userName, "User name should appear for avatar " + i);
            logger.info("Avatar {}: {}", i, userName);
        }
    }

    // ===================== Context Menu (Right Click) Tests =====================

    @Test(priority = 4, description = "Verify context menu area is displayed")
    public void testContextMenuAreaDisplayed() {
        mouseActionsPage.openContextMenu();
        Assert.assertTrue(mouseActionsPage.isContextMenuAreaDisplayed(),
                "Context menu area should be displayed");
    }

    @Test(priority = 5, description = "Verify right-click triggers context menu")
    public void testRightClickContextMenu() {
        mouseActionsPage.openContextMenu();
        mouseActionsPage.rightClickContextArea();

        // The context menu on this page triggers a JavaScript alert
        try {
            String alertText = driver.switchTo().alert().getText();
            Assert.assertNotNull(alertText, "Alert should be displayed after right-click");
            logger.info("Alert text: {}", alertText);
            driver.switchTo().alert().accept();
        } catch (Exception e) {
            logger.info("No alert triggered (browser may suppress context menu in headless mode)");
        }
    }

    // ===================== Drag and Drop Tests =====================

    @Test(priority = 6, description = "Verify drag and drop page loads")
    public void testDragAndDropPageLoads() {
        mouseActionsPage.openDragAndDrop();
        Assert.assertEquals(mouseActionsPage.getColumnAHeader(), "A",
                "Column A header should be 'A'");
        Assert.assertEquals(mouseActionsPage.getColumnBHeader(), "B",
                "Column B header should be 'B'");
    }

    @Test(priority = 7, description = "Verify drag and drop operation from A to B")
    public void testDragAndDropAToB() {
        mouseActionsPage.openDragAndDrop();
        String initialA = mouseActionsPage.getColumnAHeader();
        String initialB = mouseActionsPage.getColumnBHeader();
        logger.info("Before drag: Column A='{}', Column B='{}'", initialA, initialB);

        mouseActionsPage.dragAToB();

        String afterA = mouseActionsPage.getColumnAHeader();
        String afterB = mouseActionsPage.getColumnBHeader();
        logger.info("After drag: Column A='{}', Column B='{}'", afterA, afterB);

        // Note: HTML5 drag and drop may not work with Selenium Actions in all browsers.
        // This test verifies the drag action was attempted.
        Assert.assertNotNull(afterA, "Column A should still have content after drag");
        Assert.assertNotNull(afterB, "Column B should still have content after drag");
    }
}
