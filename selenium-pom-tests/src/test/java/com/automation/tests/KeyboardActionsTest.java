package com.automation.tests;

import com.automation.pages.KeyboardActionsPage;
import org.openqa.selenium.Keys;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

/**
 * Test class for Keyboard action operations.
 * Covers: regular key presses, special keys (Enter, Tab, Escape, arrows),
 * function keys, key combinations, and result verification.
 */
public class KeyboardActionsTest extends BaseTest {

    private KeyboardActionsPage keyboardPage;

    @BeforeMethod
    public void initPage() {
        keyboardPage = new KeyboardActionsPage(driver);
        keyboardPage.open();
    }

    @Test(priority = 1, description = "Verify key presses page loads correctly")
    public void testKeyPressPageLoads() {
        Assert.assertTrue(keyboardPage.isInputFieldDisplayed(),
                "Input field should be displayed");
        Assert.assertEquals(keyboardPage.getPageHeading(), "Key Presses",
                "Page heading should be 'Key Presses'");
    }

    @Test(priority = 2, description = "Verify pressing a regular character key")
    public void testPressRegularKey() {
        keyboardPage.pressKey("A");
        String result = keyboardPage.getResultText();
        Assert.assertTrue(result.contains("A"),
                "Result should show the pressed key 'A'");
    }

    @Test(priority = 3, description = "Verify pressing the ENTER key")
    public void testPressEnter() {
        keyboardPage.pressEnter();
        String result = keyboardPage.getResultText();
        Assert.assertTrue(result.contains("ENTER"),
                "Result should indicate ENTER key was pressed");
    }

    @Test(priority = 4, description = "Verify pressing the TAB key")
    public void testPressTab() {
        keyboardPage.pressTab();
        String result = keyboardPage.getResultText();
        Assert.assertTrue(result.contains("TAB"),
                "Result should indicate TAB key was pressed");
    }

    @Test(priority = 5, description = "Verify pressing the ESCAPE key")
    public void testPressEscape() {
        keyboardPage.pressEscape();
        String result = keyboardPage.getResultText();
        Assert.assertTrue(result.contains("ESCAPE"),
                "Result should indicate ESCAPE key was pressed");
    }

    @Test(priority = 6, description = "Verify pressing the BACKSPACE key")
    public void testPressBackspace() {
        keyboardPage.typeText("Test");
        keyboardPage.pressBackspace();
        String result = keyboardPage.getResultText();
        Assert.assertTrue(result.contains("BACK_SPACE"),
                "Result should indicate BACK_SPACE key was pressed");
    }

    @Test(priority = 7, description = "Verify pressing the SPACE key")
    public void testPressSpace() {
        keyboardPage.pressSpace();
        String result = keyboardPage.getResultText();
        Assert.assertTrue(result.contains("SPACE"),
                "Result should indicate SPACE key was pressed");
    }

    @Test(priority = 8, description = "Verify pressing the UP arrow key")
    public void testPressArrowUp() {
        keyboardPage.pressArrowKey(Keys.ARROW_UP);
        String result = keyboardPage.getResultText();
        Assert.assertTrue(result.contains("UP"),
                "Result should indicate UP arrow key was pressed");
    }

    @Test(priority = 9, description = "Verify pressing the DOWN arrow key")
    public void testPressArrowDown() {
        keyboardPage.pressArrowKey(Keys.ARROW_DOWN);
        String result = keyboardPage.getResultText();
        Assert.assertTrue(result.contains("DOWN"),
                "Result should indicate DOWN arrow key was pressed");
    }

    @Test(priority = 10, description = "Verify pressing the LEFT arrow key")
    public void testPressArrowLeft() {
        keyboardPage.pressArrowKey(Keys.ARROW_LEFT);
        String result = keyboardPage.getResultText();
        Assert.assertTrue(result.contains("LEFT"),
                "Result should indicate LEFT arrow key was pressed");
    }

    @Test(priority = 11, description = "Verify pressing the RIGHT arrow key")
    public void testPressArrowRight() {
        keyboardPage.pressArrowKey(Keys.ARROW_RIGHT);
        String result = keyboardPage.getResultText();
        Assert.assertTrue(result.contains("RIGHT"),
                "Result should indicate RIGHT arrow key was pressed");
    }

    @Test(priority = 12, description = "Verify typing text into the input field")
    public void testTypeText() {
        keyboardPage.typeText("Selenium");
        String inputValue = keyboardPage.getInputValue();
        Assert.assertEquals(inputValue, "Selenium",
                "Input value should be 'Selenium'");
    }

    @Test(priority = 13, description = "Verify clearing the input field")
    public void testClearInput() {
        keyboardPage.typeText("Clear Me");
        keyboardPage.clearInput();
        String inputValue = keyboardPage.getInputValue();
        Assert.assertEquals(inputValue, "",
                "Input should be empty after clearing");
    }

    @Test(priority = 14, description = "Verify pressing the DELETE key")
    public void testPressDelete() {
        keyboardPage.pressDelete();
        String result = keyboardPage.getResultText();
        Assert.assertTrue(result.contains("DELETE"),
                "Result should indicate DELETE key was pressed");
    }
}
