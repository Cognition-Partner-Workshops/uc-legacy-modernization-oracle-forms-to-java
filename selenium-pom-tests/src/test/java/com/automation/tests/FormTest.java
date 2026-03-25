package com.automation.tests;

import com.automation.pages.FormPage;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

/**
 * Test class for Form operations.
 * Covers: checkbox toggling, select/deselect all, number input,
 * field clearing, and form state verification.
 */
public class FormTest extends BaseTest {

    private FormPage formPage;

    @BeforeMethod
    public void initPage() {
        formPage = new FormPage(driver);
    }

    // ===================== Checkbox Tests =====================

    @Test(priority = 1, description = "Verify checkboxes page loads correctly")
    public void testCheckboxPageLoads() {
        formPage.openCheckboxes();
        Assert.assertTrue(formPage.isCheckboxFormDisplayed(), "Checkbox form should be displayed");
        Assert.assertEquals(formPage.getCheckboxCount(), 2, "There should be 2 checkboxes");
    }

    @Test(priority = 2, description = "Verify toggling first checkbox")
    public void testToggleFirstCheckbox() {
        formPage.openCheckboxes();
        boolean initialState = formPage.isCheckboxSelected(0);
        formPage.toggleCheckbox(0);
        Assert.assertNotEquals(formPage.isCheckboxSelected(0), initialState,
                "Checkbox state should be toggled");
    }

    @Test(priority = 3, description = "Verify checking an unchecked checkbox")
    public void testCheckCheckbox() {
        formPage.openCheckboxes();
        formPage.checkCheckbox(0);
        Assert.assertTrue(formPage.isCheckboxSelected(0), "Checkbox should be checked");
    }

    @Test(priority = 4, description = "Verify unchecking a checked checkbox")
    public void testUncheckCheckbox() {
        formPage.openCheckboxes();
        formPage.checkCheckbox(1);
        formPage.uncheckCheckbox(1);
        Assert.assertFalse(formPage.isCheckboxSelected(1), "Checkbox should be unchecked");
    }

    @Test(priority = 5, description = "Verify selecting all checkboxes")
    public void testSelectAllCheckboxes() {
        formPage.openCheckboxes();
        formPage.selectAllCheckboxes();
        for (int i = 0; i < formPage.getCheckboxCount(); i++) {
            Assert.assertTrue(formPage.isCheckboxSelected(i),
                    "Checkbox " + i + " should be selected");
        }
    }

    @Test(priority = 6, description = "Verify deselecting all checkboxes")
    public void testDeselectAllCheckboxes() {
        formPage.openCheckboxes();
        formPage.selectAllCheckboxes();
        formPage.deselectAllCheckboxes();
        for (int i = 0; i < formPage.getCheckboxCount(); i++) {
            Assert.assertFalse(formPage.isCheckboxSelected(i),
                    "Checkbox " + i + " should be deselected");
        }
    }

    // ===================== Input Tests =====================

    @Test(priority = 7, description = "Verify inputs page loads correctly")
    public void testInputPageLoads() {
        formPage.openInputs();
        Assert.assertTrue(formPage.isNumberInputDisplayed(), "Number input should be displayed");
    }

    @Test(priority = 8, description = "Verify entering a number into the input field")
    public void testEnterNumber() {
        formPage.openInputs();
        formPage.enterNumber("42");
        Assert.assertEquals(formPage.getNumberInputValue(), "42",
                "Number input should contain '42'");
    }

    @Test(priority = 9, description = "Verify clearing the number input field")
    public void testClearNumberInput() {
        formPage.openInputs();
        formPage.enterNumber("100");
        formPage.clearNumberInput();
        Assert.assertEquals(formPage.getNumberInputValue(), "",
                "Number input should be empty after clearing");
    }

    @Test(priority = 10, description = "Verify updating a number input value")
    public void testUpdateNumberInput() {
        formPage.openInputs();
        formPage.enterNumber("50");
        Assert.assertEquals(formPage.getNumberInputValue(), "50");

        formPage.enterNumber("75");
        Assert.assertEquals(formPage.getNumberInputValue(), "75",
                "Number input should be updated to '75'");
    }
}
