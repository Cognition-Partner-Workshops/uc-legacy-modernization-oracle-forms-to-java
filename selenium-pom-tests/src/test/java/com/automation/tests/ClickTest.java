package com.automation.tests;

import com.automation.pages.ClickPage;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

/**
 * Test class for Click operations.
 * Covers: single click, JavaScript click, double click, multiple clicks,
 * dynamic element creation/deletion, and element state verification.
 */
public class ClickTest extends BaseTest {

    private ClickPage clickPage;

    @BeforeMethod
    public void initPage() {
        clickPage = new ClickPage(driver);
        clickPage.open();
    }

    @Test(priority = 1, description = "Verify Add/Remove Elements page loads correctly")
    public void testPageLoads() {
        Assert.assertEquals(clickPage.getPageHeading(), "Add/Remove Elements",
                "Page heading should be 'Add/Remove Elements'");
        Assert.assertTrue(clickPage.isAddElementButtonDisplayed(),
                "Add Element button should be displayed");
        Assert.assertTrue(clickPage.isAddElementButtonEnabled(),
                "Add Element button should be enabled");
    }

    @Test(priority = 2, description = "Verify clicking 'Add Element' creates a delete button")
    public void testClickAddElement() {
        Assert.assertFalse(clickPage.areDeleteButtonsPresent(),
                "No Delete buttons should exist initially");

        clickPage.clickAddElement();

        Assert.assertTrue(clickPage.areDeleteButtonsPresent(),
                "Delete button should appear after clicking Add Element");
        Assert.assertEquals(clickPage.getDeleteButtonCount(), 1,
                "There should be exactly 1 Delete button");
    }

    @Test(priority = 3, description = "Verify JavaScript click on 'Add Element'")
    public void testJsClickAddElement() {
        clickPage.jsClickAddElement();

        Assert.assertTrue(clickPage.areDeleteButtonsPresent(),
                "Delete button should appear after JS-clicking Add Element");
        Assert.assertEquals(clickPage.getDeleteButtonCount(), 1,
                "There should be exactly 1 Delete button");
    }

    @Test(priority = 4, description = "Verify clicking 'Add Element' multiple times")
    public void testClickAddElementMultipleTimes() {
        int count = 5;
        clickPage.clickAddElementMultipleTimes(count);

        Assert.assertEquals(clickPage.getDeleteButtonCount(), count,
                "There should be " + count + " Delete buttons");
    }

    @Test(priority = 5, description = "Verify deleting an added element")
    public void testDeleteElement() {
        clickPage.clickAddElement();
        Assert.assertEquals(clickPage.getDeleteButtonCount(), 1);

        clickPage.clickDeleteElement();

        Assert.assertFalse(clickPage.areDeleteButtonsPresent(),
                "No Delete buttons should remain after deletion");
    }

    @Test(priority = 6, description = "Verify add and delete cycle")
    public void testAddDeleteCycle() {
        // Add 3 elements
        clickPage.clickAddElementMultipleTimes(3);
        Assert.assertEquals(clickPage.getDeleteButtonCount(), 3);

        // Delete one
        clickPage.clickDeleteElement();
        Assert.assertEquals(clickPage.getDeleteButtonCount(), 2);

        // Delete another
        clickPage.clickDeleteElement();
        Assert.assertEquals(clickPage.getDeleteButtonCount(), 1);

        // Delete the last one
        clickPage.clickDeleteElement();
        Assert.assertFalse(clickPage.areDeleteButtonsPresent(),
                "All Delete buttons should be removed");
    }

    @Test(priority = 7, description = "Verify double-click on 'Add Element' button")
    public void testDoubleClickAddElement() {
        clickPage.doubleClickAddElement();

        // Double-click should add 2 elements (each click triggers one)
        int count = clickPage.getDeleteButtonCount();
        Assert.assertTrue(count >= 1,
                "At least 1 Delete button should appear after double-click");
        logger.info("Delete buttons after double-click: {}", count);
    }
}
