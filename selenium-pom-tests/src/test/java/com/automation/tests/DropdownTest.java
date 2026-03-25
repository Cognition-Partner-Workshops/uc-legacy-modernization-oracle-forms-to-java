package com.automation.tests;

import com.automation.pages.DropdownPage;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.util.List;

/**
 * Test class for Dropdown page operations.
 * Covers: selection by text, value, index, option enumeration,
 * and dropdown state verification.
 */
public class DropdownTest extends BaseTest {

    private DropdownPage dropdownPage;

    @BeforeMethod
    public void initPage() {
        dropdownPage = new DropdownPage(driver);
        dropdownPage.open();
    }

    @Test(priority = 1, description = "Verify dropdown page loads with correct heading")
    public void testDropdownPageHeading() {
        Assert.assertEquals(dropdownPage.getPageHeading(), "Dropdown List",
                "Page heading should be 'Dropdown List'");
    }

    @Test(priority = 2, description = "Verify dropdown is displayed and enabled")
    public void testDropdownIsDisplayed() {
        Assert.assertTrue(dropdownPage.isDropdownDisplayed(), "Dropdown should be displayed");
        Assert.assertTrue(dropdownPage.isDropdownEnabled(), "Dropdown should be enabled");
    }

    @Test(priority = 3, description = "Verify all dropdown options are present")
    public void testDropdownOptions() {
        List<String> options = dropdownPage.getAllOptions();
        Assert.assertTrue(options.size() >= 3, "Dropdown should have at least 3 options (including placeholder)");
        Assert.assertTrue(options.contains("Option 1"), "Dropdown should contain 'Option 1'");
        Assert.assertTrue(options.contains("Option 2"), "Dropdown should contain 'Option 2'");
    }

    @Test(priority = 4, description = "Select option by visible text and verify")
    public void testSelectByVisibleText() {
        dropdownPage.selectOptionByText("Option 1");
        Assert.assertEquals(dropdownPage.getSelectedOptionText(), "Option 1",
                "Selected option should be 'Option 1'");
    }

    @Test(priority = 5, description = "Select option by value attribute and verify")
    public void testSelectByValue() {
        dropdownPage.selectOptionByValue("2");
        Assert.assertEquals(dropdownPage.getSelectedOptionText(), "Option 2",
                "Selected option should be 'Option 2'");
    }

    @Test(priority = 6, description = "Select option by index and verify")
    public void testSelectByIndex() {
        dropdownPage.selectOptionByIndex(1);
        Assert.assertEquals(dropdownPage.getSelectedOptionText(), "Option 1",
                "Option at index 1 should be 'Option 1'");
    }

    @Test(priority = 7, description = "Change dropdown selection and verify update")
    public void testChangeSelection() {
        dropdownPage.selectOptionByText("Option 1");
        Assert.assertEquals(dropdownPage.getSelectedOptionText(), "Option 1");

        dropdownPage.selectOptionByText("Option 2");
        Assert.assertEquals(dropdownPage.getSelectedOptionText(), "Option 2",
                "Selection should change to 'Option 2'");
    }

    @Test(priority = 8, description = "Verify dropdown options count")
    public void testOptionsCount() {
        int count = dropdownPage.getOptionsCount();
        Assert.assertEquals(count, 3, "Dropdown should have exactly 3 options");
    }
}
